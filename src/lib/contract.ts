import { parseAbi } from "viem";

/** Deployed StrategyExecutor on Arbitrum Sepolia (id + creator on-chain). */
export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x0d5170e733955952906011451dd89b7059e973a3") as `0x${string}`;

/**
 * Solidity ABI from Stylus export.
 * On-chain stores only strategy id + creator; metadata lives in Supabase.
 */
export const strategyExecutorABI = parseAbi([
  "function totalStrategiesExecuted() view returns (uint256)",
  "function getUserStrategyCount(address user) view returns (uint256)",
  "function getAllStrategies() view returns ((string,address)[])",
  "function getStrategiesByOwner(address owner) view returns ((string,address)[])",
  "function getStrategyCreator(string id) view returns (address)",
  "function createStrategy(string id)",
  "function executeStrategy(string strategy_name, uint256 expected_yield)",
  "event StrategyExecuted(address indexed user, string strategyName, uint256 expectedYield)",
  "event StrategyCreated(address indexed creator, string id)",
]);

/** Normalized on-chain yield strategy row (id + creator only). */
export type OnChainYieldStrategy = {
  id: string;
  creator: `0x${string}`;
};

/** Decode wagmi/viem tuple rows from `getAllStrategies` / `getStrategiesByOwner`. */
export function parseStrategiesList(
  rows: readonly (readonly [string, `0x${string}`])[] | undefined,
): OnChainYieldStrategy[] {
  if (!rows?.length) return [];
  return rows.map(([id, creator]) => ({ id, creator }));
}

/** @deprecated use parseStrategiesList */
export function parseStrategiesByOwner(
  rows: readonly (readonly [string, `0x${string}`])[] | undefined,
): OnChainYieldStrategy[] {
  return parseStrategiesList(rows);
}

/** Slugify an AI strategy name into a stable on-chain id. */
export function strategyIdFromName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || `strategy-${Date.now()}`;
}
