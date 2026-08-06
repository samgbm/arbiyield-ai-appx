import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Prediction Markets",
  description:
    "ArbiYield Prediction Markets hub — discover, create, and trade events on Arbitrum Stylus.",
};

/**
 * Prediction Markets marketplace scaffold (Phase 1).
 * Later increments add trending sorts, AI creator, and Stylus trading.
 */
export default function MarketsPage() {
  return (
    <div className="hero-wash">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-14 sm:px-6 sm:py-16">
        <div className="space-y-4">
          <p className="font-mono-explorer text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            Prediction Markets · PMM
          </p>
          <h1 className="font-display text-5xl tracking-tight text-foreground sm:text-6xl">
            Markets hub
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--accent)] sm:text-lg">
            Discover active prediction markets, create new ones with AI, and
            trade Yes/No shares backed by our Stylus parimutuel engine.
          </p>
        </div>

        <div className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Create with AI
            </p>
            <p className="mt-1 text-xs text-[var(--accent)]">
              Prompt an event → Generative UI card → deploy on Stylus
            </p>
          </div>
          <Link
            href="/markets/create"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            Create Market
          </Link>
        </div>

        <div className="surface p-5">
          <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Coming next
          </p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--accent)]">
            <li>Trending · Ending Soon · Highest Liquidity sorts</li>
            <li>Market detail trading + Minimum Return Floor</li>
            <li>Instant Cashout LP vault</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
