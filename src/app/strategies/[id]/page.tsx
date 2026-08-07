"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Gauge,
  LoaderCircle,
  Shield,
  TrendingUp,
  Waves,
} from "lucide-react";
import { useAccount, useReadContract } from "wagmi";
import { useDemoMode } from "@/components/providers/DemoModeProvider";
import { getDemoStrategy } from "@/data/mockStrategies";
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

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Gauge;
}) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/70 p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        <Icon className="size-3.5 text-primary" aria-hidden />
        {label}
      </div>
      <p className="mt-2 text-2xl font-extrabold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--accent)]">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Strategy detail dashboard — Demo Mode uses polished mocks;
 * live mode resolves the strategy from `getStrategiesByOwner`.
 */
export default function StrategyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = use(params);
  const id = decodeURIComponent(rawId);
  const { isDemoMode } = useDemoMode();
  const { address, isConnected } = useAccount();

  const { data, isLoading, isFetching, isError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: strategyExecutorABI,
    functionName: "getStrategiesByOwner",
    args: address ? [address] : undefined,
    chainId: arbitrumSepolia.id,
    query: {
      enabled: !isDemoMode && Boolean(address),
    },
  });

  if (isDemoMode) {
    const strategy = getDemoStrategy(id);
    if (!strategy) {
      return (
        <NotFound id={id} />
      );
    }

    return (
      <div className="hero-wash">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <BackLink />
          <header className="mt-4 space-y-3">
            <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              {strategy.protocol} · Demo
            </p>
            <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
              {strategy.name}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--accent)] sm:text-base">
              {strategy.description}
            </p>
          </header>

          <section className="mt-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
              State Info
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Current Yield"
                value={`${strategy.apy.toFixed(2)}% APY`}
                hint="Net of protocol fees (demo)"
                icon={TrendingUp}
              />
              <KpiCard
                label="TVL"
                value={formatUsd(strategy.tvl)}
                hint="Aggregated sleeve liquidity"
                icon={Waves}
              />
              <KpiCard
                label="Metrics"
                value={`Sharpe ${strategy.kpis.sharpe.toFixed(1)}`}
                hint={`Utilization ${strategy.kpis.utilization}%`}
                icon={Gauge}
              />
              <KpiCard
                label="KPIs"
                value={`HF ${strategy.kpis.healthFactor.toFixed(2)}`}
                hint={`Weekly PnL ${strategy.kpis.weeklyPnlPct.toFixed(2)}%`}
                icon={Shield}
              />
            </div>
          </section>

          <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-secondary/60 p-5 lg:col-span-2">
              <h3 className="text-sm font-bold text-foreground">Risk posture</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--accent)]">
                Risk band <strong className="text-foreground">{strategy.riskLevel}</strong>.
                Health factor and utilization are monitored continuously; the sleeve
                pauses new loops if HF falls below the configured floor.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/60 p-5">
              <h3 className="text-sm font-bold text-foreground">Strategy ID</h3>
              <p className="mt-2 break-all font-mono text-xs text-[var(--accent)]">
                {strategy.id}
              </p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="hero-wash">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-16">
          <BackLink />
          <h1 className="font-display text-3xl text-foreground">
            Connect wallet
          </h1>
          <p className="text-sm text-[var(--accent)]">
            Live strategy details are loaded from Stylus for the connected owner.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className="hero-wash">
        <div
          data-testid="strategy-detail-loading"
          className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center gap-3 px-4 py-20 text-center"
        >
          <LoaderCircle className="size-8 animate-spin text-primary" aria-hidden />
          <p className="text-sm font-semibold text-foreground">
            Connecting to Arbitrum…
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="hero-wash">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-16">
          <BackLink />
          <h1 className="font-display text-3xl text-foreground">
            Read failed
          </h1>
          <p className="text-sm text-[var(--accent)]">
            Could not load strategies from StrategyExecutor.
          </p>
        </div>
      </div>
    );
  }

  const strategy = parseStrategiesByOwner(data).find((s) => s.id === id);
  if (!strategy) {
    return <NotFound id={id} />;
  }

  const apyPct = (Number(strategy.apy) / 100).toFixed(2);
  const tvlNum = Number(strategy.tvl);

  return (
    <div className="hero-wash">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <BackLink />
        <header className="mt-4 space-y-3">
          <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            On-chain · Arbitrum Sepolia
          </p>
          <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            {strategy.name}
          </h1>
          <p className="max-w-2xl text-sm text-[var(--accent)]">
            Owner{" "}
            <span className="font-mono text-xs text-foreground">
              {strategy.owner}
            </span>
          </p>
        </header>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            State Info
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Current Yield"
              value={`${apyPct}% APY`}
              hint="Stored on-chain as basis points"
              icon={TrendingUp}
            />
            <KpiCard
              label="TVL"
              value={formatUsd(tvlNum)}
              hint="On-chain tvl field"
              icon={Waves}
            />
            <KpiCard
              label="Metrics"
              value={strategy.id}
              hint="Strategy identifier"
              icon={Gauge}
            />
            <KpiCard
              label="KPIs"
              value="Live Stylus"
              hint="Redeemable after redeploy"
              icon={Shield}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/strategies"
      className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--accent)] transition hover:text-primary"
    >
      <ArrowLeft className="size-4" aria-hidden />
      All strategies
    </Link>
  );
}

function NotFound({ id }: { id: string }) {
  return (
    <div className="hero-wash">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-16">
        <BackLink />
        <h1 className="font-display text-3xl text-foreground">
          Strategy not found
        </h1>
        <p className="text-sm text-[var(--accent)]">
          No strategy matches <code className="font-mono">{id}</code>.
        </p>
      </div>
    </div>
  );
}
