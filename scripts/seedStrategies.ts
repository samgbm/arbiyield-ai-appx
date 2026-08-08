/**
 * Live seeder: register strategy ids on Stylus + full metadata (incl. steps) in Supabase.
 *
 * Usage: npm run seed:strategies
 * Requires: SEEDER_PRIVATE_KEY, RPC + Supabase env
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import { createClient } from "@supabase/supabase-js";
import { DEMO_STRATEGIES } from "../src/data/mockStrategies";

const STRATEGY_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x0d5170e733955952906011451dd89b7059e973a3") as `0x${string}`;

const strategyAbi = parseAbi([
  "function createStrategy(string id)",
  "function getStrategyCreator(string id) view returns (address)",
  "function getAllStrategies() view returns ((string,address)[])",
  "event StrategyCreated(address indexed creator, string id)",
]);

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

  console.log("🚀 Live strategy seeder — Stylus id+creator + Supabase metadata\n");

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

  console.log(`📍 Contract: ${STRATEGY_ADDRESS}`);
  console.log(`👛 Creator: ${account.address}`);
  console.log(`🗂️  Strategies: ${DEMO_STRATEGIES.length}\n`);

  let created = 0;

  for (let i = 0; i < DEMO_STRATEGIES.length; i++) {
    const s = DEMO_STRATEGIES[i]!;
    console.log(`────────────────────────────────────────`);
    console.log(`⏳ [${i + 1}/${DEMO_STRATEGIES.length}] ${s.id}`);

    const existingCreator = await publicClient.readContract({
      address: STRATEGY_ADDRESS,
      abi: strategyAbi,
      functionName: "getStrategyCreator",
      args: [s.id],
    });

    let txHash: Hex | null = null;

    if (
      existingCreator &&
      existingCreator !== "0x0000000000000000000000000000000000000000"
    ) {
      console.log(`   ↷ already on-chain (creator ${existingCreator.slice(0, 10)}…)`);
    } else {
      const fees = await estimateFees(publicClient);
      txHash = await walletClient.writeContract({
        address: STRATEGY_ADDRESS,
        abi: strategyAbi,
        functionName: "createStrategy",
        args: [s.id],
        maxFeePerGas: fees.maxFeePerGas,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      });
      console.log(`   📤 createStrategy tx ${txHash}`);
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
      });
      if (receipt.status !== "success") {
        throw new Error(`createStrategy reverted for ${s.id}`);
      }
    }

    const { error } = await supabase.from("strategies").upsert(
      {
        id: s.id,
        name: s.name,
        description: s.description,
        protocol: s.protocol,
        risk_level: s.riskLevel,
        apy_pct: s.apy,
        tvl_usd: s.tvl,
        sharpe: s.kpis.sharpe,
        utilization_pct: s.kpis.utilization,
        health_factor: s.kpis.healthFactor,
        weekly_pnl_pct: s.kpis.weeklyPnlPct,
        tags: s.protocol.split("·").map((t) => t.trim()).filter(Boolean),
        narrative: `${s.name} — ${s.description}`,
        execution_steps: s.steps,
        creator_address: account.address,
        create_tx_hash: txHash,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) {
      throw new Error(`Supabase upsert failed for ${s.id}: ${error.message}`);
    }

    console.log(`   ✅ Supabase metadata saved (steps=${s.steps.length})`);
    created += 1;
  }

  const all = await publicClient.readContract({
    address: STRATEGY_ADDRESS,
    abi: strategyAbi,
    functionName: "getAllStrategies",
  });

  console.log(`\n🎉 Done — ${created}/${DEMO_STRATEGIES.length} strategies wired.`);
  console.log(`   On-chain registry size: ${all.length}`);
  console.log("   Open /strategies (Live Network) to browse them.\n");
}

if (require.main === module) {
  main().catch((err) => {
    console.error("\n❌ Seed failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
