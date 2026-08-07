/**
 * Market end-date helpers.
 * Supports absolute ISO/date strings and relative offsets like "in 20 seconds".
 */

const RELATIVE_RE =
  /^(?:in\s+)?\+?(\d+)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours)$/i;

export type RelativeEndOffset = {
  amount: number;
  unit: "seconds" | "minutes" | "hours";
  ms: number;
};

/** Parse "in 20 seconds", "+30s", "5m", etc. */
export function parseRelativeEndOffset(
  raw: string,
): RelativeEndOffset | null {
  const trimmed = raw.trim();
  const match = RELATIVE_RE.exec(trimmed);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const unitToken = match[2]!.toLowerCase();
  let unit: RelativeEndOffset["unit"];
  let ms: number;

  if (unitToken.startsWith("s")) {
    unit = "seconds";
    ms = amount * 1000;
  } else if (unitToken.startsWith("m")) {
    unit = "minutes";
    ms = amount * 60_000;
  } else {
    unit = "hours";
    ms = amount * 3_600_000;
  }

  return { amount, unit, ms };
}

export function isRelativeEndDate(raw: string): boolean {
  return parseRelativeEndOffset(raw) != null;
}

/**
 * Normalize AI / user-provided market end dates into ISO-8601.
 * Relative inputs ("in 20 seconds") resolve against `now` at call time —
 * call again at deploy so the countdown starts from the tx moment.
 */
export function normalizeMarketEndDate(
  raw: string,
  now = new Date(),
): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Missing endDate");
  }

  const relative = parseRelativeEndOffset(trimmed);
  if (relative) {
    return new Date(now.getTime() + relative.ms).toISOString();
  }

  // Date-only → end of that UTC day.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    return `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}T23:59:59.000Z`;
  }

  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }

  throw new Error(`Invalid endDate: ${raw}`);
}

/** Human label for chips / countdown copy. */
export function formatEndDateInputLabel(raw: string): string {
  const relative = parseRelativeEndOffset(raw);
  if (relative) {
    const singular = relative.amount === 1;
    if (relative.unit === "seconds") {
      return singular ? "in 1 second" : `in ${relative.amount} seconds`;
    }
    if (relative.unit === "minutes") {
      return singular ? "in 1 minute" : `in ${relative.amount} minutes`;
    }
    return singular ? "in 1 hour" : `in ${relative.amount} hours`;
  }

  try {
    return normalizeMarketEndDate(raw).slice(0, 10);
  } catch {
    return raw.trim();
  }
}

/** True when the end date is strictly after `now` (required by createMarket). */
export function isEndDateInFuture(endDate: string, now = new Date()): boolean {
  try {
    if (isRelativeEndDate(endDate)) {
      const offset = parseRelativeEndOffset(endDate);
      return Boolean(offset && offset.ms > 0);
    }
    const ms = Date.parse(normalizeMarketEndDate(endDate, now));
    return Number.isFinite(ms) && ms > now.getTime();
  } catch {
    return false;
  }
}

/**
 * Convert end input into UNIX seconds for `createMarket`.
 * Relative offsets are evaluated at call time (use on Deploy click).
 */
export function endDateToUnixSeconds(
  endDate: string,
  now = new Date(),
): bigint {
  const normalized = normalizeMarketEndDate(endDate, now);
  const ms = Date.parse(normalized);
  if (Number.isNaN(ms)) {
    throw new Error(`Invalid endDate: ${endDate}`);
  }
  return BigInt(Math.floor(ms / 1000));
}

/** Remaining ms until end; <= 0 means the market end time has been reached. */
export function msUntilEnd(
  endUnixSeconds: number | bigint | string,
  now = new Date(),
): number {
  const endMs = Number(endUnixSeconds) * 1000;
  return endMs - now.getTime();
}

export function hasMarketEnded(
  endUnixSeconds: number | bigint | string,
  now = new Date(),
): boolean {
  return msUntilEnd(endUnixSeconds, now) <= 0;
}

/** Format remaining time as mm:ss or hh:mm:ss. */
export function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return "00:00";
  const totalSec = Math.ceil(msRemaining / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}
