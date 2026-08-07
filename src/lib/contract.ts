import { parseAbi } from "viem";

/** Deployed StrategyExecutor on Arbitrum Sepolia. */
export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0xdb76e1ca5056c550afcd2084fc571c7fef2e89ae") as `0x${string}`;

/**
 * Solidity ABI from `cargo stylus export-abi`.
 * Stylus maps Rust snake_case → Solidity camelCase
 * (e.g. create_strategy → createStrategy, get_strategies_by_owner → getStrategiesByOwner).
 */
export const strategyExecutorABI = parseAbi([
  "function totalStrategiesExecuted() view returns (uint256)",
  "function getUserStrategyCount(address user) view returns (uint256)",
  "function getStrategiesByOwner(address owner) view returns ((string,string,uint256,uint256,address)[])",
  "function createStrategy(string id, string name, uint256 apy, uint256 tvl)",
  "function executeStrategy(string strategy_name, uint256 expected_yield)",
  "event StrategyExecuted(address indexed user, string strategyName, uint256 expectedYield)",
  "event StrategyCreated(address indexed owner, string id, string name, uint256 apy, uint256 tvl)",
]);

/** Normalized on-chain yield strategy row. */
export type OnChainYieldStrategy = {
  id: string;
  name: string;
  apy: bigint;
  tvl: bigint;
  owner: `0x${string}`;
};

/** Decode wagmi/viem tuple rows from `getStrategiesByOwner`. */
export function parseStrategiesByOwner(
  rows: readonly (readonly [string, string, bigint, bigint, `0x${string}`])[] | undefined,
): OnChainYieldStrategy[] {
  if (!rows?.length) return [];
  return rows.map(([id, name, apy, tvl, owner]) => ({
    id,
    name,
    apy,
    tvl,
    owner,
  }));
}
