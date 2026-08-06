import { render, screen } from "@testing-library/react";
import { DemoModeProvider } from "@/components/providers/DemoModeProvider";
import { Footer } from "./Footer";

function renderFooter() {
  return render(
    <DemoModeProvider>
      <Footer />
    </DemoModeProvider>,
  );
}

describe("Footer", () => {
  it("renders the copyright text", () => {
    renderFooter();

    expect(screen.getByText("© 2026 ArbiYield AI")).toBeInTheDocument();
  });

  it("renders a link to the Arbitrum Sepolia Explorer", () => {
    renderFooter();

    const link = screen.getByRole("link", {
      name: /arbitrum sepolia explorer/i,
    });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://sepolia.arbiscan.io/");
  });

  it("renders a stealth demo mode toggle", () => {
    renderFooter();

    expect(
      screen.getByRole("button", { name: /enable demo mode/i }),
    ).toBeInTheDocument();
  });
});
