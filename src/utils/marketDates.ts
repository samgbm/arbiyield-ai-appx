/**
 * Normalize AI / user-provided market end dates into a future ISO-8601 string
 * that `createMarket` can accept as a UNIX timestamp.
 */
export function normalizeMarketEndDate(
  raw: string,
  now = new Date(),
): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return defaultEndDate(now);
  }

  // Date-only → end of that UTC day.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    const iso = `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}T23:59:59.000Z`;
    return ensureFuture(iso, now);
  }

  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return ensureFuture(new Date(parsed).toISOString(), now);
  }

  // Year-only hints like "2027" or "before 2027".
  const yearMatch = /\b(20\d{2})\b/.exec(trimmed);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    const iso = `${year}-12-31T23:59:59.000Z`;
    return ensureFuture(iso, now);
  }

  return defaultEndDate(now);
}

function defaultEndDate(now: Date): string {
  const d = new Date(now.getTime());
  d.setUTCMonth(d.getUTCMonth() + 6);
  d.setUTCHours(23, 59, 59, 0);
  return d.toISOString();
}

function ensureFuture(iso: string, now: Date): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms) || ms <= now.getTime()) {
    return defaultEndDate(now);
  }
  return new Date(ms).toISOString();
}

/** Convert an ISO / date string into UNIX seconds for `createMarket`. */
export function endDateToUnixSeconds(endDate: string, now = new Date()): bigint {
  const normalized = normalizeMarketEndDate(endDate, now);
  const ms = Date.parse(normalized);
  if (Number.isNaN(ms)) {
    throw new Error(`Invalid endDate: ${endDate}`);
  }
  return BigInt(Math.floor(ms / 1000));
}
