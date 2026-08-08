import { keccak256, toBytes, zeroHash, type Hex } from "viem";

export const AID_STEP_TYPES = [
  "farm",
  "factory",
  "depot",
  "store",
] as const;

export type AidStepType = (typeof AID_STEP_TYPES)[number];

export type AidCheckpointRow = {
  id?: string;
  shipment_id?: string;
  step_index: number;
  step_type: AidStepType;
  location_name: string;
  facility_id: string | null;
  farm_name: string | null;
  batch_weight_kg: number | null;
  temperature_c: number | null;
  sensor_id: string | null;
  handler_name: string | null;
  arrived_at: string;
  departed_at: string | null;
  parent_hash: string | null;
  step_hash: string;
  tx_hash: string | null;
};

export type OnChainAidBatch = {
  location: string;
  timestamp: bigint;
  isFlagged: boolean;
};

/** Hash a provenance step; each digest locks in the parent hash (domino chain). */
export function computeAidStepHash(
  parentHash: Hex | null,
  parts: string[],
): Hex {
  const payload = [parentHash ?? zeroHash, ...parts].join("|");
  return keccak256(toBytes(payload));
}

export function isBytes32Hex(value: string): value is Hex {
  return /^0x[a-fA-F0-9]{64}$/.test(value.trim());
}

export function formatAidTimestamp(unixSeconds: bigint): string {
  if (unixSeconds === BigInt(0)) return "—";
  const ms = Number(unixSeconds) * 1000;
  if (!Number.isFinite(ms)) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(ms));
}
