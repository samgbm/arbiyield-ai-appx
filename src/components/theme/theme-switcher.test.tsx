import { render, screen } from "@testing-library/react";

jest.mock(
  "@wrksz/themes/client",
  () => ({
    useTheme: () => ({
      theme: "system",
      setTheme: jest.fn(),
      resolvedTheme: "light",
      themes: ["light", "dark"],
      systemTheme: "light",
    }),
  }),
  { virtual: true },
);

import { ThemeSwitcher } from "./theme-switcher";

describe("ThemeSwitcher", () => {
  it("renders a fixed-size control to avoid layout jump", () => {
    render(<ThemeSwitcher />);

    const control =
      screen.queryByTestId("theme-switcher-skeleton") ??
      screen.getByRole("button", { name: /theme:/i });

    expect(control).toHaveClass("w-[8.75rem]");
    expect(control).toHaveClass("h-10");
  });
});
