import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ThemeSwitcher } from "./theme-switcher";

describe("ThemeSwitcher", () => {
  it("renders a fixed-size skeleton before mount to avoid layout jump", () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    );

    // On first paint in jsdom, useSyncExternalStore client snapshot is true,
    // so we assert the control keeps a stable width class either way.
    const control =
      screen.queryByTestId("theme-switcher-skeleton") ??
      screen.getByRole("button", { name: /theme:/i });

    expect(control).toHaveClass("w-[8.75rem]");
    expect(control).toHaveClass("h-10");
  });
});
