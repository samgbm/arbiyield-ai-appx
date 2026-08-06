"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ExternalLink,
  LoaderCircle,
  Rocket,
  Tag,
} from "lucide-react";
import { parseEventLogs, type Log } from "viem";
import {
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { estimateArbitrumSepoliaFees } from "@/lib/gas";
import { PMM_CONTRACT_ADDRESS, pmmABI } from "@/lib/pmmContract";

/** Arbitrum Sepolia — avoid importing wagmi/chains (Jest ESM friction). */
const ARBITRUM_SEPOLIA_CHAIN_ID = 421_614;

export type MarketPreviewProps = {
  title: string;
  description: string;
  category: string;
  endDate: string;
};

const ARBISCAN_TX = "https://sepolia.arbiscan.io/tx";

/** Convert an ISO / date string into UNIX seconds for `createMarket`. */
export function endDateToUnixSeconds(endDate: string): bigint {
  const ms = Date.parse(endDate);
  if (Number.isNaN(ms)) {
    throw new Error(`Invalid endDate: ${endDate}`);
  }
  return BigInt(Math.floor(ms / 1000));
}

function shortTxHash(hash: `0x${string}`) {
  return `${hash.slice(0, 10)}…${hash.slice(-4)}`;
}

function marketIdFromReceipt(
  isSuccess: boolean,
  receipt: { logs: Log[] } | undefined,
): string | null {
  if (!isSuccess || !receipt) return null;
  try {
    const logs = parseEventLogs({
      abi: pmmABI,
      eventName: "MarketCreated",
      logs: receipt.logs,
    });
    const created = logs[0];
    if (created?.args?.marketId !== undefined) {
      return created.args.marketId.toString();
    }
  } catch {
    // Receipt may lack decodeable logs in edge cases.
  }
  return null;
}

/**
 * Generative UI summary card streamed by the AI Market Creator.
 * Deploy calls `createMarket` on the MeleePMM Stylus contract.
 */
export function MarketPreviewCard({
  title,
  description,
  category,
  endDate,
}: MarketPreviewProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  const publicClient = usePublicClient({ chainId: ARBITRUM_SEPOLIA_CHAIN_ID });

  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const endTimestamp = useMemo(() => {
    try {
      return endDateToUnixSeconds(endDate);
    } catch {
      return null;
    }
  }, [endDate]);

  const marketId = useMemo(
    () => marketIdFromReceipt(isSuccess, receipt),
    [isSuccess, receipt],
  );

  async function handleDeploy() {
    setLocalError(null);
    if (endTimestamp === null) {
      setLocalError("Invalid end date — cannot deploy.");
      return;
    }

    if (isSuccess) return;

    reset();

    // Fresh EIP-1559 fees — Arbitrum Sepolia baseFee often rises mid-prompt.
    let maxFeePerGas: bigint | undefined;
    let maxPriorityFeePerGas: bigint | undefined;
    if (publicClient) {
      try {
        const fees = await estimateArbitrumSepoliaFees(publicClient);
        maxFeePerGas = fees.maxFeePerGas;
        maxPriorityFeePerGas = fees.maxPriorityFeePerGas;
      } catch {
        // Fall back to wagmi/wallet defaults if fee estimate fails.
      }
    }

    writeContract({
      address: PMM_CONTRACT_ADDRESS,
      abi: pmmABI,
      functionName: "createMarket",
      args: [endTimestamp],
      chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
      ...(maxFeePerGas != null
        ? { maxFeePerGas, maxPriorityFeePerGas }
        : {}),
    });
  }

  const busy = isPending || isConfirming;
  const errorMessage =
    localError ??
    (writeError ? (writeError.message.split("\n")[0] ?? "Transaction failed") : null);

  return (
    <article
      data-testid="market-preview-card"
      className="overflow-hidden rounded-[var(--radius-panel)] border border-primary/35 bg-secondary shadow-[0_0_28px_color-mix(in_oklab,var(--primary)_18%,transparent)]"
    >
      <div className="border-b border-border bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_16%,transparent),transparent)] px-4 py-3 sm:px-5">
        <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          Generative market preview
        </p>
        <h3 className="mt-1 text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {title}
        </h3>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <p className="text-sm leading-relaxed text-[var(--accent)]">
          {description}
        </p>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1 text-xs font-semibold text-foreground ring-1 ring-border">
            <Tag className="size-3.5 text-primary" aria-hidden />
            {category}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1 text-xs font-semibold text-foreground ring-1 ring-border">
            <CalendarClock className="size-3.5 text-primary" aria-hidden />
            <time dateTime={endDate}>{endDate}</time>
          </span>
        </div>

        <button
          type="button"
          onClick={handleDeploy}
          disabled={busy || isSuccess || endTimestamp === null}
          data-testid="deploy-button"
          className={
            isSuccess
              ? "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white"
              : "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          }
        >
          {isPending ? (
            <>Confirming in Wallet...</>
          ) : isConfirming ? (
            <>
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden
                data-testid="deploy-spinner"
              />
              Deploying to Stylus...
            </>
          ) : isSuccess ? (
            <>Market Deployed!</>
          ) : (
            <>
              <Rocket className="size-4" aria-hidden />
              Deploy to Arbitrum Stylus
            </>
          )}
        </button>

        {isSuccess && hash && (
          <div
            role="status"
            data-testid="deploy-success"
            className="space-y-2 rounded-lg bg-emerald-500/12 px-3 py-3 text-center ring-1 ring-emerald-500/35"
          >
            <a
              href={`${ARBISCAN_TX}/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="arbiscan-link"
              className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
            >
              Tx {shortTxHash(hash)}
              <ExternalLink className="size-3.5" aria-hidden />
            </a>

            {marketId !== null && (
              <Link
                href={`/markets/${marketId}`}
                data-testid="market-link"
                className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-emerald-600 px-3 text-sm font-bold text-white transition hover:brightness-110"
              >
                Open market #{marketId}
              </Link>
            )}
          </div>
        )}

        {errorMessage && !isSuccess && (
          <p
            role="alert"
            data-testid="deploy-error"
            className="rounded-lg bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] px-3 py-2 text-center text-sm font-semibold text-[var(--danger)] ring-1 ring-[color-mix(in_oklab,var(--danger)_30%,transparent)]"
          >
            {errorMessage}
          </p>
        )}
      </div>
    </article>
  );
}
