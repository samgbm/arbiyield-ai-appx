"use client";

import { Activity, LoaderCircle, Wallet } from "lucide-react";
import { useStrategyState } from "@/hooks/useStrategyState";

function formatCount(value: bigint | undefined, loading: boolean): string {
  if (loading && value === undefined) return "…";
  if (value === undefined) return "—";
  return value.toLocaleString();
}

export function StrategyStats() {
  const {
    totalExecuted,
    userStrategyCount,
    isConnected,
    isLoadingTotal,
    isLoadingUser,
  } = useStrategyState();

  return (
    <section
      aria-label="On-chain strategy stats"
      className="surface overflow-hidden"
    >
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          Stylus · Arbitrum Sepolia
        </p>
        <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Live strategy ledger
        </h2>
      </div>

      <div className="grid gap-px bg-border sm:grid-cols-2">
        <article className="bg-secondary px-5 py-6 sm:px-6">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Activity className="size-4 text-primary" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.12em]">
              Global Strategies Executed
            </p>
          </div>
          <p className="mt-3 font-display text-4xl tracking-tight text-foreground sm:text-5xl">
            {isLoadingTotal && totalExecuted === undefined ? (
              <span className="inline-flex items-center gap-2 text-2xl text-[var(--muted)]">
                <LoaderCircle className="size-6 animate-spin" aria-hidden />
                Loading
              </span>
            ) : (
              formatCount(totalExecuted, isLoadingTotal)
            )}
          </p>
          <p className="mt-2 text-sm text-[var(--accent)]">
            Total AI strategies recorded on-chain
          </p>
        </article>

        <article className="bg-secondary px-5 py-6 sm:px-6">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Wallet className="size-4 text-primary" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.12em]">
              Your Executed Strategies
            </p>
          </div>

          {!isConnected ? (
            <div className="mt-3">
              <p className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">
                —
              </p>
              <p className="mt-2 text-sm text-[var(--accent)]">
                Connect wallet to view your stats.
              </p>
            </div>
          ) : (
            <>
              <p className="mt-3 font-display text-4xl tracking-tight text-foreground sm:text-5xl">
                {isLoadingUser && userStrategyCount === undefined ? (
                  <span className="inline-flex items-center gap-2 text-2xl text-[var(--muted)]">
                    <LoaderCircle className="size-6 animate-spin" aria-hidden />
                    Loading
                  </span>
                ) : (
                  formatCount(userStrategyCount, isLoadingUser)
                )}
              </p>
              <p className="mt-2 text-sm text-[var(--accent)]">
                Strategies you have signed &amp; executed
              </p>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
