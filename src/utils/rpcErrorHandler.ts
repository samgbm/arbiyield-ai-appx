/**
 * Turn wagmi / viem / wallet RPC failures into short UI copy.
 * Raw errors are logged via pino for developer visibility.
 */

import { logger } from "@/utils/logger";

function asErrorText(error: unknown): string {
  if (error == null) return "";
  if (typeof error === "string") return error;

  if (error instanceof Error) {
    const withCause = error as Error & { cause?: unknown; shortMessage?: string };
    const parts = [
      withCause.shortMessage,
      withCause.message,
      typeof withCause.cause === "string"
        ? withCause.cause
        : withCause.cause instanceof Error
          ? withCause.cause.message
          : "",
    ];
    return parts.filter(Boolean).join(" | ");
  }

  if (typeof error === "object") {
    const obj = error as Record<string, unknown>;
    const nested = [obj.shortMessage, obj.message, obj.details, obj.reason]
      .filter((v): v is string => typeof v === "string")
      .join(" | ");
    if (nested) return nested;

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return String(error);
}

function getErrorCode(error: unknown): number | string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const obj = error as Record<string, unknown>;
  if (typeof obj.code === "number" || typeof obj.code === "string") {
    return obj.code;
  }
  const cause = obj.cause;
  if (cause && typeof cause === "object") {
    const c = cause as Record<string, unknown>;
    if (typeof c.code === "number" || typeof c.code === "string") {
      return c.code;
    }
  }
  return undefined;
}

function serializeRawError(error: unknown): unknown {
  if (error instanceof Error) {
    const withExtras = error as Error & {
      shortMessage?: string;
      code?: number | string;
      cause?: unknown;
    };
    return {
      name: withExtras.name,
      message: withExtras.message,
      shortMessage: withExtras.shortMessage,
      code: withExtras.code,
      cause:
        withExtras.cause instanceof Error
          ? {
              name: withExtras.cause.name,
              message: withExtras.cause.message,
            }
          : withExtras.cause,
    };
  }
  return error;
}

/**
 * Map a raw RPC / wallet / contract error into a human-readable string.
 */
export function parseRPCError(error: unknown): string {
  logger.warn(
    { rawError: serializeRawError(error) },
    "RPC Transaction Failed",
  );

  const code = getErrorCode(error);
  const text = asErrorText(error);
  const lower = text.toLowerCase();

  // EIP-1193 user rejection (MetaMask et al.)
  if (
    code === 4001 ||
    code === "ACTION_REJECTED" ||
    lower.includes("user rejected") ||
    lower.includes("user denied") ||
    lower.includes("rejected the request") ||
    lower.includes("rejected the transaction") ||
    lower.includes("request rejected")
  ) {
    return "Transaction rejected in wallet.";
  }

  if (
    lower.includes("insufficient funds") ||
    lower.includes("exceeds the balance") ||
    lower.includes("insufficient eth") ||
    lower.includes("gas required exceeds allowance") ||
    lower.includes("sender doesn't have enough funds")
  ) {
    return "Insufficient ETH to complete this transaction.";
  }

  // Stylus / MeleePMM custom-ish revert fragments
  if (
    lower.includes("marketresolved") ||
    lower.includes("market already resolved") ||
    lower.includes("already resolved")
  ) {
    return "This market has already been resolved.";
  }

  if (
    lower.includes("marketnotended") ||
    lower.includes("market not ended") ||
    lower.includes("before end")
  ) {
    return "This market has not ended yet.";
  }

  if (
    lower.includes("noposition") ||
    lower.includes("no position") ||
    lower.includes("nothing to claim")
  ) {
    return "No claimable position found for this market.";
  }

  if (lower.includes("marketnotfound") || lower.includes("invalid market")) {
    return "Market not found on-chain.";
  }

  if (
    lower.includes("network changed") ||
    lower.includes("chain mismatch") ||
    lower.includes("wrong network")
  ) {
    return "Wrong network. Switch to Arbitrum Sepolia and try again.";
  }

  return "An unexpected network error occurred. Please try again.";
}
