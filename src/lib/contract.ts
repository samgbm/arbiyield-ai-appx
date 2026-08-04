import { parseAbi } from "viem";

/** Deployed StrategyExecutor on Arbitrum Sepolia. */
export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0xdb76e1ca5056c550afcd2084fc571c7fef2e89ae") as `0x${string}`;

/**
 * Solidity ABI from `cargo stylus export-abi`.
 * Stylus maps Rust snake_case to Solidity camelCase:
 * - total_strategies_executed → totalStrategiesExecuted
 * - get_user_strategy_count → getUserStrategyCount
 */
export const strategyExecutorABI = parseAbi([
  "function totalStrategiesExecuted() view returns (uint256)",
  "function getUserStrategyCount(address user) view returns (uint256)",
  "function executeStrategy(string strategy_name, uint256 expected_yield)",
]);
