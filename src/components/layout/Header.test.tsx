import { render, screen } from "@testing-library/react";
import { Header } from "./Header";

describe("Header", () => {
  it("renders the ArbiYield AI brand name", () => {
    render(<Header />);

    expect(screen.getByText("ArbiYield AI")).toBeInTheDocument();
  });

  it("renders placeholder navigation links", () => {
    render(<Header />);

    expect(screen.getAllByRole("link", { name: "Dashboard" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Strategies" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Docs" }).length).toBeGreaterThan(0);
  });

  it("renders a Connect Wallet placeholder", () => {
    render(<Header />);

    expect(
      screen.getAllByRole("button", { name: /connect wallet/i }).length,
    ).toBeGreaterThan(0);
  });
});
