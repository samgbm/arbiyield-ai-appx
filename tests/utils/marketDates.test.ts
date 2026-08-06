import {
  endDateToUnixSeconds,
  normalizeMarketEndDate,
} from "@/utils/marketDates";

describe("normalizeMarketEndDate", () => {
  const now = new Date("2026-08-06T12:00:00.000Z");

  it("normalizes date-only strings to end of UTC day", () => {
    expect(normalizeMarketEndDate("2027-01-01", now)).toBe(
      "2027-01-01T23:59:59.000Z",
    );
  });

  it("bumps past dates into the future", () => {
    const result = normalizeMarketEndDate("2020-01-01", now);
    expect(Date.parse(result)).toBeGreaterThan(now.getTime());
  });

  it("produces unix seconds for createMarket", () => {
    const seconds = endDateToUnixSeconds("2027-06-15", now);
    expect(seconds).toBe(BigInt(Math.floor(Date.parse("2027-06-15T23:59:59.000Z") / 1000)));
  });
});
