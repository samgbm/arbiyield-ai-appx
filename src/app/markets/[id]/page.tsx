"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useReadContract } from "wagmi";
import { getMarketOdds, formatMarketEndLabel } from "@/components/markets/MarketCard";
import {
  MarketChart,
  type YesProbabilityPoint,
} from "@/components/markets/MarketChart";
import { TradePanel } from "@/components/markets/TradePanel";
import { mockMarkets, type MockMarket } from "@/data/mockMarkets";
import { PMM_CONTRACT_ADDRESS, pmmABI } from "@/lib/pmmContract";
import { useDemoStore } from "@/store/useDemoStore";
import { parseOnChainMarket } from "@/utils/marketParser";

const ARBITRUM_SEPOLIA_CHAIN_ID = 421_614;

/** Build a short series ending at the live Yes probability from pool sizes. */
function seriesFromLiveOdds(yesPct: number, seed: string): YesProbabilityPoint[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const points: YesProbabilityPoint[] = [];
  let value = Math.min(90, Math.max(10, yesPct - 8 + (hash % 7)));

  for (let hour = 23; hour >= 0; hour -= 1) {
    const drift = ((hash >> (hour % 8)) & 3) - 1;
    value = Math.min(95, Math.max(5, value + drift));
    if (hour === 0) value = yesPct;
    const label = hour === 0 ? "now" : hour === 1 ? "1h" : `${hour}h`;
    points.push({ time: label, yesProbability: Number(value.toFixed(1)) });
  }

  return points.reverse();
}

function MarketDetailView({
  market,
  marketId,
  onTradeSuccess,
  chartLabel,
}: {
  market: MockMarket;
  marketId: string;
  onTradeSuccess?: () => void;
  chartLabel?: string;
}) {
  const { yesPct } = getMarketOdds(market);
  const chartData = useMemo(
    () => seriesFromLiveOdds(yesPct, market.id),
    [yesPct, market.id],
  );

  return (
    <div className="hero-wash">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/markets"
          className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--accent)] transition hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All markets
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.85fr)] lg:items-start">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                {market.category} · {formatMarketEndLabel(market.endDate)}
              </p>
              <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {market.title}
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--accent)] sm:text-base">
                {market.description}
              </p>
              <p className="text-xs font-semibold text-[var(--muted)]">
                Liquidity:{" "}
                {market.liquidityPool.toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })}{" "}
                ETH · Yes {yesPct.toFixed(1)}% · Status: {market.status}
                {chartLabel ? ` · ${chartLabel}` : ""}
              </p>
            </div>

            <MarketChart
              seed={market.id}
              data={chartData}
              subtitle={chartLabel ?? "Live demo series"}
            />
          </div>

          <aside className="lg:sticky lg:top-24">
            <TradePanel
              marketId={marketId}
              marketTitle={market.title}
              onTradeSuccess={() => onTradeSuccess?.()}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

/**
 * Dynamic market detail — Demo Mode serves mock/created markets;
 * live mode reads `getMarket` from MeleePMM and trades via `buyShares`.
 */
export default function MarketDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const isDemoMode = useDemoStore((s) => s.isDemoMode);
  const createdMarkets = useDemoStore((s) => s.createdMarkets);

  const numericId = useMemo(() => {
    if (!id) return null;
    if (!/^\d+$/.test(id)) return null;
    return BigInt(id);
  }, [id]);

  const {
    data: rawMarket,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useReadContract({
    address: PMM_CONTRACT_ADDRESS,
    abi: pmmABI,
    functionName: "getMarket",
    args: numericId != null ? [numericId] : undefined,
    chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
    query: {
      enabled: !isDemoMode && numericId != null,
    },
  });

  if (isDemoMode) {
    const market =
      createdMarkets.find((m) => m.id === id) ??
      mockMarkets.find((m) => m.id === id);

    if (!market || !id) {
      return (
        <div className="hero-wash">
          <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-16">
            <h1 className="font-display text-3xl text-foreground">
              Market not found
            </h1>
            <p className="text-sm text-[var(--accent)]">
              No demo market matches <code className="font-mono">{id}</code>.
            </p>
            <Link
              href="/markets"
              className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-border bg-secondary px-4 text-sm font-semibold"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back to markets
            </Link>
          </div>
        </div>
      );
    }

    return (
      <MarketDetailView
        market={market}
        marketId={market.id}
        chartLabel="Demo series"
      />
    );
  }

  if (numericId == null) {
    return (
      <div className="hero-wash">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-16">
          <h1 className="font-display text-3xl text-foreground">
            Invalid market id
          </h1>
          <p className="text-sm text-[var(--accent)]">
            On-chain markets use numeric ids (e.g.{" "}
            <code className="font-mono">/markets/0</code>).
          </p>
          <Link
            href="/markets"
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-border bg-secondary px-4 text-sm font-semibold"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to markets
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || (isFetching && !rawMarket)) {
    return (
      <div className="hero-wash">
        <div
          className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center gap-3 px-4 py-20 text-center"
          data-testid="market-detail-loading"
        >
          <LoaderCircle
            className="size-8 animate-spin text-primary"
            aria-hidden
          />
          <p className="text-sm font-semibold text-foreground">
            Fetching On-Chain State…
          </p>
          <Link
            href="/markets"
            className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-secondary px-4 text-sm font-semibold text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to markets
          </Link>
        </div>
      </div>
    );
  }

  if (isError || rawMarket == null) {
    return (
      <div className="hero-wash">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-16">
          <h1 className="font-display text-3xl text-foreground">
            Market not found
          </h1>
          <p className="text-sm text-[var(--accent)]">
            Could not load market <code className="font-mono">{id}</code> from
            MeleePMM.
          </p>
          <Link
            href="/markets"
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-border bg-secondary px-4 text-sm font-semibold"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to markets
          </Link>
        </div>
      </div>
    );
  }

  // Uninitialized slot: creator is zero address.
  const creator = rawMarket[0];
  if (
    !creator ||
    creator === "0x0000000000000000000000000000000000000000"
  ) {
    return (
      <div className="hero-wash">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-16">
          <h1 className="font-display text-3xl text-foreground">
            Market not found
          </h1>
          <p className="text-sm text-[var(--accent)]">
            No market exists at id <code className="font-mono">{id}</code>.
          </p>
          <Link
            href="/markets"
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-border bg-secondary px-4 text-sm font-semibold"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to markets
          </Link>
        </div>
      </div>
    );
  }

  const market = parseOnChainMarket(Number(id), rawMarket);

  return (
    <MarketDetailView
      market={market}
      marketId={id!}
      chartLabel="On-chain pools"
      onTradeSuccess={() => {
        void refetch();
      }}
    />
  );
}
