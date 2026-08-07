import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { waitFor } from "@testing-library/react";
import { MarketAdminPanel } from "@/components/markets/MarketAdminPanel";
import { OUTCOME_YES } from "@/components/markets/TradePanel";
import { PMM_CONTRACT_ADDRESS, pmmABI } from "@/lib/pmmContract";

const CREATOR = "0x5a967532fd910921f970fCFf449eB95b61C782f4";
const OTHER = "0x0000000000000000000000000000000000000001";

const writeContract = jest.fn();
const writeContractAsync = jest.fn(async (...args: unknown[]) => {
  writeContract(...args);
  return "0xabc" as `0x${string}`;
});
const reset = jest.fn();

const wagmiState = {
  address: CREATOR as `0x${string}` | undefined,
  isPending: false,
  isConfirming: false,
  isSuccess: false,
  hash: undefined as `0x${string}` | undefined,
  writeError: null as Error | null,
};

jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn(), warning: jest.fn() },
}));

jest.mock("wagmi", () => ({
  useAccount: () => ({ address: wagmiState.address }),
  useWriteContract: () => ({
    writeContract,
    writeContractAsync,
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

/** End timestamp far in the past so resolve is unlocked. */
const ENDED_TS = Math.floor(Date.now() / 1000) - 60;
/** End timestamp still in the future. */
const FUTURE_TS = Math.floor(Date.now() / 1000) + 3600;

const ADMIN_PROPS = {
  marketId: 1 as string | number,
  creatorAddress: CREATOR,
  isResolved: false,
  endTimestamp: ENDED_TS,
  title: "Will ETH Lima have over 1000 attendees?",
  description: "Resolves YES if official attendance ≥ 1000.",
};

describe("MarketAdminPanel", () => {
  beforeEach(() => {
    wagmiState.address = CREATOR;
    wagmiState.isPending = false;
    wagmiState.isConfirming = false;
    wagmiState.isSuccess = false;
    wagmiState.hash = undefined;
    wagmiState.writeError = null;
    writeContract.mockClear();
    writeContractAsync.mockClear();
    reset.mockClear();
  });

  it("renders for the market creator when not resolved", () => {
    render(<MarketAdminPanel {...ADMIN_PROPS} />);

    expect(screen.getByTestId("market-admin-panel")).toBeInTheDocument();
    expect(screen.getByTestId("resolve-yes")).toBeInTheDocument();
    expect(screen.getByTestId("resolve-no")).toBeInTheDocument();
    expect(screen.getByTestId("ai-oracle-resolve")).toBeInTheDocument();
  });

  it("hides itself when the connected account is not the creator", () => {
    wagmiState.address = OTHER;
    const { container } = render(<MarketAdminPanel {...ADMIN_PROPS} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("market-admin-panel")).not.toBeInTheDocument();
  });

  it("hides itself when the market is already resolved", () => {
    const { container } = render(
      <MarketAdminPanel {...ADMIN_PROPS} isResolved={true} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("market-admin-panel")).not.toBeInTheDocument();
  });

  it("disables resolve until the market end time is reached", () => {
    render(<MarketAdminPanel {...ADMIN_PROPS} endTimestamp={FUTURE_TS} />);

    expect(screen.getByTestId("resolve-waiting")).toBeInTheDocument();
    expect(screen.getByTestId("resolve-yes")).toBeDisabled();
    expect(screen.getByTestId("resolve-no")).toBeDisabled();
    expect(screen.getByTestId("market-end-countdown")).toHaveAttribute(
      "data-state",
      "counting",
    );
  });

  it("unlocks resolve after the end time", () => {
    render(<MarketAdminPanel {...ADMIN_PROPS} />);

    expect(screen.queryByTestId("resolve-waiting")).not.toBeInTheDocument();
    expect(screen.getByTestId("resolve-yes")).not.toBeDisabled();
    expect(screen.getByTestId("market-end-countdown")).toHaveAttribute(
      "data-state",
      "ended",
    );
  });

  it("calls resolveMarket with YES outcome id", async () => {
    const user = userEvent.setup();
    render(<MarketAdminPanel {...ADMIN_PROPS} marketId={3} />);

    await user.click(screen.getByTestId("resolve-yes"));

    await waitFor(() => {
      expect(writeContract).toHaveBeenCalledTimes(1);
    });

    expect(writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: PMM_CONTRACT_ADDRESS,
        abi: pmmABI,
        functionName: "resolveMarket",
        args: [BigInt(3), OUTCOME_YES],
        chainId: 421_614,
      }),
    );
  });
});
