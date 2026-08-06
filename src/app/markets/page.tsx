"use client";

import Link from "next/link";
import { LoaderCircle, Sparkles } from "lucide-react";
import { MarketCard } from "@/components/markets/MarketCard";
import { mockMarkets } from "@/data/mockMarkets";
import { useDemoStore } from "@/store/useDemoStore";

/**
 * Prediction Markets hub.
 * Demo Mode → instant mock marketplace for pitches.
 * Live Mode → temporary connecting state until Stylus PMM reads land.
 */
export default function MarketsPage() {
  const isDemoMode = useDemoStore((s) => s.isDemoMode);
  const createdMarkets = useDemoStore((s) => s.createdMarkets);

  return (
    <div className="hero-wash">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="font-mono-explorer text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              Prediction Markets · PMM
            </p>
            <h1 className="font-display text-4xl tracking-tight text-foreground sm:text-5xl">
              Markets hub
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-[var(--accent)]">
              Discover active markets, create with AI, and trade Yes/No shares
              with Minimum Return Floor protection on Stylus.
            </p>
          </div>

          <Link
            href="/markets/create"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            <Sparkles className="size-4" aria-hidden />
            Create Market
          </Link>
        </div>

        {isDemoMode ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...createdMarkets, ...mockMarkets].map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        ) : (
          <div className="surface flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <LoaderCircle
              className="size-8 animate-spin text-primary"
              aria-hidden
            />
            <p className="text-sm font-semibold text-foreground">
              Connecting to Arbitrum PMM Contract…
            </p>
            <p className="max-w-sm text-xs text-[var(--muted)]">
              Enable Demo Mode in the sidebar (or footer ⚡) to browse seeded
              markets during the pitch.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
