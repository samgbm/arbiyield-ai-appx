"use client";

import {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ExternalLink, Info, LoaderCircle, Shield } from "lucide-react";
import { parseEther } from "viem";
import { toast } from "sonner";
import {
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useDemoStore } from "@/store/useDemoStore";
import { estimateArbitrumSepoliaFees } from "@/lib/gas";
import { PMM_CONTRACT_ADDRESS, pmmABI } from "@/lib/pmmContract";
import { parseRPCError } from "@/utils/rpcErrorHandler";

export type TradeSide = "Yes" | "No";

/** Mock Minimum Return Floor multiplier (PMM anti-dilution guarantee preview). */
export const MIN_RETURN_FLOOR_MULTIPLIER = 1.8;

/** Matches MeleePMM: 0 = No, 1 = Yes. */
export const OUTCOME_NO = 0;
export const OUTCOME_YES = 1;

const ARBITRUM_SEPOLIA_CHAIN_ID = 421_614;
const ARBISCAN_TX = "https://sepolia.arbiscan.io/tx";

export function calculateMinReturnFloor(betAmountEth: number): number {
  if (!Number.isFinite(betAmountEth) || betAmountEth <= 0) return 0;
  return betAmountEth * MIN_RETURN_FLOOR_MULTIPLIER;
}

export function sideToOutcomeId(side: TradeSide): number {
  return side === "Yes" ? OUTCOME_YES : OUTCOME_NO;
}

function shortTxHash(hash: `0x${string}`) {
  return `${hash.slice(0, 10)}…${hash.slice(-4)}`;
}

type TradePanelProps = {
  /** On-chain market id (string/number). Required for live Stylus trades. */
  marketId?: string | number;
  marketTitle?: string;
  /** When true, hide buy controls and show a resolved message. */
  isResolved?: boolean;
  winningOutcome?: number;
  /** Demo / test hook — still invoked after a successful live trade. */
  onSubmit?: (payload: { side: TradeSide; amount: number }) => void;
  /** Called after a confirmed on-chain buy so the parent can refetch pools. */
  onTradeSuccess?: (txHash: `0x${string}`) => void;
};

/**
 * Trade entry panel — bet amount + Yes/No side selection.
 * Live mode sends payable `buyShares` to MeleePMM on Arbitrum Sepolia.
 */
