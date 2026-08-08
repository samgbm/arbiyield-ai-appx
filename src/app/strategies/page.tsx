"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  LoaderCircle,
  Plus,
  TrendingUp,
} from "lucide-react";
import { useReadContract } from "wagmi";
import { useDemoMode } from "@/components/providers/DemoModeProvider";
import { DEMO_STRATEGIES } from "@/data/mockStrategies";
import {
  CONTRACT_ADDRESS,
  parseStrategiesList,
  strategyExecutorABI,
} from "@/lib/contract";
import { fetchStrategyMetadataMap } from "@/lib/strategyMetadata";
import type { StrategyMetadataRow } from "@/lib/supabaseClient";
import { arbitrumSepolia } from "@/lib/wagmi";

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: n >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: n >= 1_000_000 ? 1 : 0,
  }).format(n);
}

function riskTone(risk: "low" | "medium" | "high") {
  if (risk === "low") return "text-emerald-700 bg-emerald-500/12 ring-emerald-500/30";
  if (risk === "high") return "text-rose-700 bg-rose-500/12 ring-rose-500/30";
  return "text-amber-800 bg-amber-500/12 ring-amber-500/30";
}

/**
 * Strategies Hub — live Stylus registry (id + creator) joined to Supabase by id.
 */
export default function StrategiesHubPage() {
  const { isDemoMode } = useDemoMode();
  const [metaById, setMetaById] = useState<Map<string, StrategyMetadataRow>>(
    new Map(),
  );
  const [metaError, setMetaError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const map = await fetchStrategyMetadataMap();
        if (!cancelled) {
          setMetaById(map);
          setMetaError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setMetaError(
            err instanceof Error ? err.message : "Failed to load strategy metadata",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useReadContract({
      address: CONTRACT_ADDRESS,
      abi: strategyExecutorABI,
      functionName: "getAllStrategies",
      chainId: arbitrumSepolia.id,
      query: {
        enabled: !isDemoMode,
        refetchInterval: 15_000,
      },
    });

  const liveStrategies = useMemo(
    () => parseStrategiesList(data).slice().reverse(),
    [data],
  );

  return (
    <div className="hero-wash">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Stylus · Yield Strategies
            </p>
            <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
              Yield Strategies
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--accent)] sm:text-base">
              Live hub: on-chain <code className="font-mono text-xs">id</code> +
              creator, enriched from Supabase (description, KPIs, execution
              steps) matched by strategy id.
            </p>
            {metaError ? (
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                Metadata offline: {metaError}
              </p>
            ) : metaById.size > 0 ? (
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {metaById.size} Supabase rows ·{" "}
                {isDemoMode ? "Demo Mode" : `${liveStrategies.length} on-chain`}
              </p>
            ) : null}
          </div>
          <Link
            href="/strategies/create"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-extrabold text-primary-foreground"
          >
            <Plus className="size-4" aria-hidden />
            Create strategy
          </Link>
        </header>

        {isDemoMode ? (
          <div
            data-testid="strategies-demo-grid"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {DEMO_STRATEGIES.map((strategy) => {
              const meta = metaById.get(strategy.id);
              return (
                <StrategyCardLink
                  key={strategy.id}
                  href={`/strategies/${strategy.id}`}
                  protocol={meta?.protocol ?? strategy.protocol}
                  name={meta?.name ?? strategy.name}
                  description={meta?.description ?? strategy.description}
                  riskLevel={meta?.risk_level ?? strategy.riskLevel}
                  apyLabel={`${Number(meta?.apy_pct ?? strategy.apy).toFixed(1)}%`}
                  tvlLabel={formatUsd(Number(meta?.tvl_usd ?? strategy.tvl))}
                  idBadge={strategy.id}
                  creator={meta?.creator_address ?? "demo"}
                />
              );
            })}
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
              Loading live Stylus registry…
            </p>
          </div>
        ) : isError ? (
          <div
            data-testid="strategies-error"
            className="rounded-2xl border border-rose-500/35 bg-rose-500/10 px-5 py-6 text-sm text-rose-800 dark:text-rose-200"
          >
            <p className="font-semibold">Could not read StrategyExecutor</p>
            <p className="mt-1 opacity-90">
              {error?.message ?? "Check NEXT_PUBLIC_CONTRACT_ADDRESS / redeploy."}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 text-sm font-bold underline"
            >
              Retry
            </button>
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
              Run <code className="font-mono text-xs">npm run seed:strategies</code>{" "}
              or create one from the AI generator.
            </p>
            <Link
              href="/strategies/create"
              className="mt-2 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
            >
              Create strategy
            </Link>
          </div>
        ) : (
          <div
            data-testid="strategies-live-grid"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {liveStrategies.map((strategy) => {
              const meta = metaById.get(strategy.id);
              return (
                <StrategyCardLink
                  key={`${strategy.id}-${strategy.creator}`}
                  href={`/strategies/${encodeURIComponent(strategy.id)}`}
                  protocol={meta?.protocol ?? "On-chain strategy"}
                  name={meta?.name ?? strategy.id}
                  description={
                    meta?.description ??
                    "Registered on Stylus — add Supabase metadata for this id to enrich the card."
                  }
                  riskLevel={meta?.risk_level ?? "medium"}
                  apyLabel={
                    meta?.apy_pct != null
                      ? `${Number(meta.apy_pct).toFixed(1)}%`
                      : "—"
                  }
                  tvlLabel={
                    meta?.tvl_usd != null
                      ? formatUsd(Number(meta.tvl_usd))
                      : "—"
                  }
                  idBadge={strategy.id}
                  creator={strategy.creator}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StrategyCardLink({
  href,
  protocol,
  name,
  description,
  riskLevel,
  apyLabel,
  tvlLabel,
  idBadge,
  creator,
}: {
  href: string;
  protocol: string;
  name: string;
  description: string;
  riskLevel: "low" | "medium" | "high";
  apyLabel: string;
  tvlLabel: string;
  idBadge: string;
  creator: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-border bg-secondary/80 p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_0_28px_color-mix(in_oklab,var(--primary)_18%,transparent)]"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-cyan-400 to-emerald-400 opacity-80" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {protocol}
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">
            {name}
          </h2>
          <p className="mt-0.5 font-mono text-[10px] text-[var(--muted)]">
            id · {idBadge}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${riskTone(riskLevel)}`}
        >
          {riskLevel}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--accent)]">
        {description}
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-background/60 px-3 py-2.5">
          <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            <TrendingUp className="size-3" aria-hidden />
            APY
          </dt>
          <dd className="mt-0.5 text-xl font-extrabold tabular-nums text-foreground">
            {apyLabel}
          </dd>
        </div>
        <div className="rounded-xl bg-background/60 px-3 py-2.5">
          <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            <Activity className="size-3" aria-hidden />
            TVL
          </dt>
          <dd className="mt-0.5 text-xl font-extrabold tabular-nums text-foreground">
            {tvlLabel}
          </dd>
        </div>
      </dl>
      <p className="mt-3 font-mono text-[10px] text-[var(--muted)]">
        creator · {creator.slice(0, 6)}…{creator.slice(-4)}
      </p>
      <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary">
        Open dashboard
        <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}
