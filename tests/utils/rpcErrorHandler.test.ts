import { parseRPCError } from "@/utils/rpcErrorHandler";

describe("parseRPCError", () => {
  it("maps MetaMask rejection code 4001", () => {
    expect(parseRPCError({ code: 4001, message: "User rejected the request." })).toBe(
      "Transaction rejected in wallet.",
    );
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
