import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { parseEther } from "viem";
import { UserPositions } from "@/components/markets/UserPositions";
import { OUTCOME_YES } from "@/components/markets/TradePanel";
import { PMM_CONTRACT_ADDRESS, pmmABI } from "@/lib/pmmContract";
import { useDemoStore } from "@/store/useDemoStore";

const writeContract = jest.fn();
const reset = jest.fn();
const refetchPositions = jest.fn();

const wagmiState = {
  address: "0x5a967532fd910921f970fCFf449eB95b61C782f4" as `0x${string}`,
  isConnected: true,
  isPending: false,
  isConfirming: false,
  isSuccess: false,
  hash: undefined as `0x${string}` | undefined,
  writeError: null as Error | null,
  positionData: undefined as
    | Array<{
        status: "success";
        result: readonly [bigint, bigint, bigint, boolean];
      }>
    | undefined,
  isPositionsLoading: false,
};

jest.mock("wagmi", () => ({
  useAccount: () => ({
    address: wagmiState.address,
    isConnected: wagmiState.isConnected,
  }),
  useReadContracts: () => ({
    data: wagmiState.positionData,
    isLoading: wagmiState.isPositionsLoading,
    refetch: refetchPositions,
  }),
  useWriteContract: () => ({
    writeContract,
    data: wagmiState.hash,
    isPending: wagmiState.isPending,
    error: wagmiState.writeError,
    reset,
  }),
  useWaitForTransactionReceipt: () => ({
    isLoading: wagmiState.isConfirming,
    isSuccess: wagmiState.isSuccess,
  }),
  usePublicClient: () => null,
}));

function resetMocks() {
  wagmiState.address = "0x5a967532fd910921f970fCFf449eB95b61C782f4";
  wagmiState.isConnected = true;
  wagmiState.isPending = false;
  wagmiState.isConfirming = false;
  wagmiState.isSuccess = false;
  wagmiState.hash = undefined;
  wagmiState.writeError = null;
  wagmiState.positionData = undefined;
  wagmiState.isPositionsLoading = false;
  writeContract.mockClear();
  reset.mockClear();
  refetchPositions.mockClear();
}

describe("UserPositions", () => {
  beforeEach(() => {
    localStorage.clear();
    useDemoStore.setState({ isDemoMode: false, createdMarkets: [] });
    resetMocks();
  });

  it("renders empty state when no shares are held", () => {
    wagmiState.positionData = [
      {
        status: "success",
        result: [BigInt(0), BigInt(0), BigInt(0), false],
      },
      {
        status: "success",
        result: [BigInt(0), BigInt(0), BigInt(0), false],
      },
    ];

    render(<UserPositions marketId={1} />);

    expect(screen.getByTestId("user-positions-empty")).toHaveTextContent(
      /no active shares/i,
    );
    expect(screen.queryByTestId("cashout-Yes")).not.toBeInTheDocument();
  });

  it("displays share count, floor, and Cashout when a position exists", () => {
    wagmiState.positionData = [
      {
        status: "success",
        result: [BigInt(0), BigInt(0), BigInt(0), false],
      },
      {
        status: "success",
        result: [
          parseEther("0.05"),
          parseEther("0.05"),
          parseEther("0.09"),
          false,
        ],
      },
    ];

    render(<UserPositions marketId={1} />);

    expect(screen.getByTestId("user-positions")).toBeInTheDocument();
    expect(screen.getByTestId("position-row-Yes")).toBeInTheDocument();
    expect(screen.getByTestId("shares-owned")).toHaveTextContent(/0\.05/);
    expect(screen.getByTestId("min-return-floor")).toHaveTextContent(/0\.09/);
    expect(screen.getByTestId("cashout-Yes")).toHaveTextContent(
      /instant cashout/i,
    );
  });

  it("triggers cashoutShares write when Instant Cashout is clicked", async () => {
    const user = userEvent.setup();
    wagmiState.positionData = [
      {
        status: "success",
        result: [BigInt(0), BigInt(0), BigInt(0), false],
      },
      {
        status: "success",
        result: [
          parseEther("0.05"),
          parseEther("0.05"),
          parseEther("0.09"),
          false,
        ],
      },
    ];

    render(<UserPositions marketId={1} />);

    await user.click(screen.getByTestId("cashout-Yes"));

    await waitFor(() => {
      expect(writeContract).toHaveBeenCalledTimes(1);
    });

    expect(writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: PMM_CONTRACT_ADDRESS,
        abi: pmmABI,
        functionName: "cashoutShares",
        args: [BigInt(1), OUTCOME_YES],
        chainId: 421_614,
      }),
    );
  });

  it("shows mock positions in Demo Mode", () => {
    useDemoStore.setState({ isDemoMode: true });

    render(<UserPositions marketId="demo-market" />);

    expect(screen.getByTestId("user-positions")).toBeInTheDocument();
    expect(screen.getByTestId("shares-owned")).toHaveTextContent(/0\.05/);
    expect(screen.getByTestId("cashout-Yes")).toBeDisabled();
  });

  it("asks to connect wallet when disconnected in live mode", () => {
    wagmiState.isConnected = false;
    wagmiState.address = undefined as unknown as `0x${string}`;

    render(<UserPositions marketId={1} />);

    expect(screen.getByTestId("user-positions-connect")).toHaveTextContent(
      /connect a wallet/i,
    );
  });
});
