/**
 * Demo seeder: create MeleePMM markets on Arbitrum Sepolia + mirror metadata in Supabase.
 *
 * Usage: npm run seed
 * Requires: SEEDER_PRIVATE_KEY, RPC + Supabase env (see .env.local / .env.example)
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  parseEventLogs,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import { createClient } from "@supabase/supabase-js";

const PMM_ADDRESS = (process.env.NEXT_PUBLIC_PMM_CONTRACT_ADDRESS ||
  "0x558a0f52d9fc7c0b13afe7965f6e757d6812527c") as `0x${string}`;

/** Demo creator recorded in Supabase (must match the seeder wallet). */
const CREATOR_ADDRESS =
  "0xca76951A11A9adE6553ef54AB1d1260f08c3460d" as const;

const pmmAbi = parseAbi([
  "function marketCount() view returns (uint256)",
  "function createMarket(uint64 end_timestamp) returns (uint256)",
  "event MarketCreated(uint256 indexed marketId, address indexed creator, uint256 endTimestamp)",
]);

type SeedMarket = {
  title: string;
  description: string;
  category: "Crypto" | "Culture" | "AI" | "Sports" | "Macro";
  /** Absolute future ISO / date used for createMarket end_timestamp. */
  endDate: string;
};

const SEED_MARKETS: SeedMarket[] = [
  {
    title: "Will ETH Lima have over 1000 attendees?",
    description:
      "Resolves YES if official ETH Lima 2026 attendance (published by organizers or Luma check-ins) is ≥ 1,000 unique attendees. Source: ETH Lima / ETHGlobal wrap-up post.",
    category: "Culture",
    endDate: daysFromNow(10),
  },
  {
    title: "Will the Fed cut rates in Sept 2026?",
    description:
      "Resolves YES if the FOMC announces a cut to the federal funds target range at the September 2026 meeting. Source: Federal Reserve FOMC statement.",
    category: "Macro",
    endDate: daysFromNow(45),
  },
  {
    title: "Will GTA 6 announce a specific release date this month?",
    description:
      "Resolves YES if Rockstar Games or Take-Two publishes a calendar day (YYYY-MM-DD or equivalent) for GTA VI within the calendar month of market creation. Trailers without a day do not count.",
    category: "Culture",
    endDate: daysFromNow(28),
  },
  {
    title: "Will ETH reclaim $5,000 before Q4 2026?",
    description:
      "Resolves YES if CoinGecko ETH/USD prints ≥ $5,000 on any UTC day before Oct 1, 2026. Source: CoinGecko spot.",
    category: "Crypto",
    endDate: daysFromNow(60),
  },
  {
    title: "Will Arbitrum Stylus TVL exceed $100M this quarter?",
    description:
      "Resolves YES if DefiLlama (or an Arbitrum Foundation dashboard) reports aggregate Stylus-related TVL ≥ $100M before quarter end. Snapshot taken at 23:59 UTC on the end date.",
    category: "Crypto",
    endDate: daysFromNow(50),
  },
  {
    title: "Will OpenAI ship GPT-5 publicly in 2026?",
    description:
      "Resolves YES if OpenAI announces general availability of a model branded GPT-5 (API or ChatGPT) before Jan 1, 2027. Research previews without public access do not count.",
    category: "AI",
    endDate: daysFromNow(90),
  },
  {
    title: "Will Brazil win the 2026 FIFA World Cup?",
    description:
      "Resolves YES if Brazil is crowned champion of the 2026 FIFA World Cup. Source: FIFA official results.",
    category: "Sports",
    endDate: daysFromNow(120),
  },
  {
    title: "Will SOL flip ETH by market cap this year?",
    description:
      "Resolves YES if Solana’s circulating market cap exceeds Ethereum’s on CoinGecko at any daily UTC close before Jan 1, 2027.",
    category: "Crypto",
    endDate: daysFromNow(100),
  },
  {
    title: "Will US spot ETH ETFs see net inflows in August 2026?",
    description:
      "Resolves YES if aggregated US spot Ether ETF net flows for August 2026 are positive per Farside / Bloomberg tallies published after month close.",
    category: "Macro",
    endDate: daysFromNow(35),
  },
  {
    title: "Will a Stylus dapp win a major hackathon prize in 2026?",
    description:
      "Resolves YES if an Arbitrum Stylus-powered project is listed as a top-3 / track winner at ETHGlobal, ETH Lima, or an official Arbitrum hackathon before year end. Source: official winners blog.",
    category: "AI",
    endDate: daysFromNow(75),
  },
];

