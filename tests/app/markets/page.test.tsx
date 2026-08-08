import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import { parseEther } from "viem";
import MarketsPage from "@/app/markets/page";
import MarketDetailPage from "@/app/markets/[id]/page";
import { useDemoStore } from "@/store/useDemoStore";

const useReadContract = jest.fn();
const useReadContracts = jest.fn();
const useWatchContractEvent = jest.fn();
const invalidateQueries = jest.fn();
const useQuery = jest.fn();
const useQueryClient = jest.fn(() => ({ invalidateQueries }));

jest.mock("wagmi", () => ({
  useReadContract: (...args: unknown[]) => useReadContract(...args),
  useReadContracts: (...args: unknown[]) => useReadContracts(...args),
  useWatchContractEvent: (...args: unknown[]) => useWatchContractEvent(...args),
  useAccount: () => ({ address: undefined, isConnected: false }),
  usePublicClient: () => null,
  useWriteContract: () => ({
    writeContract: jest.fn(),
    data: undefined,
    isPending: false,
    error: null,
    reset: jest.fn(),
  }),
  useWaitForTransactionReceipt: () => ({
    isLoading: false,
    isSuccess: false,
  }),
}));

jest.mock("recharts", () => {
  const Passthrough = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children);
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", { "data-testid": "chart" }, children),
    AreaChart: Passthrough,
    Area: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    XAxis: () => null,
    YAxis: () => null,
  };
});

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => useQuery(...args),
  useQueryClient: () => useQueryClient(),
}));

const mockParams = { id: "1" as string };

jest.mock("next/navigation", () => ({
  useParams: () => mockParams,
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

const sampleRawMarket = [
  "0x5a967532fd910921f970fCFf449eB95b61C782f4",
  BigInt(1_893_456_000),
  false,
  0,
  parseEther("2"),
  parseEther("1.25"),
  parseEther("0.75"),
] as const;

describe("MarketsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    useDemoStore.setState({ isDemoMode: false, createdMarkets: [] });
    useReadContract.mockReset();
    useReadContracts.mockReset();
    useWatchContractEvent.mockReset();
    invalidateQueries.mockReset();
    useQuery.mockReset();
    useQuery.mockReturnValue({
      data: [{ id: 0, title: "Market #0", description: "d", category: "Crypto" }],
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    });
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

  it("shows loading skeleton while metadata / on-chain reads are in flight", () => {
    useQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      isError: false,
      error: null,
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

  it("shows empty state when Supabase metadata has no markets", () => {
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

  it("merges Supabase metadata with on-chain multicall when Demo Mode is off", () => {
    const endUnix = 1_893_456_000;
    useQuery.mockReturnValue({
      data: [
        {
          id: 0,
          title: "Will ETH hit $10k?",
          description: "Resolves on CoinGecko.",
          category: "Crypto",
        },
      ],
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
      screen.getByRole("heading", { name: /will eth hit \$10k\?/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/2 ETH liquidity/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /will eth hit \$10k\?/i }),
    ).toHaveAttribute("href", "/markets/0");
  });
});

describe("MarketDetailPage live stream", () => {
  beforeEach(() => {
    localStorage.clear();
    useDemoStore.setState({ isDemoMode: false, createdMarkets: [] });
    useReadContract.mockReset();
    useWatchContractEvent.mockReset();
    invalidateQueries.mockReset();
    useQuery.mockReset();
    useQuery.mockReturnValue({
      data: {
        id: 1,
        title: "Will Brazil win?",
        description: "FIFA official results.",
        category: "Sports",
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    });
    useReadContract.mockReturnValue({
      data: sampleRawMarket,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: jest.fn(),
    });
  });

  it("renders the Live indicator when Demo Mode is OFF", () => {
    render(<MarketDetailPage />);

    expect(screen.getByTestId("live-indicator")).toBeInTheDocument();
    expect(screen.getByTestId("live-indicator")).toHaveTextContent(/live/i);
    expect(useWatchContractEvent).toHaveBeenCalled();
    expect(useQueryClient).toHaveBeenCalled();
  });

  it("does not render the Live indicator when Demo Mode is ON", () => {
    useDemoStore.setState({ isDemoMode: true });
    mockParams.id = "eth-10k-2026";
    render(<MarketDetailPage />);

    expect(screen.queryByTestId("live-indicator")).not.toBeInTheDocument();
    mockParams.id = "1";
  });

  it("wires useWatchContractEvent to invalidate readContract queries", () => {
    render(<MarketDetailPage />);

    expect(useWatchContractEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        onLogs: expect.any(Function),
      }),
    );

    const config = useWatchContractEvent.mock.calls[0]?.[0] as {
      onLogs: (logs: { args?: { marketId?: bigint } }[]) => void;
    };
    config.onLogs([{ args: { marketId: BigInt(1) } }]);

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["readContract"],
    });
  });
});
