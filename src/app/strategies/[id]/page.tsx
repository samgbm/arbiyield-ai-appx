"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Gauge,
  ListOrdered,
  LoaderCircle,
  Shield,
  TrendingUp,
  Waves,
} from "lucide-react";
import { useReadContract } from "wagmi";
import { useDemoMode } from "@/components/providers/DemoModeProvider";
import { getDemoStrategy } from "@/data/mockStrategies";
import {
  CONTRACT_ADDRESS,
  strategyExecutorABI,
} from "@/lib/contract";
import { fetchStrategyMetadata } from "@/lib/strategyMetadata";
import type { StrategyMetadataRow } from "@/lib/supabaseClient";
import { arbitrumSepolia } from "@/lib/wagmi";
import { zeroAddress } from "viem";

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
 * Strategy detail — on-chain creator + Supabase metadata / execution steps.
 */
export default function StrategyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = use(params);
  const id = decodeURIComponent(rawId);
  const { isDemoMode } = useDemoMode();
  const [meta, setMeta] = useState<StrategyMetadataRow | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setMetaLoading(true);
    void (async () => {
      try {
        const row = await fetchStrategyMetadata(id);
        if (!cancelled) setMeta(row);
      } catch {
        if (!cancelled) setMeta(null);
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const { data: creator, isLoading: creatorLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: strategyExecutorABI,
    functionName: "getStrategyCreator",
    args: [id],
    chainId: arbitrumSepolia.id,
    query: { enabled: !isDemoMode },
  });

  if (isDemoMode) {
    const strategy = getDemoStrategy(id);
    if (!strategy && !meta) {
      return <NotFound id={id} />;
    }
    return (
      <DetailBody
        id={id}
        protocol={meta?.protocol ?? strategy?.protocol ?? "Demo"}
        name={meta?.name ?? strategy?.name ?? id}
        description={
          meta?.narrative ?? meta?.description ?? strategy?.description ?? ""
        }
        risk={meta?.risk_level ?? strategy?.riskLevel ?? "medium"}
        apy={Number(meta?.apy_pct ?? strategy?.apy ?? 0)}
        tvl={Number(meta?.tvl_usd ?? strategy?.tvl ?? 0)}
        sharpe={Number(meta?.sharpe ?? strategy?.kpis.sharpe ?? 0)}
        utilization={Number(
          meta?.utilization_pct ?? strategy?.kpis.utilization ?? 0,
        )}
        health={Number(meta?.health_factor ?? strategy?.kpis.healthFactor ?? 0)}
        weekly={Number(meta?.weekly_pnl_pct ?? strategy?.kpis.weeklyPnlPct ?? 0)}
        steps={meta?.execution_steps ?? strategy?.steps ?? []}
        creator={meta?.creator_address ?? "demo"}
        createTx={meta?.create_tx_hash}
        badge={meta ? "Supabase + Demo" : "Demo"}
      />
    );
  }

  if (creatorLoading || metaLoading) {
    return (
      <div className="hero-wash">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 px-4 py-24">
          <LoaderCircle className="size-8 animate-spin text-primary" />
          <p className="font-semibold">Loading strategy from Stylus + Supabase…</p>
        </div>
      </div>
    );
  }

  const onChain =
    creator != null && creator !== zeroAddress;

  if (!onChain && !meta) {
    return <NotFound id={id} />;
  }

  return (
    <DetailBody
      id={id}
      protocol={meta?.protocol ?? "On-chain strategy"}
      name={meta?.name ?? id}
      description={
        meta?.narrative ??
        meta?.description ??
        "Strategy registered on Stylus. Enrich this id in Supabase for full copy and execution steps."
      }
      risk={meta?.risk_level ?? "medium"}
      apy={Number(meta?.apy_pct ?? 0)}
      tvl={Number(meta?.tvl_usd ?? 0)}
      sharpe={Number(meta?.sharpe ?? 0)}
      utilization={Number(meta?.utilization_pct ?? 0)}
      health={Number(meta?.health_factor ?? 0)}
      weekly={Number(meta?.weekly_pnl_pct ?? 0)}
      steps={meta?.execution_steps ?? []}
      creator={(creator as `0x${string}`) ?? meta?.creator_address ?? zeroAddress}
      createTx={meta?.create_tx_hash}
      badge={onChain ? "Verified on Arbitrum" : "Supabase only"}
    />
  );
}

function DetailBody({
  id,
  protocol,
  name,
  description,
  risk,
  apy,
  tvl,
  sharpe,
  utilization,
  health,
  weekly,
  steps,
  creator,
  createTx,
  badge,
}: {
  id: string;
  protocol: string;
  name: string;
  description: string;
  risk: string;
  apy: number;
  tvl: number;
  sharpe: number;
  utilization: number;
  health: number;
  weekly: number;
  steps: string[];
  creator: string;
  createTx?: string | null;
  badge: string;
}) {
  return (
    <div className="hero-wash">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <BackLink />
        <header className="mt-4 space-y-3">
          <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            {protocol} · {badge}
          </p>
          <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            {name}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--accent)] sm:text-base">
            {description}
          </p>
        </header>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            State Info
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Current Yield"
              value={`${apy.toFixed(2)}% APY`}
              hint="From Supabase metadata"
              icon={TrendingUp}
            />
            <KpiCard
              label="TVL"
              value={formatUsd(tvl)}
              hint="Aggregated sleeve liquidity"
              icon={Waves}
            />
            <KpiCard
              label="Metrics"
              value={`Sharpe ${sharpe.toFixed(1)}`}
              hint={`Utilization ${utilization}%`}
              icon={Gauge}
            />
            <KpiCard
              label="KPIs"
              value={`HF ${health.toFixed(2)}`}
              hint={`Weekly PnL ${weekly.toFixed(2)}%`}
              icon={Shield}
            />
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-secondary/60 p-5 lg:col-span-2">
            <h3 className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
              <ListOrdered className="size-4 text-primary" aria-hidden />
              Execution steps
            </h3>
            {steps.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--muted)]">
                No execution steps stored for this id yet.
              </p>
            ) : (
              <ol className="mt-3 space-y-2">
                {steps.map((step, i) => (
                  <li
                    key={`${i}-${step.slice(0, 12)}`}
                    className="flex gap-3 rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-sm text-foreground"
                  >
                    <span className="font-mono text-xs font-bold text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-4 text-sm leading-relaxed text-[var(--accent)]">
              Risk band <strong className="text-foreground">{risk}</strong>.
            </p>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-secondary/60 p-5">
              <h3 className="text-sm font-bold text-foreground">On-chain</h3>
              <p className="mt-2 break-all font-mono text-xs text-[var(--accent)]">
                id · {id}
              </p>
              <p className="mt-2 break-all font-mono text-xs text-[var(--accent)]">
                creator · {creator}
              </p>
              {createTx ? (
                <a
                  href={`https://sepolia.arbiscan.io/tx/${createTx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline dark:text-sky-300"
                >
                  Create tx on Arbiscan
                  <ExternalLink className="size-3" aria-hidden />
                </a>
              ) : null}
            </div>
            <a
              href={`https://sepolia.arbiscan.io/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full min-h-11 items-center justify-center gap-1 rounded-xl border border-border px-3 text-sm font-bold"
            >
              StrategyExecutor
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
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
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden />
      All strategies
    </Link>
  );
}

function NotFound({ id }: { id: string }) {
  return (
    <div className="hero-wash">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <BackLink />
        <p className="mt-6 text-lg font-semibold text-foreground">
          No strategy matches <code className="font-mono">{id}</code>.
        </p>
      </div>
    </div>
  );
}
