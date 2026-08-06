import { render, screen } from "@testing-library/react";
import {
  formatMarketEndLabel,
  getMarketOdds,
  MarketCard,
} from "@/components/markets/MarketCard";
import type { MockMarket } from "@/data/mockMarkets";

const sampleMarket: MockMarket = {
  id: "test-eth-10k",
  title: "Will ETH hit $10k in 2026?",
  description: "Resolves YES if ETH/USD reaches $10,000 before 2027.",
  category: "Crypto",
  liquidityPool: 100,
  // Far-future date so "Ends in …" stays stable in CI relative assertions.
  endDate: "2099-12-31T23:59:59.000Z",
  options: [
    { label: "Yes", poolAmount: 75 },
    { label: "No", poolAmount: 25 },
  ],
  status: "active",
};

describe("MarketCard", () => {
  it("renders the market title", () => {
    render(<MarketCard market={sampleMarket} />);

    expect(
      screen.getByRole("heading", { name: /will eth hit \$10k in 2026\?/i }),
    ).toBeInTheDocument();
  });

  it("calculates Yes/No odds from pool amounts", () => {
    const odds = getMarketOdds(sampleMarket);

    expect(odds.yesPct).toBe(75);
    expect(odds.noPct).toBe(25);
    expect(odds.total).toBe(100);
  });

  it("renders visual odds bars sized to the pool split", () => {
    render(<MarketCard market={sampleMarket} />);

    expect(screen.getByTestId("yes-odds-bar")).toHaveStyle({ width: "75%" });
    expect(screen.getByTestId("no-odds-bar")).toHaveStyle({ width: "25%" });
    expect(screen.getByText("75.0%")).toBeInTheDocument();
    expect(screen.getByText("25.0%")).toBeInTheDocument();
  });

  it("formats the end date as a relative Ends in label", () => {
    const label = formatMarketEndLabel(
      sampleMarket.endDate,
      new Date("2026-08-06T00:00:00.000Z"),
    );

    expect(label.startsWith("Ends in ")).toBe(true);
    expect(label).toMatch(/Ends in \d+ years/);

    render(<MarketCard market={sampleMarket} />);
    expect(screen.getByText(/ends in/i)).toBeInTheDocument();
  });
});
