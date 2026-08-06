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

/**
 * Map a Stylus `getMarket` tuple into the frontend `MockMarket` / `Market` shape.
 */
export function parseOnChainMarket(
  id: number,
  rawData: OnChainMarketRaw | unknown,
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

  return {
    id: String(id),
    title: `Market #${id}`,
    description: resolved
      ? `Resolved on-chain MeleePMM market created by ${shortAddress(String(creator))}.`
      : `On-chain MeleePMM market created by ${shortAddress(String(creator))}. Open for Yes/No trading with anti-dilution floors.`,
    category: "Crypto",
    liquidityPool,
    endDate,
    options: [
      { label: "Yes", poolAmount: yesAmount },
      { label: "No", poolAmount: noAmount },
    ],
    status: "active",
  };
}
