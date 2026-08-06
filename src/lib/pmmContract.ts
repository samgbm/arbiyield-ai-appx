import { parseAbi } from "viem";

/**
 * MeleePMM (Parimutuel Market Maker) — deploy address after `cargo stylus deploy`.
 * Set `NEXT_PUBLIC_PMM_CONTRACT_ADDRESS` once deployed to Arbitrum Sepolia.
 */
export const PMM_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_PMM_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

/**
 * Solidity ABI from Stylus export.
 *
 * Generate / refresh with:
 * ```bash
 * cd contracts/pmm-stylus
 * cargo stylus export-abi
 * # or:
 * cargo run --features export-abi --target x86_64-unknown-linux-gnu
 * ```
 *
 * Stylus maps Rust snake_case → Solidity camelCase
 * (e.g. create_market → createMarket, buy_shares → buyShares).
 */
export const pmmABI = parseAbi([
  "function setOracle(address new_oracle)",
  "function getOracle() view returns (address)",
  "function marketCount() view returns (uint256)",
  "function createMarket(uint64 end_timestamp) returns (uint256)",
  "function buyShares(uint256 market_id, uint8 outcome_id) payable",
  "function resolveMarket(uint256 market_id, uint8 winning_outcome)",
  "function claimWinnings(uint256 market_id)",
  "function getMarket(uint256 market_id) view returns (address, uint256, bool, uint8, uint256, uint256, uint256)",
  "function getPosition(uint256 market_id, address user, uint8 outcome_id) view returns (uint256, uint256, uint256, bool)",
  "event MarketCreated(uint256 indexed marketId, address indexed creator, uint256 endTimestamp)",
  "event SharesBought(uint256 indexed marketId, address indexed buyer, uint8 outcomeId, uint256 amount, uint256 shares, uint256 minimumReturnFloor)",
  "event MarketResolved(uint256 indexed marketId, uint8 winningOutcome)",
  "event WinningsClaimed(uint256 indexed marketId, address indexed claimer, uint256 payout, uint256 floor)",
]);
