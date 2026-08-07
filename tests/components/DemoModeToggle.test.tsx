import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DemoModeToggle } from "../../src/components/layout/DemoModeToggle";
import { useDemoStore } from "../../src/store/useDemoStore";

describe("DemoModeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => {
      useDemoStore.setState({ isDemoMode: false, createdMarkets: [] });
    });
  });

  it("shows Live Network when demo mode is off", () => {
    render(<DemoModeToggle />);

    expect(screen.getByTestId("header-demo-mode-badge")).toHaveTextContent(
      "Live Network",
    );
    expect(screen.getByTestId("header-demo-mode-track").className).toMatch(
      /bg-slate-300/,
    );
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("toggles to Demo Data: ON with emerald track", async () => {
    const user = userEvent.setup();
    render(<DemoModeToggle />);

    await user.click(screen.getByTestId("header-demo-mode-toggle"));

    expect(useDemoStore.getState().isDemoMode).toBe(true);
    expect(screen.getByTestId("header-demo-mode-badge")).toHaveTextContent(
      "Demo Data: ON",
    );
    expect(screen.getByTestId("header-demo-mode-track").className).toMatch(
      /bg-emerald-500/,
    );
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });
});
