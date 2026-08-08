import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BatchOnboardForm } from "../../src/components/elnino/BatchOnboardForm";

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("wagmi", () => ({
  useAccount: () => ({ isConnected: false }),
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
  useDemoStore: (
    selector: (s: { isDemoMode: boolean }) => unknown,
  ) => selector({ isDemoMode: true }),
}));

describe("BatchOnboardForm", () => {
  it("renders accessible farmer fields and adds a new row", async () => {
    const user = userEvent.setup();
    render(<BatchOnboardForm />);

    expect(screen.getByTestId("batch-onboard-form")).toBeInTheDocument();
    expect(screen.getByTestId("farmer-row-0")).toBeInTheDocument();
    expect(screen.getByTestId("farmer-address-0")).toBeInTheDocument();
    expect(screen.getByTestId("farmer-location-0")).toBeInTheDocument();
    expect(screen.getByTestId("farmer-coverage-0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add row/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /batch register/i }),
    ).toBeInTheDocument();

    expect(screen.queryByTestId("farmer-row-1")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("add-farmer-row"));

    expect(screen.getByTestId("farmer-row-1")).toBeInTheDocument();
    expect(screen.getByTestId("farmer-address-1")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/farmer address/i).length).toBeGreaterThanOrEqual(
      2,
    );
  });
});
