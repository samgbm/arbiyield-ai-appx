/**
 * Demo seeder: 10 aid provenance trails → Stylus `logAidCheckpoint` + Supabase.
 *
 * Usage: npm run seed:aid
 * Requires: SEEDER_PRIVATE_KEY, RPC + Supabase env (see .env.local / .env.example)
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  parseAbi,
  toBytes,
  zeroHash,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import { createClient } from "@supabase/supabase-js";

const NINO_ADDRESS = (process.env.NEXT_PUBLIC_NINO_CONTRACT_ADDRESS ||
  "0x3b22f5c054919b8798d1422e92ba57f53b63570b") as `0x${string}`;

const ninoAbi = parseAbi([
  "function logAidCheckpoint(bytes32 batch_hash, string location_name)",
  "function verifyAidBatch(bytes32 batch_hash) view returns (string, uint256, bool)",
  "function flagAidBatch(bytes32 batch_hash)",
  "function getAdmin() view returns (address)",
  "function initialize()",
]);

type StepType = "farm" | "factory" | "depot" | "store";

type SeedStep = {
  type: StepType;
  location: string;
  facilityId: string;
  farmName?: string;
  weightKg: number;
  tempC: number;
  sensorId: string;
  handler: string;
  arrivedAt: string;
  departedAt?: string;
};

type SeedTrail = {
  code: string;
  product: string;
  originFarm: string;
  /** If true, call flagAidBatch on the tip after logging (compromised demo). */
  flagTip?: boolean;
  steps: SeedStep[];
};

function computeAidStepHash(parentHash: Hex | null, parts: string[]): Hex {
  const payload = [parentHash ?? zeroHash, ...parts].join("|");
  return keccak256(toBytes(payload));
}

/** 10 deterministic trails for the live demo. AID-001 tip = DEMO_AID_BATCH_HASH. */
const SEED_TRAILS: SeedTrail[] = [
  {
    code: "AID-001",
    product: "Flood-relief rice kits",
    originFarm: "Cooperativa Piura Norte",
    steps: [
      {
        type: "farm",
        location: "Piura Cooperative Hub",
        facilityId: "FARM-PIU-01",
        farmName: "Cooperativa Piura Norte",
        weightKg: 500,
        tempC: 22,
        sensorId: "SEN-1",
        handler: "Maria Quispe",
        arrivedAt: "2026-08-01T08:00:00.000Z",
        departedAt: "2026-08-01T12:00:00.000Z",
      },
      {
        type: "factory",
        location: "Chiclayo Packing Plant",
        facilityId: "FAC-9082",
        weightKg: 498,
        tempC: 18,
        sensorId: "SEN-4",
        handler: "Plant Gate B",
        arrivedAt: "2026-08-02T14:30:00.000Z",
        departedAt: "2026-08-03T10:00:00.000Z",
      },
      {
        type: "depot",
        location: "Trujillo Cold Depot",
        facilityId: "DEP-TRU-12",
        weightKg: 495,
        tempC: 4,
        sensorId: "SEN-9",
        handler: "Cold-chain unit 3",
        arrivedAt: "2026-08-04T09:15:00.000Z",
        departedAt: "2026-08-05T07:00:00.000Z",
      },
      {
        type: "store",
        location: "Lima Aid Distribution Store",
        facilityId: "STR-LIM-03",
        weightKg: 490,
        tempC: 6,
        sensorId: "SEN-11",
        handler: "Store intake",
        arrivedAt: "2026-08-06T16:45:00.000Z",
      },
    ],
  },
  {
    code: "AID-002",
    product: "Water purification tablets",
    originFarm: "Asociación Tumbes Verde",
    steps: buildDefaultSteps("AID-002", "Tumbes", "Asociación Tumbes Verde", 2),
  },
  {
    code: "AID-003",
    product: "Emergency shelter tarps",
    originFarm: "Lambayeque Coastal Co-op",
    steps: buildDefaultSteps("AID-003", "Lambayeque", "Lambayeque Coastal Co-op", 3),
  },
  {
    code: "AID-004",
    product: "Oral rehydration kits",
    originFarm: "La Libertad Family Farms",
    steps: buildDefaultSteps("AID-004", "La Libertad", "La Libertad Family Farms", 4),
  },
  {
    code: "AID-005",
    product: "Infant nutrition packs",
    originFarm: "Ancash Highland Collective",
    steps: buildDefaultSteps("AID-005", "Ancash", "Ancash Highland Collective", 5),
  },
  {
    code: "AID-006",
    product: "Mosquito nets (LLIN)",
    originFarm: "Piura Delta Growers",
    flagTip: true,
    steps: buildDefaultSteps("AID-006", "Piura", "Piura Delta Growers", 6),
  },
  {
    code: "AID-007",
    product: "Solar lantern kits",
    originFarm: "Tumbes Mangrove Co-op",
    steps: buildDefaultSteps("AID-007", "Tumbes", "Tumbes Mangrove Co-op", 7),
  },
  {
    code: "AID-008",
    product: "Hygiene dignity kits",
    originFarm: "Chiclayo Women's Alliance",
    steps: buildDefaultSteps("AID-008", "Lambayeque", "Chiclayo Women's Alliance", 8),
  },
  {
    code: "AID-009",
    product: "Seed starter packs",
    originFarm: "Trujillo Valley Association",
    steps: buildDefaultSteps("AID-009", "La Libertad", "Trujillo Valley Association", 9),
  },
  {
    code: "AID-010",
    product: "Medical first-aid crates",
    originFarm: "Huaraz Mountain Co-op",
    steps: buildDefaultSteps("AID-010", "Ancash", "Huaraz Mountain Co-op", 10),
  },
];

