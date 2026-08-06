import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarketPreviewCard } from "@/components/markets/MarketPreviewCard";
import { PMM_CONTRACT_ADDRESS, pmmABI } from "@/lib/pmmContract";

const sample = {
  title: "Will Brazil win the next World Cup?",
  description:
    "Resolves YES if Brazil is crowned FIFA World Cup champion at the next tournament.",
  category: "Sports",
  endDate: "2030-07-20T23:59:59.000Z",
};

const writeContract = jest.fn();
const reset = jest.fn();

const wagmiState = {
  isPending: false,
  isConfirming: false,
  isSuccess: false,
  hash: undefined as `0x${string}` | undefined,
  receipt: undefined as { logs: unknown[] } | undefined,
  writeError: null as Error | null,
};

jest.mock("wagmi", () => ({
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
    data: wagmiState.receipt,
  }),
  usePublicClient: () => null,
}));

jest.mock("viem", () => {
  const actual = jest.requireActual("viem") as typeof import("viem");
  return {
    ...actual,
    parseEventLogs: jest.fn(() => [
      {
        eventName: "MarketCreated",
        args: {
          marketId: BigInt(7),
          creator: "0x0000000000000000000000000000000000000001",
          endTimestamp: BigInt(1),
        },
      },
    ]),
  };
});

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

function resetWagmi() {
  wagmiState.isPending = false;
  wagmiState.isConfirming = false;
  wagmiState.isSuccess = false;
  wagmiState.hash = undefined;
  wagmiState.receipt = undefined;
  wagmiState.writeError = null;
  writeContract.mockClear();
  reset.mockClear();
}

describe("MarketPreviewCard", () => {
  beforeEach(() => {
    resetWagmi();
  });

  it("renders market preview props", () => {
    render(<MarketPreviewCard {...sample} />);

    expect(
      screen.getByRole("heading", {
        name: /will brazil win the next world cup\?/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(sample.description)).toBeInTheDocument();
    expect(screen.getByText("Sports")).toBeInTheDocument();
    expect(screen.getByText(sample.endDate)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /deploy to arbitrum stylus/i }),
    ).toBeEnabled();
  });

  it("calls createMarket via useWriteContract on deploy", async () => {
    const user = userEvent.setup();
    render(<MarketPreviewCard {...sample} />);

    await user.click(
      screen.getByRole("button", { name: /deploy to arbitrum stylus/i }),
    );

    await screen.findByRole("button", { name: /deploy to arbitrum stylus/i });
    expect(writeContract).toHaveBeenCalledTimes(1);
    expect(writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: PMM_CONTRACT_ADDRESS,
        abi: pmmABI,
        functionName: "createMarket",
        args: [BigInt(Math.floor(Date.parse(sample.endDate) / 1000))],
        chainId: 421_614,
      }),
    );
  });

  it("shows Confirming in Wallet... while isPending", () => {
    wagmiState.isPending = true;
    render(<MarketPreviewCard {...sample} />);

    const button = screen.getByTestId("deploy-button");
    expect(button).toHaveTextContent(/confirming in wallet/i);
    expect(button).toBeDisabled();
  });

  it("shows Deploying to Stylus... spinner while confirming", () => {
    wagmiState.isConfirming = true;
    wagmiState.hash =
      "0xabc1230000000000000000000000000000000000000000000000000000000099";
    render(<MarketPreviewCard {...sample} />);

    const button = screen.getByTestId("deploy-button");
    expect(button).toHaveTextContent(/deploying to stylus/i);
    expect(button).toBeDisabled();
    expect(screen.getByTestId("deploy-spinner")).toBeInTheDocument();
  });

  it("shows Market Deployed! success state with arbiscan and market link", async () => {
    const hash =
      "0xdeadbeef0000000000000000000000000000000000000000000000000000cafe" as const;

    wagmiState.hash = hash;
    wagmiState.isSuccess = true;
    wagmiState.receipt = { logs: [] };

    render(<MarketPreviewCard {...sample} />);

    expect(screen.getByTestId("deploy-button")).toHaveTextContent(
      /market deployed!/i,
    );
    expect(screen.getByTestId("deploy-button")).toBeDisabled();
    expect(screen.getByTestId("arbiscan-link")).toHaveAttribute(
      "href",
      `https://sepolia.arbiscan.io/tx/${hash}`,
    );
    expect(screen.getByTestId("arbiscan-link")).toHaveTextContent(/0xdeadbeef/i);

    expect(await screen.findByTestId("market-link")).toHaveAttribute(
      "href",
      "/markets/7",
    );
  });
});
