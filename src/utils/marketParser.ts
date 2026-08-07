import { formatEther } from "viem";
import type { MockMarket } from "@/data/mockMarkets";

/** Alias matching the frontend market card shape. */
export type Market = MockMarket;

/**
 * Raw `getMarket` return from MeleePMM:
 * (creator, endTimestamp, resolved, winningOutcome, totalPool, yesPool, noPool)
 */
export type OnChainMarketRaw = readonly [
  creator: `0x${string}` | string,
  endTimestamp: bigint | number | string,
  resolved: boolean,
  winningOutcome: number | bigint,
  totalPool: bigint | number | string,
  yesPool: bigint | number | string,
  noPool: bigint | number | string,
];

/** Off-chain text fields from Supabase (or the metadata API). */
export type MarketMetadataOverlay = {
  title?: string;
  description?: string;
  category?: string;
};

const CATEGORIES = new Set([
  "Crypto",
  "Culture",
  "AI",
  "Sports",
  "Macro",
]);

function toBigInt(value: bigint | number | string): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.trunc(value));
  return BigInt(value);
}

function toUnixSeconds(value: bigint | number | string): number {
  const n =
    typeof value === "bigint"
      ? Number(value)
      : typeof value === "string"
        ? Number(value)
        : value;
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Invalid on-chain end timestamp: ${String(value)}`);
  }
  return Math.floor(n);
}

function shortAddress(address: string) {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function isOnChainMarketRaw(value: unknown): value is OnChainMarketRaw {
  return Array.isArray(value) && value.length >= 7;
}

function normalizeCategory(
  category: string | undefined,
): MockMarket["category"] {
  if (category && CATEGORIES.has(category)) {
    return category as MockMarket["category"];
  }
  return "Crypto";
}

/**
 * Map a Stylus `getMarket` tuple into the frontend `MockMarket` / `Market` shape.
 * Optional Supabase metadata supplies title / description / category.
 */
export function parseOnChainMarket(
  id: number,
  rawData: OnChainMarketRaw | unknown,
  metadata?: MarketMetadataOverlay | null,
): Market {
  if (!isOnChainMarketRaw(rawData)) {
    throw new Error(`Unexpected getMarket payload for market ${id}`);
  }

  const [creator, endTimestamp, resolved, , totalPool, yesPool, noPool] =
    rawData;

  const endDate = new Date(toUnixSeconds(endTimestamp) * 1000).toISOString();
  const yesAmount = Number(formatEther(toBigInt(yesPool)));
  const noAmount = Number(formatEther(toBigInt(noPool)));
  const liquidityPool = Number(formatEther(toBigInt(totalPool)));

  const fallbackDescription = resolved
    ? `Resolved on-chain MeleePMM market created by ${shortAddress(String(creator))}.`
    : `On-chain MeleePMM market created by ${shortAddress(String(creator))}. Open for Yes/No trading with anti-dilution floors.`;

  const title = metadata?.title?.trim() || `Market #${id}`;
  const description =
    metadata?.description?.trim() || fallbackDescription;

  return {
    id: String(id),
    title,
    description,
    category: normalizeCategory(metadata?.category),
    liquidityPool,
    endDate,
    options: [
      { label: "Yes", poolAmount: yesAmount },
      { label: "No", poolAmount: noAmount },
    ],
    status: "active",
  };
}

/** Index Supabase rows by on-chain market id. */
export function metadataById(
  rows: Array<{
    id: number | string;
    title?: string;
    description?: string;
    category?: string;
  }>,
): Map<number, MarketMetadataOverlay> {
  const map = new Map<number, MarketMetadataOverlay>();
  for (const row of rows) {
    const id = Number(row.id);
    if (!Number.isInteger(id) || id < 0) continue;
    map.set(id, {
      title: row.title,
      description: row.description,
      category: row.category,
    });
  }
  return map;
}
