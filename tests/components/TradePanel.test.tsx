import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  calculateMinReturnFloor,
  TradePanel,
} from "@/components/markets/TradePanel";

describe("TradePanel", () => {
  it("renders the bet amount input", () => {
    render(<TradePanel />);

    expect(screen.getByLabelText(/bet amount \(eth\)/i)).toBeInTheDocument();
  });

  it("toggles between Yes and No sides", async () => {
    const user = userEvent.setup();
    render(<TradePanel />);

    const yes = screen.getByRole("button", { name: /^yes$/i });
    const no = screen.getByRole("button", { name: /^no$/i });

    expect(yes).toHaveAttribute("aria-pressed", "true");
    expect(no).toHaveAttribute("aria-pressed", "false");

    await user.click(no);

    expect(no).toHaveAttribute("aria-pressed", "true");
    expect(yes).toHaveAttribute("aria-pressed", "false");
  });

  it("displays the Minimum Return Floor when a bet amount is entered", async () => {
    const user = userEvent.setup();
    render(<TradePanel />);

    const input = screen.getByLabelText(/bet amount \(eth\)/i);
    await user.clear(input);
    await user.type(input, "0.05");

    expect(screen.getByTestId("floor-preview")).toBeInTheDocument();
    expect(
      screen.getByText(`Min return floor: ${calculateMinReturnFloor(0.05).toFixed(4)} ETH`),
    ).toBeInTheDocument();
    expect(calculateMinReturnFloor(0.05)).toBeCloseTo(0.09);
  });

  it("shows the floor tooltip explanation", async () => {
    const user = userEvent.setup();
    render(<TradePanel />);

    await user.click(screen.getByRole("button", { name: /floor explanation/i }));

    expect(
      screen.getByText(
        /this floor is mathematically guaranteed by the pmm and cannot be diluted by late capital/i,
      ),
    ).toBeInTheDocument();
  });
});
