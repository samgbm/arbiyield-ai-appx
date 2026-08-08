import { render, screen } from "@testing-library/react";
import {
  EL_NINO_NAV_ITEMS,
  MARKET_NAV_ITEMS,
  Sidebar,
  YIELD_NAV_ITEMS,
} from "../../src/components/layout/Sidebar";

const mockPathname = jest.fn(() => "/");

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("Sidebar — modular demo flow nav", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/");
  });

  it("separates Yield, Markets, and El Niño without Docs / Demo / Status", () => {
    render(<Sidebar />);

    expect(screen.getByText("1 · Yield")).toBeInTheDocument();
    expect(screen.getByText("2 · Markets")).toBeInTheDocument();
    expect(screen.getByText("3 · El Niño Resilience")).toBeInTheDocument();

    expect(screen.queryByText("Docs")).not.toBeInTheDocument();
    expect(screen.queryByText("API Docs")).not.toBeInTheDocument();
    expect(screen.queryByText(/Demo Mode/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("nav-system-status")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nav-docs")).not.toBeInTheDocument();

    expect(screen.getByTestId("nav-yield-strategies")).toBeInTheDocument();
    expect(screen.getByTestId("nav-markets")).toBeInTheDocument();
    expect(screen.getByTestId("nav-home")).toHaveAttribute("href", "/");
  });

  it("points exported nav groups at the expected routes", () => {
    render(<Sidebar />);

    for (const item of [
      ...YIELD_NAV_ITEMS,
      ...MARKET_NAV_ITEMS,
      ...EL_NINO_NAV_ITEMS,
    ]) {
      expect(screen.getByTestId(item.testId)).toHaveAttribute("href", item.href);
    }
  });

  it("orders Yield as hub then create", () => {
    expect(YIELD_NAV_ITEMS.map((i) => i.href)).toEqual([
      "/strategies",
      "/strategies/create",
    ]);
  });
});