function daysFromNow(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(23, 59, 59, 0);
  return d.toISOString();
}

/** Minimal .env loader so `npm run seed` picks up `.env.local` without dotenv. */
function loadEnvFile(fileName: string) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return;

  for (const rawLine of readFileSync(filePath, "utf8").split("\n")) {
    const line = rawLine.trim();
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
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
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

function endDateToUnixSeconds(endDate: string): bigint {
  const ms = Date.parse(endDate);
  if (Number.isNaN(ms)) {
    throw new Error(`Invalid endDate: ${endDate}`);
  }
  const seconds = Math.floor(ms / 1000);
  if (seconds <= Math.floor(Date.now() / 1000)) {
    throw new Error(`endDate must be in the future: ${endDate}`);
  }
  return BigInt(seconds);
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

  console.log("🚀 ArbiYield demo seeder — MeleePMM + Supabase\n");

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

  if (account.address.toLowerCase() !== CREATOR_ADDRESS.toLowerCase()) {
    console.warn(
      `⚠️  Seeder wallet ${account.address} ≠ expected creator ${CREATOR_ADDRESS}`,
    );
    console.warn("   Supabase rows will still use the expected creator_address.\n");
  }

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
  console.log(`📍 Contract: ${PMM_ADDRESS}`);
  console.log(`👛 Seeder:   ${account.address}`);
  console.log(`⛽ Balance:  ${(Number(balance) / 1e18).toFixed(4)} ETH`);
  console.log(`🗂️  Markets:  ${SEED_MARKETS.length} to deploy\n`);

  if (balance === BigInt(0)) {
    throw new Error("Seeder wallet has 0 ETH on Arbitrum Sepolia — fund it first.");
  }

  let created = 0;

  for (let i = 0; i < SEED_MARKETS.length; i++) {
    const market = SEED_MARKETS[i]!;
    const n = i + 1;

    console.log(`────────────────────────────────────────`);
    console.log(`⏳ [${n}/${SEED_MARKETS.length}] ${market.title}`);

    const endTimestamp = endDateToUnixSeconds(market.endDate);
    const fees = await estimateFees(publicClient);

    const hash = await walletClient.writeContract({
      address: PMM_ADDRESS,
      abi: pmmAbi,
      functionName: "createMarket",
      args: [endTimestamp],
      maxFeePerGas: fees.maxFeePerGas,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
    });

    console.log(`   📤 Tx sent: ${hash}`);
    console.log(`   ⏳ Waiting for confirmation…`);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
    });

    if (receipt.status !== "success") {
      throw new Error(`createMarket reverted for "${market.title}" (${hash})`);
    }

    let marketId: bigint | null = null;
    try {
      const logs = parseEventLogs({
        abi: pmmAbi,
        eventName: "MarketCreated",
        logs: receipt.logs,
      });
      const createdLog = logs[0];
      if (createdLog?.args?.marketId !== undefined) {
        marketId = createdLog.args.marketId;
      }
    } catch {
      // Fall through to marketCount.
    }

    if (marketId == null) {
      const count = await publicClient.readContract({
        address: PMM_ADDRESS,
        abi: pmmAbi,
        functionName: "marketCount",
      });
      marketId = count - BigInt(1);
    }

    const id = Number(marketId);
    console.log(`   🔗 On-chain marketId: ${id}`);

    const { error } = await supabase.from("markets").upsert(
      {
        id,
        title: market.title,
        description: market.description,
        category: market.category,
        creator_address: CREATOR_ADDRESS,
      },
      { onConflict: "id" },
    );

    if (error) {
      throw new Error(
        `Supabase upsert failed for market ${id}: ${error.message}`,
      );
    }

    console.log(`   ✅ Metadata saved to Supabase (id=${id})`);
    created += 1;
  }

  console.log(`\n🎉 Done — seeded ${created}/${SEED_MARKETS.length} markets.`);
  console.log("   Open /markets to see the live demo hub.\n");
}

// CLI entry only (ts-node CommonJS).
if (require.main === module) {
  main().catch((err) => {
    console.error("\n❌ Seed failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
