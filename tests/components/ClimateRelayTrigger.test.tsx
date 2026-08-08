import { render, screen } from "@testing-library/react";
import { ClimateRelayTrigger } from "../../src/components/elnino/ClimateRelayTrigger";

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    message: jest.fn(),
  },
}));

jest.mock("wagmi", () => ({
  useAccount: () => ({
    address: undefined,
    isConnected: false,
  }),
  usePublicClient: () => null,
  useWriteContract: () => ({
    writeContractAsync: jest.fn(),
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

jest.mock("../../src/store/useDemoStore", () => ({
  useDemoStore: (selector: (s: { isDemoMode: boolean }) => unknown) =>
    selector({ isDemoMode: true }),
}));

describe("ClimateRelayTrigger", () => {
  it("renders the Push Weather Data button accessibly", () => {
    render(<ClimateRelayTrigger />);

    expect(screen.getByTestId("climate-relay-trigger")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /push weather data/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-testid", "push-weather-data");
    expect(screen.getByTestId("climate-location")).toBeInTheDocument();
    expect(screen.getByTestId("climate-rainfall")).toBeInTheDocument();
  });
});
