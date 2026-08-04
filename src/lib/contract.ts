import { parseAbi } from "viem";

/** Deployed StrategyExecutor on Arbitrum Sepolia. */
export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0xdb76e1ca5056c550afcd2084fc571c7fef2e89ae") as `0x${string}`;

/**
 * Solidity ABI from `cargo stylus export-abi`.
 * Stylus maps Rust snake_case → Solidity camelCase (e.g. execute_strategy → executeStrategy).
 */
export const strategyExecutorABI = parseAbi([
  "function totalStrategiesExecuted() view returns (uint256)",
  "function getUserStrategyCount(address user) view returns (uint256)",
  "function executeStrategy(string strategy_name, uint256 expected_yield)",
  "event StrategyExecuted(address indexed user, string strategyName, uint256 expectedYield)",
]);
