import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { parseEther } from "viem";
import {
  calculateMinReturnFloor,
  OUTCOME_NO,
  OUTCOME_YES,
  TradePanel,
} from "@/components/markets/TradePanel";
import { PMM_CONTRACT_ADDRESS, pmmABI } from "@/lib/pmmContract";
import { useDemoStore } from "@/store/useDemoStore";

const writeContract = jest.fn();
const writeContractAsync = jest.fn(async (...args: unknown[]) => {
  writeContract(...args);
  return "0xabc" as `0x${string}`;
});
const reset = jest.fn();

const wagmiState = {
  isPending: false,
  isConfirming: false,
  isSuccess: false,
  hash: undefined as `0x${string}` | undefined,
  writeError: null as Error | null,
};

jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

jest.mock("wagmi", () => ({
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

function resetWagmi() {
  wagmiState.isPending = false;
  wagmiState.isConfirming = false;
  wagmiState.isSuccess = false;
  wagmiState.hash = undefined;
  wagmiState.writeError = null;
  writeContract.mockClear();
  writeContractAsync.mockClear();
  reset.mockClear();
}

describe("TradePanel", () => {
  beforeEach(() => {
    localStorage.clear();
    useDemoStore.setState({ isDemoMode: false, createdMarkets: [] });
    resetWagmi();
  });

  it("renders the bet amount input", () => {
    render(<TradePanel marketId={1} />);

    expect(screen.getByLabelText(/bet amount \(eth\)/i)).toBeInTheDocument();
  });

  it("toggles between Yes and No sides", async () => {
    const user = userEvent.setup();
    render(<TradePanel marketId={1} />);

    const yes = screen.getByRole("button", { name: /^yes$/i });
    const no = screen.getByRole("button", { name: /^no$/i });

    expect(yes).toHaveAttribute("aria-pressed", "true");
    expect(no).toHaveAttribute("aria-pressed", "false");

    await user.click(no);

    expect(no).toHaveAttribute("aria-pressed", "true");
    expect(yes).toHaveAttribute("aria-pressed", "false");
  });

  it("displays the Minimum Return Floor when a bet amount is entered", async () => {
    const user = userEvent.setup();
    render(<TradePanel marketId={1} />);

    const input = screen.getByLabelText(/bet amount \(eth\)/i);
    await user.clear(input);
    await user.type(input, "0.05");

    expect(screen.getByTestId("floor-preview")).toBeInTheDocument();
    expect(
      screen.getByText(
        `Min return floor: ${calculateMinReturnFloor(0.05).toFixed(4)} ETH`,
      ),
    ).toBeInTheDocument();
    expect(calculateMinReturnFloor(0.05)).toBeCloseTo(0.09);
  });

  it("shows the floor tooltip explanation", async () => {
    const user = userEvent.setup();
    render(<TradePanel marketId={1} />);

    await user.click(screen.getByRole("button", { name: /floor explanation/i }));

    expect(
      screen.getByText(
        /this floor is mathematically guaranteed by the pmm and cannot be diluted by late capital/i,
      ),
    ).toBeInTheDocument();
  });

  it("calls buyShares with parseEther value when Demo Mode is off", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<TradePanel marketId={1} onSubmit={onSubmit} />);

    const input = screen.getByLabelText(/bet amount \(eth\)/i);
    await user.clear(input);
    await user.type(input, "0.05");
    await user.click(screen.getByTestId("place-trade-button"));

    await waitFor(() => {
      expect(writeContract).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith({ side: "Yes", amount: 0.05 });
    expect(writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: PMM_CONTRACT_ADDRESS,
        abi: pmmABI,
        functionName: "buyShares",
        args: [BigInt(1), OUTCOME_YES],
        value: parseEther("0.05"),
        chainId: 421_614,
      }),
    );
  });

  it("maps No side to outcome id 0", async () => {
    const user = userEvent.setup();
    render(<TradePanel marketId="2" />);

    await user.click(screen.getByRole("button", { name: /^no$/i }));
    const input = screen.getByLabelText(/bet amount \(eth\)/i);
    await user.type(input, "0.1");
    await user.click(screen.getByTestId("place-trade-button"));

    await waitFor(() => {
      expect(writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: "buyShares",
          args: [BigInt(2), OUTCOME_NO],
          value: parseEther("0.1"),
        }),
      );
    });
  });

  it("does not call the contract when Demo Mode is on", async () => {
    useDemoStore.setState({ isDemoMode: true });
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<TradePanel marketId={1} onSubmit={onSubmit} />);

    const input = screen.getByLabelText(/bet amount \(eth\)/i);
    await user.type(input, "0.05");
    await user.click(screen.getByTestId("place-trade-button"));

    expect(onSubmit).toHaveBeenCalledWith({ side: "Yes", amount: 0.05 });
    expect(writeContract).not.toHaveBeenCalled();
  });

  it("shows Executing on Stylus... while confirming", () => {
    wagmiState.isConfirming = true;
    wagmiState.hash =
      "0xabc1230000000000000000000000000000000000000000000000000000000099";
    render(<TradePanel marketId={1} />);

    expect(screen.getByTestId("place-trade-button")).toHaveTextContent(
      /executing on stylus/i,
    );
    expect(screen.getByTestId("place-trade-button")).toBeDisabled();
    expect(screen.getByTestId("trade-spinner")).toBeInTheDocument();
  });
});
