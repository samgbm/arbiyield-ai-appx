import { parseRPCError } from "@/utils/rpcErrorHandler";
import { logger } from "@/utils/logger";

describe("parseRPCError", () => {
  const warnSpy = jest.spyOn(logger, "warn").mockImplementation(() => logger);

  afterEach(() => {
    warnSpy.mockClear();
  });

  afterAll(() => {
    warnSpy.mockRestore();
  });

  it("logs the raw error before returning a friendly message", () => {
    const raw = { code: 4001, message: "User rejected the request." };
    parseRPCError(raw);
    expect(warnSpy).toHaveBeenCalledWith(
      { rawError: raw },
      "RPC Transaction Failed",
    );
  });

  it("maps MetaMask rejection code 4001", () => {
    expect(
      parseRPCError({ code: 4001, message: "User rejected the request." }),
    ).toBe("Transaction rejected in wallet.");
  });

  it("maps user-rejected message strings", () => {
    expect(
      parseRPCError(new Error("User denied transaction signature.")),
    ).toBe("Transaction rejected in wallet.");
    expect(parseRPCError({ code: "ACTION_REJECTED", message: "Rejected" })).toBe(
      "Transaction rejected in wallet.",
    );
  });

  it("maps insufficient funds errors", () => {
    expect(
      parseRPCError(new Error("insufficient funds for gas * price + value")),
    ).toBe("Insufficient ETH to complete this transaction.");
  });

  it("maps Stylus / contract MarketResolved reverts", () => {
    expect(
      parseRPCError({
        shortMessage: "Execution reverted",
        message: "MarketResolved: already settled",
      }),
    ).toBe("This market has already been resolved.");
  });

  it("maps unknown errors to the network fallback", () => {
    expect(parseRPCError(new Error("weird rpc blob xyz"))).toBe(
      "An unexpected network error occurred. Please try again.",
    );
    expect(parseRPCError(null)).toBe(
      "An unexpected network error occurred. Please try again.",
    );
  });
});
