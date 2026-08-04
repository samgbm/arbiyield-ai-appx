import { render, screen } from "@testing-library/react";
import HomePage from "./page";

jest.mock("../components/StrategyStats", () => ({
  StrategyStats: () => <div data-testid="strategy-stats">Strategy stats</div>,
}));

jest.mock("../components/ChatApiTestButton", () => ({
  ChatApiTestButton: () => (
    <div data-testid="chat-api-test">Chat API test</div>
  ),
}));

describe("HomePage", () => {
  it("renders the ArbiYield AI homepage correctly", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /welcome to arbiyield ai/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/prompt a yield strategy/i),
    ).toBeInTheDocument();

    expect(screen.getByTestId("strategy-stats")).toBeInTheDocument();

    expect(
      screen.getByText(/ETH Lima 2026/i),
    ).toBeInTheDocument();
  });
});