function buildDefaultSteps(
  code: string,
  region: string,
  farm: string,
  salt: number,
): SeedStep[] {
  const day = String(salt).padStart(2, "0");
  return [
    {
      type: "farm",
      location: `${region} Cooperative Hub`,
      facilityId: `FARM-${region.slice(0, 3).toUpperCase()}-${day}`,
      farmName: farm,
      weightKg: 400 + salt * 10,
      tempC: 20 + (salt % 5),
      sensorId: `SEN-${salt}A`,
      handler: "Harvest lead",
      arrivedAt: `2026-08-${day}T08:00:00.000Z`,
      departedAt: `2026-08-${day}T14:00:00.000Z`,
    },
    {
      type: "factory",
      location: `${region} Packing Plant`,
      facilityId: `FAC-${9000 + salt}`,
      weightKg: 395 + salt * 10,
      tempC: 16,
      sensorId: `SEN-${salt}B`,
      handler: "Intake dock",
      arrivedAt: `2026-08-${day}T18:00:00.000Z`,
      departedAt: `2026-08-${String(Math.min(28, salt + 1)).padStart(2, "0")}T10:00:00.000Z`,
    },
    {
      type: "depot",
      location: `${region} Cold Depot`,
      facilityId: `DEP-${region.slice(0, 3).toUpperCase()}-${day}`,
      weightKg: 390 + salt * 10,
      tempC: 3 + (salt % 3),
      sensorId: `SEN-${salt}C`,
      handler: "Cold-chain unit",
      arrivedAt: `2026-08-${String(Math.min(28, salt + 2)).padStart(2, "0")}T09:00:00.000Z`,
      departedAt: `2026-08-${String(Math.min(28, salt + 3)).padStart(2, "0")}T06:00:00.000Z`,
    },
    {
      type: "store",
      location: `${region} Aid Distribution Point`,
      facilityId: `STR-${region.slice(0, 3).toUpperCase()}-${day}`,
      weightKg: 385 + salt * 10,
      tempC: 5,
      sensorId: `SEN-${salt}D`,
      handler: "Last-mile intake",
      arrivedAt: `2026-08-${String(Math.min(28, salt + 4)).padStart(2, "0")}T16:00:00.000Z`,
    },
  ];
}

