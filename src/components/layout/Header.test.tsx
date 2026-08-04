import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Header } from "./Header";

function renderHeader() {
  return render(
    <ThemeProvider>
      <Header />
    </ThemeProvider>,
  );
}

describe("Header", () => {
  it("renders the ArbiYield AI brand name", () => {
    renderHeader();

    expect(screen.getByText("ArbiYield AI")).toBeInTheDocument();
  });

  it("renders placeholder navigation links", () => {
    renderHeader();

    expect(screen.getAllByRole("link", { name: "Dashboard" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Strategies" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Docs" }).length).toBeGreaterThan(0);
  });

  it("renders a Connect Wallet placeholder", () => {
    renderHeader();

    expect(
      screen.getAllByRole("button", { name: /connect wallet/i }).length,
    ).toBeGreaterThan(0);
  });
});
