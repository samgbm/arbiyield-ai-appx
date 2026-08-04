import { render, screen } from "@testing-library/react";
import { Header } from "./Header";

jest.mock("@rainbow-me/rainbowkit", () => ({
  ConnectButton: () => <button type="button">Connect Wallet</button>,
}));

jest.mock("../theme/theme-switcher", () => ({
  ThemeSwitcher: () => (
    <div
      className="inline-flex h-10 w-[8.75rem]"
      data-testid="theme-switcher-mock"
    >
      Theme
    </div>
  ),
}));

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

  it("renders the Connect Wallet button", () => {
    render(<Header />);

    expect(
      screen.getByRole("button", { name: /connect wallet/i }),
    ).toBeInTheDocument();
  });
});
