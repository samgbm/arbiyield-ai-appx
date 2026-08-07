import {
  outcomeLabelFromId,
  resolvePortfolioStatus,
} from "@/components/markets/PortfolioPositionCard";

describe("resolvePortfolioStatus", () => {
  it("returns active for unresolved markets", () => {
    expect(
      resolvePortfolioStatus({
        isResolved: false,
        outcomeId: 1,
      }),
    ).toBe("active");
  });

  it("returns winner / claimed / lost for resolved markets", () => {
    expect(
      resolvePortfolioStatus({
        isResolved: true,
        outcomeId: 1,
        winningOutcome: 1,
        claimed: false,
      }),
    ).toBe("winner");

    expect(
      resolvePortfolioStatus({
        isResolved: true,
        outcomeId: 1,
        winningOutcome: 1,
        claimed: true,
      }),
    ).toBe("claimed");

    expect(
      resolvePortfolioStatus({
        isResolved: true,
        outcomeId: 0,
        winningOutcome: 1,
      }),
    ).toBe("lost");
  });

  it("maps outcome ids to Yes/No labels", () => {
    expect(outcomeLabelFromId(1)).toBe("Yes");
    expect(outcomeLabelFromId(0)).toBe("No");
  });
});
