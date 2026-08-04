import { render, screen } from "@testing-library/react";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders the ArbiYield AI homepage correctly", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /arbiyield ai/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/prompt a yield strategy/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/ETH Lima 2026/i),
    ).toBeInTheDocument();
  });
});
