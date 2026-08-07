import { render, screen, within } from "@testing-library/react";
import PortfolioPage from "@/app/markets/portfolio/page";
import { useDemoStore } from "@/store/useDemoStore";

const useAccount = jest.fn();
const useReadContracts = jest.fn();
const useQuery = jest.fn();

jest.mock("wagmi", () => ({
  useAccount: () => useAccount(),
  useReadContracts: (...args: unknown[]) => useReadContracts(...args),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => useQuery(...args),
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
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("PortfolioPage", () => {
  beforeEach(() => {
    localStorage.clear();
    useDemoStore.setState({ isDemoMode: false, createdMarkets: [] });
    useAccount.mockReset();
    useReadContracts.mockReset();
    useQuery.mockReset();

    useAccount.mockReturnValue({
      address: "0x5a967532fd910921f970fCFf449eB95b61C782f4",
      isConnected: true,
    });
    useQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    });
    useReadContracts.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
    });
  });

  it("renders the mock portfolio grid when Demo Mode is on", () => {
    useDemoStore.setState({ isDemoMode: true });

    render(<PortfolioPage />);

    expect(
      screen.getByRole("heading", { name: /your portfolio/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("portfolio-grid")).toBeInTheDocument();
    expect(screen.getAllByTestId("portfolio-position-card")).toHaveLength(3);

    expect(screen.getByTestId("portfolio-stat-active")).toHaveTextContent("1");
    expect(screen.getByTestId("portfolio-stat-claimable")).toHaveTextContent(
      "1",
    );

    const winner = screen
      .getAllByTestId("portfolio-position-card")
      .find((el) => el.getAttribute("data-status") === "winner");
    expect(winner).toBeTruthy();
    expect(
      within(winner!).getByTestId("portfolio-status-badge"),
    ).toHaveTextContent(/winner/i);

    const lost = screen
      .getAllByTestId("portfolio-position-card")
      .find((el) => el.getAttribute("data-status") === "lost");
    expect(lost).toBeTruthy();
    expect(lost).toHaveClass("opacity-55");

    expect(
      screen.getByRole("link", { name: /will eth hit \$10k in 2026\?/i }),
    ).toHaveAttribute("href", "/markets/eth-10k-2026");
  });

  it("asks the user to connect when wallet is disconnected (live mode)", () => {
    useAccount.mockReturnValue({ address: undefined, isConnected: false });

    render(<PortfolioPage />);

    expect(screen.getByTestId("portfolio-connect")).toHaveTextContent(
      /connect your wallet/i,
    );
    expect(screen.queryByTestId("portfolio-grid")).not.toBeInTheDocument();
  });

  it("shows a loading skeleton while metadata / multicall resolve", () => {
    useQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      isError: false,
      error: null,
    });

    render(<PortfolioPage />);

    expect(screen.getByTestId("portfolio-skeleton")).toBeInTheDocument();
    expect(screen.getAllByTestId("portfolio-skeleton-card")).toHaveLength(6);
  });

  it("shows empty state when the connected wallet has no positions", () => {
    useQuery.mockReturnValue({
      data: [{ id: 1, title: "A", description: "d", category: "Crypto" }],
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    });
    useReadContracts.mockReturnValue({
      data: [
        {
          status: "success",
          result: [
            "0x5a967532fd910921f970fCFf449eB95b61C782f4",
            BigInt(2_000_000_000),
            false,
            0,
            BigInt(0),
            BigInt(0),
            BigInt(0),
          ],
        },
        {
          status: "success",
          result: [BigInt(0), BigInt(0), BigInt(0), false],
        },
        {
          status: "success",
          result: [BigInt(0), BigInt(0), BigInt(0), false],
        },
      ],
      isLoading: false,
      isFetching: false,
    });

    render(<PortfolioPage />);

    expect(screen.getByTestId("portfolio-empty")).toHaveTextContent(
      /you have no active positions/i,
    );
  });
});
