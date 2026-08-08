import { parseAbi } from "viem";

/**
 * El Niño Climate Resilience (Stylus) — deploy address on Arbitrum Sepolia.
 * Set `NEXT_PUBLIC_NINO_CONTRACT_ADDRESS` after `cargo stylus deploy`.
 */
export const NINO_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_NINO_CONTRACT_ADDRESS ||
  "0xf129b27fe733114d4855f1a605160e962ae66330") as `0x${string}`;

/** Hardcoded Climate Relayer / admin from the Stylus contract. */
export const CLIMATE_RELAYER_ADMIN =
  "0xca76951A11A9adE6553ef54AB1d1260f08c3460d" as const;

/**
 * Solidity ABI from Stylus export.
 *
 * Stylus maps Rust snake_case → Solidity camelCase
 * (e.g. batch_register_farmers → batchRegisterFarmers).
 */
export const elninoABI = parseAbi([
  "function initialize()",
  "function getAdmin() view returns (address)",
  "function batchRegisterFarmers(address[] farmers, string[] locations, uint256[] coverage_amounts)",
  "function getPolicy(address farmer) view returns (string, uint256, bool)",
  "function processClimateRelay(string location_id, uint256 rainfall_mm) returns (uint256)",
  "function logAidCheckpoint(bytes32 batch_hash, string location_name)",
  "function verifyAidBatch(bytes32 batch_hash) view returns (string, uint256, bool)",
  "function flagAidBatch(bytes32 batch_hash)",
  "event PayoutDisbursed(address indexed farmer, string location, uint256 amount)",
  "event AidCheckpointLogged(bytes32 indexed batch_hash, string location, uint256 timestamp)",
]);

/** Cooperative location IDs used by the Climate Data Relay. */
export const EL_NINO_LOCATIONS = [
  "Piura",
  "Tumbes",
  "Lambayeque",
  "La Libertad",
  "Ancash",
] as const;

export type ElNinoLocation = (typeof EL_NINO_LOCATIONS)[number];

/** USDC has 6 decimals on-chain. */
export const USDC_DECIMALS = 6;

export function usdcToBaseUnits(amount: number): bigint {
  if (!Number.isFinite(amount) || amount < 0) return BigInt(0);
  return BigInt(Math.round(amount * 10 ** USDC_DECIMALS));
}

export function formatUsdcFromBaseUnits(amount: bigint): string {
  const whole = amount / BigInt(10 ** USDC_DECIMALS);
  const frac = amount % BigInt(10 ** USDC_DECIMALS);
  const fracStr = frac.toString().padStart(USDC_DECIMALS, "0").replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}

export const ARBISCAN_TX = "https://sepolia.arbiscan.io/tx";
export const ARBISCAN_ADDRESS = "https://sepolia.arbiscan.io/address";

/** Browser event for Demo Mode payout feed injection. */
export const EL_NINO_DEMO_PAYOUT_EVENT = "elnino:demo-payout";

export type ElNinoPayoutEvent = {
  farmer: `0x${string}`;
  location: string;
  amount: bigint;
  transactionHash?: `0x${string}`;
  receivedAt: number;
};