function loadEnvFile(filename: string) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function normalizePrivateKey(raw: string): Hex {
  const trimmed = raw.trim();
  const withPrefix = trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
  if (!/^0x[a-fA-F0-9]{64}$/.test(withPrefix)) {
    throw new Error("SEEDER_PRIVATE_KEY must be a 32-byte hex private key");
  }
  return withPrefix as Hex;
}

async function estimateFees(publicClient: ReturnType<typeof createPublicClient>) {
  const fallbackPriority = BigInt(10_000_000);
  const [block, priorityFee] = await Promise.all([
    publicClient.getBlock({ blockTag: "latest" }),
    publicClient
      .estimateMaxPriorityFeePerGas()
      .catch(() => fallbackPriority),
  ]);
  const baseFee = block.baseFeePerGas ?? BigInt(20_000_000);
  const maxPriorityFeePerGas =
    priorityFee > BigInt(0) ? priorityFee : fallbackPriority;
  const maxFeePerGas = baseFee * BigInt(3) + maxPriorityFeePerGas;
  return { maxFeePerGas, maxPriorityFeePerGas };
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  console.log("🚀 El Niño aid provenance seeder — Stylus + Supabase\n");

  const rpcUrl =
    process.env.NEXT_PUBLIC_RPC_URL?.trim() ||
    process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL?.trim() ||
    "https://sepolia-rollup.arbitrum.io/rpc";

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const privateKey = normalizePrivateKey(requireEnv("SEEDER_PRIVATE_KEY"));
  const account = privateKeyToAccount(privateKey);

  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(rpcUrl),
  });
  const walletClient = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(rpcUrl),
  });
  const supabase = createClient(supabaseUrl, supabaseKey);

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`📍 Contract: ${NINO_ADDRESS}`);
  console.log(`👛 Seeder:   ${account.address}`);
  console.log(`⛽ Balance:  ${(Number(balance) / 1e18).toFixed(4)} ETH`);
  console.log(`🗂️  Trails:   ${SEED_TRAILS.length} (4 checkpoints each)\n`);

  if (balance === BigInt(0)) {
    throw new Error("Seeder wallet has 0 ETH on Arbitrum Sepolia — fund it first.");
  }

  // Preflight tip for AID-001 (presentation QR).
  {
    let parent: Hex | null = null;
    const t = SEED_TRAILS[0]!;
    for (const s of t.steps) {
      parent = computeAidStepHash(parent, [
        t.code,
        s.type,
        s.location,
        s.facilityId,
        String(s.weightKg),
        String(s.tempC),
        s.sensorId,
        s.arrivedAt,
      ]);
    }
    console.log(`🎫 Demo QR tip (AID-001): ${parent}\n`);
  }

  let seeded = 0;

  for (let i = 0; i < SEED_TRAILS.length; i++) {
    const trail = SEED_TRAILS[i]!;
    console.log(`────────────────────────────────────────`);
    console.log(`⏳ [${i + 1}/${SEED_TRAILS.length}] ${trail.code} — ${trail.product}`);

    const { data: existingShip } = await supabase
      .from("aid_shipments")
      .select("id")
      .eq("trail_code", trail.code)
      .maybeSingle();

    let shipmentId = existingShip?.id as string | undefined;
    if (!shipmentId) {
      const { data: inserted, error: shipErr } = await supabase
        .from("aid_shipments")
        .insert({
          trail_code: trail.code,
          product_name: trail.product,
          origin_farm: trail.originFarm,
          tip_hash: zeroHash,
          is_flagged: false,
        })
        .select("id")
        .single();
      if (shipErr || !inserted) {
        throw new Error(
          `Supabase aid_shipments insert failed: ${shipErr?.message ?? "no row"}`,
        );
      }
      shipmentId = inserted.id as string;
    } else {
      await supabase
        .from("aid_shipments")
        .update({
          product_name: trail.product,
          origin_farm: trail.originFarm,
        })
        .eq("id", shipmentId);
    }
    let parent: Hex | null = null;
    let tipHash: Hex = zeroHash;
    let tipTx: Hex | undefined;

    for (let stepIndex = 0; stepIndex < trail.steps.length; stepIndex++) {
      const step = trail.steps[stepIndex]!;
      const stepHash = computeAidStepHash(parent, [
        trail.code,
        step.type,
        step.location,
        step.facilityId,
        String(step.weightKg),
        String(step.tempC),
        step.sensorId,
        step.arrivedAt,
      ]);

      // Skip on-chain log if already notarized (idempotent re-seed).
      const existing = await publicClient.readContract({
        address: NINO_ADDRESS,
        abi: ninoAbi,
        functionName: "verifyAidBatch",
        args: [stepHash],
      });
      let txHash: Hex | null = null;

      if (existing[1] > BigInt(0)) {
        console.log(`   ↷ ${step.type} already on-chain ${stepHash.slice(0, 12)}…`);
      } else {
        const fees = await estimateFees(publicClient);
        txHash = await walletClient.writeContract({
          address: NINO_ADDRESS,
          abi: ninoAbi,
          functionName: "logAidCheckpoint",
          args: [stepHash, step.location],
          maxFeePerGas: fees.maxFeePerGas,
          maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
        });
        console.log(`   📤 ${step.type} tx ${txHash}`);
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
          confirmations: 1,
        });
        if (receipt.status !== "success") {
          throw new Error(`logAidCheckpoint reverted for ${trail.code}/${step.type}`);
        }
      }

      const { error: cpErr } = await supabase.from("aid_checkpoints").upsert(
        {
          shipment_id: shipmentId,
          step_index: stepIndex,
          step_type: step.type,
          location_name: step.location,
          facility_id: step.facilityId,
          farm_name: step.farmName ?? null,
          batch_weight_kg: step.weightKg,
          temperature_c: step.tempC,
          sensor_id: step.sensorId,
          handler_name: step.handler,
          arrived_at: step.arrivedAt,
          departed_at: step.departedAt ?? null,
          parent_hash: parent,
          step_hash: stepHash,
          tx_hash: txHash,
        },
        { onConflict: "step_hash" },
      );

      if (cpErr) {
        throw new Error(`Supabase aid_checkpoints upsert failed: ${cpErr.message}`);
      }

      parent = stepHash;
      tipHash = stepHash;
      if (txHash) tipTx = txHash;
    }

    await supabase
      .from("aid_shipments")
      .update({
        tip_hash: tipHash,
        tip_tx_hash: tipTx ?? null,
        is_flagged: Boolean(trail.flagTip),
      })
      .eq("id", shipmentId);

    if (trail.flagTip) {
      const verified = await publicClient.readContract({
        address: NINO_ADDRESS,
        abi: ninoAbi,
        functionName: "verifyAidBatch",
        args: [tipHash],
      });
      if (!verified[2]) {
        const fees = await estimateFees(publicClient);
        const flagTx = await walletClient.writeContract({
          address: NINO_ADDRESS,
          abi: ninoAbi,
          functionName: "flagAidBatch",
          args: [tipHash],
          maxFeePerGas: fees.maxFeePerGas,
          maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
        });
        await publicClient.waitForTransactionReceipt({ hash: flagTx });
        console.log(`   🚩 Flagged tip as compromised (${flagTx})`);
      } else {
        console.log(`   🚩 Tip already flagged`);
      }
    }

    console.log(`   ✅ Tip ${tipHash}`);
    seeded += 1;
  }

  console.log(`\n🎉 Done — seeded ${seeded}/${SEED_TRAILS.length} trails.`);
  console.log("   Open /el-nino/logistics → Simulate QR Scan for AID-001.\n");
}

if (require.main === module) {
  main().catch((err) => {
    console.error("\n❌ Seed failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