export function TradePanel({
  marketId,
  marketTitle,
  isResolved = false,
  winningOutcome,
  onSubmit,
  onTradeSuccess,
}: TradePanelProps) {
  const tipId = useId();
  const isDemoMode = useDemoStore((s) => s.isDemoMode);
  const [amount, setAmount] = useState("");
  const [side, setSide] = useState<TradeSide>("Yes");
  const [tipOpen, setTipOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const notifiedHash = useRef<`0x${string}` | null>(null);

  const publicClient = usePublicClient({ chainId: ARBITRUM_SEPOLIA_CHAIN_ID });

  const {
    writeContractAsync,
    data: hash,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract({
    mutation: {
      onError(error) {
        const message = parseRPCError(error);
        setLocalError(message);
        toast.error(message);
      },
    },
  });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (!isSuccess || !hash || notifiedHash.current === hash) return;
    notifiedHash.current = hash;
    setAmount("");
    toast.success("Transaction confirmed!");
    onTradeSuccess?.(hash);
  }, [isSuccess, hash, onTradeSuccess]);

  const parsedAmount = useMemo(() => {
    const value = Number.parseFloat(amount);
    return Number.isFinite(value) ? value : 0;
  }, [amount]);

  const minFloor = calculateMinReturnFloor(parsedAmount);
  const deferredFloor = useDeferredValue(minFloor);
  const deferredStake = useDeferredValue(parsedAmount);
  const showFloor = parsedAmount > 0;
  const busy = isPending || isConfirming;
  const canTrade = parsedAmount > 0 && !busy;

  const errorMessage =
    localError ?? (writeError ? parseRPCError(writeError) : null);

  async function placeOnChainTrade() {
    if (marketId === undefined || marketId === "") {
      setLocalError("Missing market id for on-chain trade.");
      return;
    }

    const id = BigInt(String(marketId));
    const outcomeId = sideToOutcomeId(side);
    let value: bigint;
    try {
      value = parseEther(amount);
    } catch {
      setLocalError("Invalid ETH amount.");
      return;
    }

    if (value <= BigInt(0)) {
      setLocalError("Bet amount must be greater than zero.");
      return;
    }

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
        functionName: "buyShares",
        args: [id, outcomeId],
        value,
        chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
        ...(maxFeePerGas != null
          ? { maxFeePerGas, maxPriorityFeePerGas }
          : {}),
      });
    } catch (error) {
      // mutation.onError already toasts; keep a local fallback message.
      setLocalError(parseRPCError(error));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (parsedAmount <= 0 || busy) return;

    setLocalError(null);
    onSubmit?.({ side, amount: parsedAmount });

    if (isDemoMode) {
      setAmount("");
      return;
    }

    reset();
    notifiedHash.current = null;
    await placeOnChainTrade();
  }

  if (isResolved) {
    const winnerLabel =
      winningOutcome === OUTCOME_YES
        ? "YES"
        : winningOutcome === OUTCOME_NO
          ? "NO"
          : null;
    return (
      <div
        data-testid="trade-panel-resolved"
        className="surface relative flex flex-col gap-3 overflow-hidden p-4 sm:p-5"
        aria-label="Trade panel resolved"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_10%,transparent),transparent)]"
        />
        <p className="relative font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Place trade
        </p>
        <p className="relative text-lg font-extrabold tracking-tight text-foreground">
          Market Resolved
        </p>
        <p className="relative text-sm text-[var(--accent)]">
          Trading is closed
          {winnerLabel ? (
            <>
              {" "}
              · Winning outcome:{" "}
              <span className="font-bold text-foreground">{winnerLabel}</span>
            </>
          ) : null}
          . Claim from Your Positions if you held the winning side.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="surface flex flex-col gap-5 p-4 sm:p-5"
      aria-label="Trade panel"
    >
      <div>
        <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Place trade
        </p>
        {marketTitle && (
          <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">
            {marketTitle}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="bet-amount"
          className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]"
        >
          Bet Amount (ETH)
        </label>
        <input
          id="bet-amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="0.05"
          value={amount}
          disabled={busy}
          onChange={(e) => setAmount(e.target.value)}
          className="min-h-12 w-full rounded-xl border border-border bg-background px-3.5 text-base font-semibold text-foreground outline-none ring-primary/40 placeholder:text-[var(--muted)] focus:ring-2 disabled:opacity-60"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-pressed={side === "Yes"}
          disabled={busy}
          onClick={() => setSide("Yes")}
          className={`min-h-14 rounded-xl text-base font-extrabold transition disabled:opacity-60 ${
            side === "Yes"
              ? "bg-[var(--success)] text-white shadow-[0_0_18px_color-mix(in_oklab,var(--success)_45%,transparent)]"
              : "bg-background text-[var(--success)] ring-1 ring-border hover:ring-[var(--success)]/50"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          aria-pressed={side === "No"}
          disabled={busy}
          onClick={() => setSide("No")}
          className={`min-h-14 rounded-xl text-base font-extrabold transition disabled:opacity-60 ${
            side === "No"
              ? "bg-[var(--danger)] text-white shadow-[0_0_18px_color-mix(in_oklab,var(--danger)_45%,transparent)]"
              : "bg-background text-[var(--danger)] ring-1 ring-border hover:ring-[var(--danger)]/50"
          }`}
        >
          No
        </button>
      </div>

      <div className="rounded-xl border border-border bg-background/70 p-3.5">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-primary" aria-hidden />
          <h3 className="text-sm font-bold text-foreground">
            Expected Payout &amp; Floor
          </h3>
          <button
            type="button"
            className="ml-auto inline-flex size-8 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-secondary hover:text-foreground"
            aria-describedby={tipId}
            aria-expanded={tipOpen}
            onClick={() => setTipOpen((open) => !open)}
            title="About Minimum Return Floor"
          >
            <Info className="size-4" aria-hidden />
            <span className="sr-only">Floor explanation</span>
          </button>
        </div>

        {tipOpen && (
          <p
            id={tipId}
            role="tooltip"
            className="mt-2 rounded-lg bg-secondary px-3 py-2 text-xs leading-relaxed text-[var(--accent)] ring-1 ring-border"
          >
            This floor is mathematically guaranteed by the PMM and cannot be
            diluted by late capital.
          </p>
        )}

        {showFloor ? (
          <div className="mt-3 space-y-1.5" data-testid="floor-preview">
            <p className="text-xs text-[var(--muted)]">
              Side: <span className="font-semibold text-foreground">{side}</span>
            </p>
            <p className="text-xs text-[var(--muted)] transition-all duration-500 ease-in-out">
              Stake:{" "}
              <span
                data-testid="trade-stake"
                className="font-semibold tabular-nums text-foreground transition-all duration-500 ease-in-out"
              >
                {deferredStake.toFixed(4)} ETH
              </span>
            </p>
            <p
              data-testid="trade-min-floor"
              className="text-lg font-bold tracking-tight text-primary tabular-nums transition-all duration-500 ease-in-out"
            >
              Min return floor: {deferredFloor.toFixed(4)} ETH
            </p>
            <p className="text-[11px] text-[var(--muted)]">
              Preview formula: bet × {MIN_RETURN_FLOOR_MULTIPLIER} (exact floor
              locked on-chain at entry)
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Enter a bet amount to preview your Minimum Return Floor.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!canTrade}
        data-testid="place-trade-button"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <>Confirming in Wallet...</>
        ) : isConfirming ? (
          <>
            <LoaderCircle
              className="size-4 animate-spin"
              aria-hidden
              data-testid="trade-spinner"
            />
            Executing on Stylus...
          </>
        ) : (
          <>Buy {side} shares</>
        )}
      </button>

      {isSuccess && hash && (
        <div
          role="status"
          data-testid="trade-success"
          className="rounded-lg bg-emerald-500/12 px-3 py-2 text-center ring-1 ring-emerald-500/35"
        >
          <a
            href={`${ARBISCAN_TX}/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="trade-arbiscan-link"
            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
          >
            Trade confirmed · {shortTxHash(hash)}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      )}

      {errorMessage && !isSuccess && (
        <p
          role="alert"
          data-testid="trade-error"
          className="rounded-lg bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] px-3 py-2 text-center text-sm font-semibold text-[var(--danger)] ring-1 ring-[color-mix(in_oklab,var(--danger)_30%,transparent)]"
        >
          {errorMessage}
        </p>
      )}
    </form>
  );
}
