"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { MarketChart } from "@/components/markets/MarketChart";
import { TradePanel } from "@/components/markets/TradePanel";
import { formatMarketEndLabel } from "@/components/markets/MarketCard";
import { mockMarkets } from "@/data/mockMarkets";
import { useDemoStore } from "@/store/useDemoStore";

/**
 * Dynamic market detail — Demo Mode serves mockMarkets instantly;
 * live mode shows on-chain fetch placeholder until Stylus reads land.
 */
export default function MarketDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const isDemoMode = useDemoStore((s) => s.isDemoMode);

  if (!isDemoMode) {
    return (
      <div className="hero-wash">
        <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center gap-3 px-4 py-20 text-center">
          <LoaderCircle
            className="size-8 animate-spin text-primary"
            aria-hidden
          />
          <p className="text-sm font-semibold text-foreground">
            Fetching On-Chain State…
          </p>
          <p className="max-w-sm text-xs text-[var(--muted)]">
            Enable Demo Mode to open seeded markets during the pitch.
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

  const market = mockMarkets.find((m) => m.id === id);

  if (!market) {
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
          {/* Left: title, copy, probability chart */}
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
                Liquidity: {market.liquidityPool.toLocaleString()} ETH · Status:{" "}
                {market.status}
              </p>
            </div>

            <MarketChart seed={market.id} />
          </div>

          {/* Right: sticky trade panel on desktop */}
          <aside className="lg:sticky lg:top-24">
            <TradePanel marketTitle={market.title} />
          </aside>
        </div>
      </div>
    </div>
  );
}
