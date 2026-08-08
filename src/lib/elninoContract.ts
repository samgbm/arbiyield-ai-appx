/**
 * El Niño Climate Resilience (Stylus) — shared ABI + address helpers.
 * Canonical ABI lives in `src/config/contracts.ts` (includes verifyAidBatch).
 */
export {
  DEMO_AID_BATCH_HASH,
  NINO_CONTRACT_ADDRESS,
  ninoAbi as elninoABI,
} from "@/config/contracts";

/** Hardcoded Climate Relayer / admin from the Stylus contract. */
export const CLIMATE_RELAYER_ADMIN =
  "0xca76951A11A9adE6553ef54AB1d1260f08c3460d" as const;

/** Cooperative location IDs used by the Climate Data Relay. */
export const EL_NINO_LOCATIONS = [
  "Piura",
  "Tumbes",
  "Lambayeque",
  "La Libertad",
  "Ancash",
] as const;

export type ElNinoLocation = (typeof EL_NINO_LOCATIONS)[number];

/** Legacy USDC helpers (6 decimals) — prefer ETH wei helpers for relief pool. */
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

/** Convert a human ETH amount to wei for policy coverage / donations. */
export function ethToWei(amount: number): bigint {
  if (!Number.isFinite(amount) || amount < 0) return BigInt(0);
  return BigInt(Math.round(amount * 1e18));
}

/** Format wei as a compact ETH string for UI. */
export function formatEthFromWei(amount: bigint, digits = 4): string {
  const neg = amount < BigInt(0);
  const abs = neg ? -amount : amount;
  const whole = abs / BigInt(1e18);
  const frac = abs % BigInt(1e18);
  const fracStr = frac
    .toString()
    .padStart(18, "0")
    .slice(0, digits)
    .replace(/0+$/, "");
  const body = fracStr ? `${whole}.${fracStr}` : whole.toString();
  return neg ? `-${body}` : body;
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
