"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, ExternalLink, Gavel, LoaderCircle } from "lucide-react";
import { getAddress, isAddressEqual } from "viem";
import { toast } from "sonner";
import {
  useAccount,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { MarketEndCountdown } from "@/components/markets/MarketEndCountdown";
import { OUTCOME_NO, OUTCOME_YES } from "@/components/markets/TradePanel";
import { estimateArbitrumSepoliaFees } from "@/lib/gas";
import { PMM_CONTRACT_ADDRESS, pmmABI } from "@/lib/pmmContract";
import type { OracleVerdict } from "@/lib/schemas";
import { hasMarketEnded } from "@/utils/marketDates";
import { parseRPCError } from "@/utils/rpcErrorHandler";

const ARBITRUM_SEPOLIA_CHAIN_ID = 421_614;
const ARBISCAN_TX = "https://sepolia.arbiscan.io/tx";

function shortTxHash(hash: `0x${string}`) {
  return `${hash.slice(0, 10)}…${hash.slice(-4)}`;
}

function addressesMatch(
  a: string | undefined,
  b: string | undefined,
): boolean {
  if (!a || !b) return false;
  try {
    return isAddressEqual(getAddress(a), getAddress(b));
  } catch {
    return a.toLowerCase() === b.toLowerCase();
  }
}

type MarketAdminPanelProps = {
  marketId: string | number;
  creatorAddress: string;
  isResolved: boolean;
  /** On-chain market end (unix seconds). Resolve is blocked until this passes. */
  endTimestamp: number | bigint | string;
  /** Off-chain market title fed to the AI Oracle. */
  title: string;
  /** Off-chain market description / resolution criteria for the AI Oracle. */
  description: string;
  /** Called after a successful resolve so the page can refetch market state. */
  onResolved?: () => void;
};

/**
 * Creator-only oracle controls to resolve a MeleePMM market YES or NO.
 */
export function MarketAdminPanel({
  marketId,
  creatorAddress,
  isResolved,
  endTimestamp,
  title,
  description,
  onResolved,
}: MarketAdminPanelProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: ARBITRUM_SEPOLIA_CHAIN_ID });
  const notifiedHash = useRef<`0x${string}` | null>(null);
  const resolveYesRef = useRef<HTMLButtonElement>(null);
  const resolveNoRef = useRef<HTMLButtonElement>(null);
  const [pendingOutcome, setPendingOutcome] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [oracleLoading, setOracleLoading] = useState(false);
  const [oracleResult, setOracleResult] = useState<OracleVerdict | null>(null);

  const {
    writeContractAsync,
    data: hash,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract({
    mutation: {
      onError(error) {
        toast.error(parseRPCError(error));
      },
    },
  });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (!isSuccess || !hash || notifiedHash.current === hash) return;
    notifiedHash.current = hash;
    toast.success("Transaction confirmed!");
    onResolved?.();
  }, [isSuccess, hash, onResolved]);

  useEffect(() => {
    if (isResolved) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [isResolved, endTimestamp]);

  const isCreator = useMemo(
    () => addressesMatch(address, creatorAddress),
    [address, creatorAddress],
  );

  const ended = hasMarketEnded(endTimestamp, new Date(now));

  if (!isCreator || isResolved) {
    return null;
  }

  const marketIdBig = (() => {
    try {
      return BigInt(String(marketId));
    } catch {
      return null;
    }
  })();

  const busy = isPending || isConfirming;
  const canResolve = ended && marketIdBig != null && !busy && !oracleLoading;

  async function runAiOracle() {
    if (!title.trim() || !description.trim()) {
      toast.error("Market title and description are required for the AI Oracle.");
      return;
    }

    setOracleLoading(true);
    setOracleResult(null);

    try {
      const res = await fetch("/api/markets/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const data = (await res.json()) as OracleVerdict & { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? `Oracle failed (${res.status})`);
      }

      setOracleResult({
        verdict: data.verdict,
        reasoning: data.reasoning,
        sources: data.sources ?? [],
      });

      if (data.verdict === "UNDECIDED") {
        toast.warning(
          "AI Oracle could not determine the outcome — not enough public evidence.",
        );
        return;
      }

      // Focus the matching on-chain button; creator still signs manually.
      requestAnimationFrame(() => {
        if (data.verdict === "YES") resolveYesRef.current?.focus();
        if (data.verdict === "NO") resolveNoRef.current?.focus();
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "AI Oracle request failed",
      );
    } finally {
      setOracleLoading(false);
    }
  }

  async function resolve(winningOutcome: number) {
    if (marketIdBig == null || !ended) return;

    reset();
    notifiedHash.current = null;
    setPendingOutcome(winningOutcome);

    let maxFeePerGas: bigint | undefined;
    let maxPriorityFeePerGas: bigint | undefined;
    if (publicClient) {
      try {
        const fees = await estimateArbitrumSepoliaFees(publicClient);
        maxFeePerGas = fees.maxFeePerGas;
        maxPriorityFeePerGas = fees.maxPriorityFeePerGas;
      } catch {
        // Fall back to wallet defaults.
      }
    }

    try {
      await writeContractAsync({
        address: PMM_CONTRACT_ADDRESS,
        abi: pmmABI,
        functionName: "resolveMarket",
        args: [marketIdBig, winningOutcome],
        chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
        ...(maxFeePerGas != null
          ? { maxFeePerGas, maxPriorityFeePerGas }
          : {}),
      });
    } catch {
      // mutation.onError already toasted a clean message.
    }
  }

  const errorMessage = writeError ? parseRPCError(writeError) : null;

  function buttonLabel(outcome: number, label: string) {
    const isThis = busy && pendingOutcome === outcome;
    if (isThis && isPending) return "Confirming in Wallet...";
    if (isThis && isConfirming) return "Resolving on Stylus...";
    if (!ended) return `Waiting… Resolve ${label}`;
    return `Resolve ${label}`;
  }

  const recommendYes = oracleResult?.verdict === "YES";
  const recommendNo = oracleResult?.verdict === "NO";

  return (
    <section
      data-testid="market-admin-panel"
      className="mb-6 overflow-hidden rounded-[var(--radius-panel)] border border-amber-500/40 bg-[color-mix(in_oklab,var(--secondary)_92%,#f59e0b)] shadow-[0_0_28px_color-mix(in_oklab,#f59e0b_14%,transparent)]"
    >
      <div className="flex flex-col gap-3 border-b border-amber-500/25 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          <Gavel className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
          <div>
            <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
              Oracle / Admin Panel
            </p>
            <p className="mt-1 text-sm text-foreground">
              You created this market. Resolving is final — winners can claim
              payouts afterward.
            </p>
          </div>
        </div>
        <MarketEndCountdown endTimestamp={endTimestamp} isResolved={false} />
      </div>

      {!ended && (
        <p
          data-testid="resolve-waiting"
          className="border-b border-amber-500/25 px-4 py-2 text-center text-xs font-semibold text-amber-800 dark:text-amber-200 sm:px-5"
        >
          Resolve buttons unlock when the countdown hits zero.
        </p>
      )}

      <div className="border-b border-amber-500/25 px-4 py-4 sm:px-5">
        <button
          type="button"
          data-testid="ai-oracle-resolve"
          disabled={oracleLoading || busy}
          onClick={() => void runAiOracle()}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 text-sm font-extrabold text-white shadow-[0_0_28px_rgba(34,211,238,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {oracleLoading ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <Bot className="size-4" aria-hidden />
          )}
          {oracleLoading
            ? "Consulting AI Oracle…"
            : "🤖 Auto-Resolve with AI Oracle"}
        </button>

        {oracleResult ? (
          <div
            data-testid="ai-oracle-callout"
            className="mt-3 rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-3 py-3 text-sm text-foreground"
          >
            <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">
              Verdict: {oracleResult.verdict}
            </p>
            <p className="mt-1.5 leading-relaxed text-[var(--accent)]">
              {oracleResult.reasoning}
            </p>
            {oracleResult.sources.length > 0 ? (
              <ul className="mt-2 space-y-1 border-t border-cyan-500/25 pt-2">
                {oracleResult.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-800 hover:underline dark:text-cyan-200"
                    >
                      {source.title}
                      <ExternalLink className="size-3" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            {(recommendYes || recommendNo) && (
              <p className="mt-2 text-xs font-semibold text-amber-800 dark:text-amber-200">
                Review the highlighted Resolve {oracleResult.verdict} button,
                then sign in your wallet — the AI never auto-signs.
              </p>
            )}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5">
        <button
          ref={resolveYesRef}
          type="button"
          data-testid="resolve-yes"
          data-oracle-recommended={recommendYes ? "true" : "false"}
          disabled={!canResolve}
          onClick={() => void resolve(OUTCOME_YES)}
          className={[
            "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--success)] px-4 text-sm font-extrabold text-white shadow-[0_0_18px_color-mix(in_oklab,var(--success)_40%,transparent)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60",
            recommendYes
              ? "ring-4 ring-cyan-400 ring-offset-2 ring-offset-[var(--secondary)] outline-none"
              : "",
          ].join(" ")}
        >
          {busy && pendingOutcome === OUTCOME_YES && isConfirming ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : null}
          {buttonLabel(OUTCOME_YES, "YES")}
        </button>
        <button
          ref={resolveNoRef}
          type="button"
          data-testid="resolve-no"
          data-oracle-recommended={recommendNo ? "true" : "false"}
          disabled={!canResolve}
          onClick={() => void resolve(OUTCOME_NO)}
          className={[
            "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--danger)] px-4 text-sm font-extrabold text-white shadow-[0_0_18px_color-mix(in_oklab,var(--danger)_40%,transparent)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60",
            recommendNo
              ? "ring-4 ring-cyan-400 ring-offset-2 ring-offset-[var(--secondary)] outline-none"
              : "",
          ].join(" ")}
        >
          {busy && pendingOutcome === OUTCOME_NO && isConfirming ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : null}
          {buttonLabel(OUTCOME_NO, "NO")}
        </button>
      </div>

      {isSuccess && hash && (
        <div
          role="status"
          data-testid="resolve-success"
          className="border-t border-amber-500/25 px-4 py-3 text-center sm:px-5"
        >
          <a
            href={`${ARBISCAN_TX}/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-amber-800 hover:underline dark:text-amber-200"
          >
            Market resolved · {shortTxHash(hash)}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      )}

      {errorMessage && !isSuccess && (
        <p
          role="alert"
          data-testid="resolve-error"
          className="border-t border-amber-500/25 px-4 py-3 text-center text-sm font-semibold text-[var(--danger)] sm:px-5"
        >
          {errorMessage}
        </p>
      )}
    </section>
  );
}
