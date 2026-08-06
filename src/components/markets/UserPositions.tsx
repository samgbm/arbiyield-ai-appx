"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Banknote, ExternalLink, LoaderCircle, Wallet } from "lucide-react";
import { formatEther } from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { estimateArbitrumSepoliaFees } from "@/lib/gas";
import { PMM_CONTRACT_ADDRESS, pmmABI } from "@/lib/pmmContract";
import { useDemoStore } from "@/store/useDemoStore";
import { OUTCOME_NO, OUTCOME_YES } from "@/components/markets/TradePanel";

const ARBITRUM_SEPOLIA_CHAIN_ID = 421_614;
const ARBISCAN_TX = "https://sepolia.arbiscan.io/tx";

type OutcomeLabel = "Yes" | "No";

type PositionView = {
  outcomeId: number;
  outcome: OutcomeLabel;
  shares: bigint;
  floor: bigint;
  claimed: boolean;
};

function shortTxHash(hash: `0x${string}`) {
  return `${hash.slice(0, 10)}…${hash.slice(-4)}`;
}

function formatEth(value: bigint) {
  const n = Number(formatEther(value));
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

type UserPositionsProps = {
  marketId: string | number;
  /** Refetch market pools after a cashout settles. */
  onCashoutSuccess?: () => void;
};

/**
 * Shows the connected wallet's Yes/No positions for a market and allows
 * pre-resolution `cashoutShares` redemptions.
 */
export function UserPositions({
  marketId,
  onCashoutSuccess,
}: UserPositionsProps) {
  const isDemoMode = useDemoStore((s) => s.isDemoMode);
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: ARBITRUM_SEPOLIA_CHAIN_ID });
  const notifiedHash = useRef<`0x${string}` | null>(null);
  const [cashoutOutcomeId, setCashoutOutcomeId] = useState<number | null>(null);

  const marketIdBig = useMemo(() => {
    try {
      return BigInt(String(marketId));
    } catch {
      return null;
    }
  }, [marketId]);

  const positionContracts = useMemo(() => {
    if (!address || marketIdBig == null) return [];
    return [OUTCOME_NO, OUTCOME_YES].map((outcomeId) => ({
      address: PMM_CONTRACT_ADDRESS,
      abi: pmmABI,
      functionName: "getPosition" as const,
      args: [marketIdBig, address, outcomeId] as const,
      chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
    }));
  }, [address, marketIdBig]);

  const {
    data: positionResults,
    isLoading: isPositionsLoading,
    refetch: refetchPositions,
  } = useReadContracts({
    contracts: positionContracts,
    query: {
      enabled: !isDemoMode && Boolean(address) && marketIdBig != null,
    },
  });

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (!isSuccess || !hash || notifiedHash.current === hash) return;
    notifiedHash.current = hash;
    void refetchPositions();
    onCashoutSuccess?.();
  }, [isSuccess, hash, refetchPositions, onCashoutSuccess]);

  const livePositions: PositionView[] = useMemo(() => {
    if (!positionResults?.length) return [];
    const labels: OutcomeLabel[] = ["No", "Yes"];
    const ids = [OUTCOME_NO, OUTCOME_YES];
    const rows: PositionView[] = [];

    for (let i = 0; i < positionResults.length; i++) {
      const result = positionResults[i];
      if (result.status !== "success" || result.result == null) continue;
      const [shares, , floor, claimed] = result.result;
      if (shares <= BigInt(0)) continue;
      rows.push({
        outcomeId: ids[i]!,
        outcome: labels[i]!,
        shares,
        floor,
        claimed,
      });
    }
    return rows;
  }, [positionResults]);

  const demoPositions: PositionView[] = useMemo(
    () => [
      {
        outcomeId: OUTCOME_YES,
        outcome: "Yes",
        shares: BigInt("50000000000000000"), // 0.05 ETH
        floor: BigInt("90000000000000000"), // 0.09 ETH preview
        claimed: false,
      },
    ],
    [],
  );

  const positions = isDemoMode ? demoPositions : livePositions;
  const busy = isPending || isConfirming;

  async function handleCashout(outcomeId: number) {
    if (isDemoMode) {
      // Demo: pretend success by no-op write; UI already shows mock data.
      return;
    }
    if (marketIdBig == null) return;

    reset();
    notifiedHash.current = null;
    setCashoutOutcomeId(outcomeId);

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

    writeContract({
      address: PMM_CONTRACT_ADDRESS,
      abi: pmmABI,
      functionName: "cashoutShares",
      args: [marketIdBig, outcomeId],
      chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
      ...(maxFeePerGas != null
        ? { maxFeePerGas, maxPriorityFeePerGas }
        : {}),
    });
  }

  if (!isDemoMode && !isConnected) {
    return (
      <div
        data-testid="user-positions-connect"
        className="surface mt-4 flex flex-col gap-2 p-4 sm:p-5"
      >
        <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Your Positions
        </p>
        <p className="inline-flex items-center gap-2 text-sm text-[var(--accent)]">
          <Wallet className="size-4 shrink-0 text-primary" aria-hidden />
          Connect a wallet to view active bets.
        </p>
      </div>
    );
  }

  if (!isDemoMode && isPositionsLoading) {
    return (
      <div
        data-testid="user-positions-loading"
        className="surface mt-4 flex items-center gap-2 p-4 text-sm text-[var(--muted)] sm:p-5"
      >
        <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden />
        Loading positions…
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div
        data-testid="user-positions-empty"
        className="surface mt-4 flex flex-col gap-2 p-4 sm:p-5"
      >
        <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Your Positions
        </p>
        <p className="text-sm text-[var(--accent)]">
          No active shares on this market yet. Place a trade to lock a Minimum
          Return Floor.
        </p>
      </div>
    );
  }

  const errorMessage = writeError
    ? (writeError.message.split("\n")[0] ?? "Cashout failed")
    : null;

  return (
    <div
      data-testid="user-positions"
      className="surface mt-4 flex flex-col gap-4 p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Your Positions
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {isDemoMode ? "Demo holdings" : "Active on-chain bets"}
          </p>
        </div>
        <Banknote className="size-5 text-primary" aria-hidden />
      </div>

      <ul className="space-y-3">
        {positions.map((pos) => {
          const isThisBusy = busy && cashoutOutcomeId === pos.outcomeId;
          return (
            <li
              key={pos.outcomeId}
              data-testid={`position-row-${pos.outcome}`}
              className="rounded-xl border border-border bg-background/70 p-3.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`inline-flex rounded-md px-2.5 py-1 text-xs font-extrabold ${
                    pos.outcome === "Yes"
                      ? "bg-[var(--success)]/15 text-[var(--success)]"
                      : "bg-[var(--danger)]/15 text-[var(--danger)]"
                  }`}
                >
                  {pos.outcome}
                </span>
                {pos.claimed && (
                  <span className="text-[11px] font-semibold text-[var(--muted)]">
                    Claimed
                  </span>
                )}
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    Shares Owned
                  </dt>
                  <dd
                    className="mt-0.5 font-bold text-foreground"
                    data-testid="shares-owned"
                  >
                    {formatEth(pos.shares)} ETH
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    Min Return Floor
                  </dt>
                  <dd
                    className="mt-0.5 font-bold text-primary"
                    data-testid="min-return-floor"
                  >
                    {formatEth(pos.floor)} ETH
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                data-testid={`cashout-${pos.outcome}`}
                disabled={busy || pos.claimed || isDemoMode}
                onClick={() => void handleCashout(pos.outcomeId)}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-secondary px-3 text-sm font-bold text-foreground ring-1 ring-border transition hover:border-primary/40 hover:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                title={
                  isDemoMode
                    ? "Cashout is available in live mode"
                    : "Redeem shares for ETH before resolution"
                }
              >
                {isThisBusy && isPending ? (
                  <>Confirming in Wallet...</>
                ) : isThisBusy && isConfirming ? (
                  <>
                    <LoaderCircle
                      className="size-4 animate-spin"
                      aria-hidden
                      data-testid="cashout-spinner"
                    />
                    Executing on Arbitrum...
                  </>
                ) : (
                  <>Instant Cashout</>
                )}
              </button>
              {isDemoMode && (
                <p className="mt-2 text-center text-[11px] text-[var(--muted)]">
                  Demo Mode — switch off to cash out on Stylus.
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {isSuccess && hash && (
        <div
          role="status"
          data-testid="cashout-success"
          className="rounded-lg bg-emerald-500/12 px-3 py-2 text-center ring-1 ring-emerald-500/35"
        >
          <a
            href={`${ARBISCAN_TX}/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
          >
            Cashout confirmed · {shortTxHash(hash)}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      )}

      {errorMessage && !isSuccess && (
        <p
          role="alert"
          data-testid="cashout-error"
          className="rounded-lg bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] px-3 py-2 text-center text-sm font-semibold text-[var(--danger)]"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
