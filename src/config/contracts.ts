import { parseAbi } from "viem";

/**
 * Central ABI / address config for El Niño Stylus logistics + climate relay.
 * Stylus maps Rust snake_case → Solidity camelCase
 * (`verify_aid_batch` → `verifyAidBatch`).
 *
 * After crowdfunding pool changes, redeploy Stylus and update
 * `NEXT_PUBLIC_NINO_CONTRACT_ADDRESS`.
 */
export const NINO_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_NINO_CONTRACT_ADDRESS ||
  "0x3b22f5c054919b8798d1422e92ba57f53b63570b") as `0x${string}`;

/**
 * Includes `verifyAidBatch`, payable `donate`, and pool view helpers.
 */
export const ninoAbi = parseAbi([
  "function initialize()",
  "function getAdmin() view returns (address)",
  "function batchRegisterFarmers(address[] farmers, string[] locations, uint256[] coverage_amounts)",
  "function getPolicy(address farmer) view returns (string, uint256, bool)",
  "function donate()",
  "function getReliefPool() view returns (uint256)",
  "function getPoolStats() view returns (uint256, uint256, uint256, uint256)",
  "function getDonation(address donor) view returns (uint256)",
  "function getDonorCount() view returns (uint256)",
  "function getDonorAt(uint256 index) view returns (address)",
  "function processClimateRelay(string location_id, uint256 rainfall_mm) returns (uint256)",
  "function logAidCheckpoint(bytes32 batch_hash, string location_name)",
  "function verifyAidBatch(bytes32 batch_hash) view returns (string, uint256, bool)",
  "function flagAidBatch(bytes32 batch_hash)",
  "event PayoutDisbursed(address indexed farmer, string location, uint256 amount)",
  "event AidCheckpointLogged(bytes32 indexed batch_hash, string location, uint256 timestamp)",
  "event DonationReceived(address indexed donor, uint256 amount, uint256 pool_total)",
]);

/**
 * Demo QR / presentation tip hash for trail AID-001 (deterministic keccak chain).
 * Must match `scripts/seedAidCheckpoints.ts` trail AID-001 store step.
 */
export const DEMO_AID_BATCH_HASH =
  "0x4a49292c1af239d2462d308e430dacc7292dc9b84c9df3ab6e02ef684f84f13f" as const;

/** Soft campaign goal shown on the funding dashboard (ETH). */
export const RELIEF_POOL_GOAL_ETH = 1;
