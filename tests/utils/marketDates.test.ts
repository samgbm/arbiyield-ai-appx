import {
  endDateToUnixSeconds,
  formatCountdown,
  formatEndDateInputLabel,
  hasMarketEnded,
  isEndDateInFuture,
  isRelativeEndDate,
  normalizeMarketEndDate,
  parseRelativeEndOffset,
} from "@/utils/marketDates";

describe("normalizeMarketEndDate", () => {
  const now = new Date("2026-08-06T12:00:00.000Z");

  it("normalizes date-only strings to end of UTC day without rewriting the day", () => {
    expect(normalizeMarketEndDate("2024-01-01")).toBe(
      "2024-01-01T23:59:59.000Z",
    );
    expect(normalizeMarketEndDate("2027-01-01")).toBe(
      "2027-01-01T23:59:59.000Z",
    );
  });

  it("preserves past dates instead of inventing a new one", () => {
    expect(normalizeMarketEndDate("2020-01-01")).toBe(
      "2020-01-01T23:59:59.000Z",
    );
    expect(isEndDateInFuture("2020-01-01", now)).toBe(false);
  });

  it("detects future dates", () => {
    expect(isEndDateInFuture("2027-06-15", now)).toBe(true);
  });

  it("produces unix seconds for createMarket", () => {
    const seconds = endDateToUnixSeconds("2027-06-15");
    expect(seconds).toBe(
      BigInt(Math.floor(Date.parse("2027-06-15T23:59:59.000Z") / 1000)),
    );
  });

  it("evaluates relative offsets against now", () => {
    expect(isRelativeEndDate("in 30 seconds")).toBe(true);
    expect(parseRelativeEndOffset("in 20 seconds")).toEqual({
      amount: 20,
      unit: "seconds",
      ms: 20_000,
    });
    expect(formatEndDateInputLabel("+45s")).toBe("in 45 seconds");

    const iso = normalizeMarketEndDate("in 30 seconds", now);
    expect(iso).toBe("2026-08-06T12:00:30.000Z");
    expect(endDateToUnixSeconds("in 30 seconds", now)).toBe(
      BigInt(Math.floor(Date.parse(iso) / 1000)),
    );
    expect(isEndDateInFuture("in 30 seconds", now)).toBe(true);
  });

  it("formats countdown and detects ended markets", () => {
    expect(formatCountdown(65_000)).toBe("01:05");
    expect(formatCountdown(0)).toBe("00:00");

    const endUnix = Math.floor(now.getTime() / 1000) + 10;
    expect(hasMarketEnded(endUnix, now)).toBe(false);
    expect(hasMarketEnded(endUnix, new Date(now.getTime() + 11_000))).toBe(
      true,
    );
  });
});
