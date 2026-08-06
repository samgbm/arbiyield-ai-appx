import { render, screen, within } from "@testing-library/react";
import { parseEther } from "viem";
import MarketsPage from "@/app/markets/page";
import { useDemoStore } from "@/store/useDemoStore";

const useReadContract = jest.fn();
const useReadContracts = jest.fn();

jest.mock("wagmi", () => ({
  useReadContract: (...args: unknown[]) => useReadContract(...args),
  useReadContracts: (...args: unknown[]) => useReadContracts(...args),
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

describe("MarketsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    useDemoStore.setState({ isDemoMode: false, createdMarkets: [] });
    useReadContract.mockReset();
    useReadContracts.mockReset();
  });

  it("renders mock markets when Demo Mode is on", () => {
    useDemoStore.setState({ isDemoMode: true });
    useReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
    });
    useReadContracts.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
    });

    render(<MarketsPage />);

    expect(
      screen.getByRole("heading", { name: /will eth hit \$10k in 2026\?/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("markets-skeleton")).not.toBeInTheDocument();
  });

  it("shows loading skeleton while on-chain reads are in flight", () => {
    useReadContract.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
    });
    useReadContracts.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
    });

    render(<MarketsPage />);

    expect(screen.getByTestId("markets-skeleton")).toBeInTheDocument();
    expect(screen.getAllByTestId("market-skeleton-card")).toHaveLength(6);
  });

  it("shows empty state when marketCount is 0", () => {
    useReadContract.mockReturnValue({
      data: BigInt(0),
      isLoading: false,
      isFetching: false,
    });
    useReadContracts.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
    });

    render(<MarketsPage />);

    expect(screen.getByTestId("markets-empty")).toHaveTextContent(
      /no active markets found/i,
    );
    expect(
      within(screen.getByTestId("markets-empty")).getByRole("link", {
        name: /create market/i,
      }),
    ).toHaveAttribute("href", "/markets/create");
  });

  it("parses on-chain multicall results into MarketCards when Demo Mode is off", () => {
    const endUnix = 1_893_456_000;
    useReadContract.mockReturnValue({
      data: BigInt(1),
      isLoading: false,
      isFetching: false,
    });
    useReadContracts.mockReturnValue({
      data: [
        {
          status: "success",
          result: [
            "0x5a967532fd910921f970fCFf449eB95b61C782f4",
            BigInt(endUnix),
            false,
            0,
            parseEther("2"),
            parseEther("1.25"),
            parseEther("0.75"),
          ],
        },
      ],
      isLoading: false,
      isFetching: false,
    });

    render(<MarketsPage />);

    expect(screen.getByTestId("markets-grid")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /market #0/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/2 ETH liquidity/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /market #0/i })).toHaveAttribute(
      "href",
      "/markets/0",
    );
  });
});
