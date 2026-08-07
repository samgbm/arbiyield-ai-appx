import { render, screen } from "@testing-library/react";
import {
  EL_NINO_NAV_ITEMS,
  Sidebar,
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

jest.mock("../../src/store/useDemoStore", () => ({
  useDemoStore: (
    selector: (s: { isDemoMode: boolean; toggleDemoMode: () => void }) => unknown,
  ) =>
    selector({
      isDemoMode: false,
      toggleDemoMode: jest.fn(),
    }),
}));

describe("Sidebar — El Niño Climate Resilience nav (Increment 1)", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/");
  });

  it("renders all El Niño navigation links", () => {
    render(<Sidebar />);

    expect(screen.getByTestId("nav-el-nino-logistics")).toBeInTheDocument();
    expect(screen.getByTestId("nav-el-nino-onboarding")).toBeInTheDocument();
    expect(screen.getByTestId("nav-el-nino-oracle")).toBeInTheDocument();

    expect(screen.getByText("Logistics Tracker")).toBeInTheDocument();
    expect(screen.getByText("Farmer Onboarding")).toBeInTheDocument();
    expect(screen.getByText("Oracle Trigger")).toBeInTheDocument();
  });

  it("points El Niño links at the scaffolded routes", () => {
    render(<Sidebar />);

    for (const item of EL_NINO_NAV_ITEMS) {
      expect(screen.getByTestId(item.testId)).toHaveAttribute("href", item.href);
    }
  });

  it("highlights the active El Niño route", () => {
    mockPathname.mockReturnValue("/el-nino/oracle");
    render(<Sidebar />);

    const oracleLink = screen.getByTestId("nav-el-nino-oracle");
    const logisticsLink = screen.getByTestId("nav-el-nino-logistics");

    expect(oracleLink.className).toMatch(/ring-sky-500/);
    expect(logisticsLink.className).not.toMatch(/ring-sky-500/);
  });
});
