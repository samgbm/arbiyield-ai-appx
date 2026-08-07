"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  LoaderCircle,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useAccount, useReadContract } from "wagmi";
import { useDemoMode } from "@/components/providers/DemoModeProvider";
import { DEMO_STRATEGIES } from "@/data/mockStrategies";
import {
  CONTRACT_ADDRESS,
  parseStrategiesByOwner,
  strategyExecutorABI,
} from "@/lib/contract";
import { arbitrumSepolia } from "@/lib/wagmi";

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: n >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: n >= 1_000_000 ? 1 : 0,
  }).format(n);
}

function formatApyBps(apy: bigint) {
  // On-chain APY stored as basis points (520 → 5.20%).
  return `${(Number(apy) / 100).toFixed(2)}%`;
}

function riskTone(risk: "low" | "medium" | "high") {
  if (risk === "low") return "text-emerald-700 bg-emerald-500/12 ring-emerald-500/30";
  if (risk === "high") return "text-rose-700 bg-rose-500/12 ring-rose-500/30";
  return "text-amber-800 bg-amber-500/12 ring-amber-500/30";
}

/**
 * Strategies Hub — live Stylus reads when Demo Mode is off;
 * polished mock cards only when Demo Mode is on.
 */
export default function StrategiesHubPage() {
  const { isDemoMode } = useDemoMode();
  const { address, isConnected } = useAccount();

  const { data, isLoading, isFetching, isError, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: strategyExecutorABI,
    functionName: "getStrategiesByOwner",
    args: address ? [address] : undefined,
    chainId: arbitrumSepolia.id,
    query: {
      enabled: !isDemoMode && Boolean(address),
    },
  });

  const liveStrategies = parseStrategiesByOwner(data);

  return (
    <div className="hero-wash">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-8 space-y-3">
          <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Stylus · Yield Strategies
          </p>
          <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            Yield Strategies
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--accent)] sm:text-base">
            Browse on-chain strategies owned by your wallet on Arbitrum Sepolia.
            Demo Mode swaps in a polished pitch deck of sample sleeves.
          </p>
        </header>

        {isDemoMode ? (
          <div
            data-testid="strategies-demo-grid"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {DEMO_STRATEGIES.map((strategy) => (
              <Link
                key={strategy.id}
                href={`/strategies/${strategy.id}`}
                className="group relative overflow-hidden rounded-2xl border border-border bg-secondary/80 p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_0_28px_color-mix(in_oklab,var(--primary)_18%,transparent)]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-cyan-400 to-emerald-400 opacity-80" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      {strategy.protocol}
                    </p>
                    <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">
                      {strategy.name}
                    </h2>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${riskTone(strategy.riskLevel)}`}
                  >
                    {strategy.riskLevel}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--accent)]">
                  {strategy.description}
                </p>
                <dl className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-background/60 px-3 py-2.5">
                    <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      <TrendingUp className="size-3" aria-hidden />
                      APY
                    </dt>
                    <dd className="mt-0.5 text-xl font-extrabold tabular-nums text-foreground">
                      {strategy.apy.toFixed(1)}%
                    </dd>
                  </div>
                  <div className="rounded-xl bg-background/60 px-3 py-2.5">
                    <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      <Activity className="size-3" aria-hidden />
                      TVL
                    </dt>
                    <dd className="mt-0.5 text-xl font-extrabold tabular-nums text-foreground">
                      {formatUsd(strategy.tvl)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Open dashboard
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </p>
              </Link>
            ))}
          </div>
        ) : !isConnected ? (
          <div
            data-testid="strategies-connect"
            className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-secondary/40 px-6 text-center"
          >
            <Wallet className="size-8 text-primary" aria-hidden />
            <p className="text-base font-semibold text-foreground">
              Connect a wallet to load your strategies
            </p>
            <p className="max-w-md text-sm text-[var(--accent)]">
              Live mode reads <code className="font-mono text-xs">getStrategiesByOwner</code>{" "}
              from the Stylus StrategyExecutor — no mock data is injected.
            </p>
          </div>
        ) : isLoading || isFetching ? (
          <div
            data-testid="strategies-loading"
            className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center"
          >
            <LoaderCircle
              className="size-8 animate-spin text-primary"
              aria-hidden
            />
            <p className="text-base font-semibold text-foreground">
              Connecting to Arbitrum…
            </p>
            <p className="text-sm text-[var(--accent)]">
              Fetching on-chain yield strategies for your wallet.
            </p>
          </div>
        ) : isError ? (
          <div
            data-testid="strategies-error"
            className="rounded-2xl border border-rose-500/35 bg-rose-500/10 px-5 py-6 text-sm text-rose-800 dark:text-rose-200"
          >
            <p className="font-semibold">Could not read StrategyExecutor</p>
            <p className="mt-1 opacity-90">
              {error?.message ??
                "Contract may need redeploy after the YieldStrategy upgrade."}
            </p>
          </div>
        ) : liveStrategies.length === 0 ? (
          <div
            data-testid="strategies-empty"
            className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-secondary/50 px-6 text-center"
          >
            <p className="text-base font-semibold text-foreground">
              No on-chain strategies yet
            </p>
            <p className="max-w-md text-sm text-[var(--accent)]">
              Generate a strategy from the Yield Dashboard and execute it on Stylus
              to populate this hub.
            </p>
            <Link
              href="/"
              className="mt-2 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
            >
              Open Yield Dashboard
            </Link>
          </div>
        ) : (
          <div
            data-testid="strategies-live-grid"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {liveStrategies.map((strategy) => (
              <Link
                key={`${strategy.id}-${strategy.owner}`}
                href={`/strategies/${encodeURIComponent(strategy.id)}`}
                className="group relative overflow-hidden rounded-2xl border border-border bg-secondary/80 p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-primary/40"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-cyan-400" />
                <p className="font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  On-chain · {strategy.id}
                </p>
                <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">
                  {strategy.name}
                </h2>
                <dl className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-background/60 px-3 py-2.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      APY
                    </dt>
                    <dd className="mt-0.5 text-xl font-extrabold tabular-nums">
                      {formatApyBps(strategy.apy)}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-background/60 px-3 py-2.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      TVL
                    </dt>
                    <dd className="mt-0.5 text-xl font-extrabold tabular-nums">
                      {formatUsd(Number(strategy.tvl))}
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Open dashboard
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
