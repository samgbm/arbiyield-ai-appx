import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("renders the copyright text", () => {
    render(<Footer />);

    expect(screen.getByText("© 2026 ArbiYield AI")).toBeInTheDocument();
  });

  it("renders a link to the Arbitrum Sepolia Explorer", () => {
    render(<Footer />);

    const link = screen.getByRole("link", {
      name: /arbitrum sepolia explorer/i,
    });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://sepolia.arbiscan.io/");
  });

  it("renders a stealth demo mode toggle", () => {
    render(<Footer />);

    expect(
      screen.getByRole("button", { name: /enable demo mode/i }),
    ).toBeInTheDocument();
  });
});
