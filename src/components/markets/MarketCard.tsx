"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import {
  Bot,
  CalendarClock,
  Clapperboard,
  Coins,
  Droplets,
  Landmark,
  Trophy,
} from "lucide-react";
import { formatDistanceStrict, parseISO } from "date-fns";
import type { MockMarket } from "@/data/mockMarkets";

type Category = MockMarket["category"];

const categoryIcon: Record<
  Category,
  ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  Crypto: Coins,
  Culture: Clapperboard,
  AI: Bot,
  Sports: Trophy,
  Macro: Landmark,
};

/** Pure helper — also unit-tested for Yes/No odds math. */
export function getMarketOdds(market: MockMarket) {
  const yes = market.options.find((o) => o.label === "Yes")?.poolAmount ?? 0;
  const no = market.options.find((o) => o.label === "No")?.poolAmount ?? 0;
  const total = yes + no;
  const yesPct = total > 0 ? (yes / total) * 100 : 50;
  const noPct = total > 0 ? (no / total) * 100 : 50;
  return { yes, no, total, yesPct, noPct };
}

export function formatMarketEndLabel(endDate: string, now = new Date()) {
  const end = parseISO(endDate);
  if (end.getTime() <= now.getTime()) return "Ended";
  return `Ends in ${formatDistanceStrict(end, now)}`;
}

export function MarketCard({ market }: { market: MockMarket }) {
  const Icon = categoryIcon[market.category] ?? Coins;
  const { yesPct, noPct } = getMarketOdds(market);
  const endLabel = formatMarketEndLabel(market.endDate);

  return (
    <Link
      href={`/markets/${market.id}`}
      className="surface flex h-full flex-col overflow-hidden transition hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1 font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)] ring-1 ring-border">
            <Icon className="size-3.5 text-primary" aria-hidden />
            {market.category}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)]">
            <CalendarClock className="size-3.5 shrink-0" aria-hidden />
            <time dateTime={market.endDate}>{endLabel}</time>
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold leading-snug tracking-tight text-foreground transition group-hover:text-primary sm:text-xl">
            {market.title}
          </h2>
          <p className="line-clamp-2 text-sm leading-relaxed text-[var(--accent)]">
            {market.description}
          </p>
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex items-end justify-between gap-3 text-sm">
            <div>
              <p className="font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Yes
              </p>
              <p className="text-lg font-bold text-[var(--success)]">
                {yesPct.toFixed(1)}%
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                No
              </p>
              <p className="text-lg font-bold text-[var(--danger)]">
                {noPct.toFixed(1)}%
              </p>
            </div>
          </div>

          <div
            className="flex h-2.5 overflow-hidden rounded-full bg-border"
            role="img"
            aria-label={`Yes ${yesPct.toFixed(1)} percent, No ${noPct.toFixed(1)} percent`}
          >
            <div
              data-testid="yes-odds-bar"
              className="h-full bg-[var(--success)] transition-[width]"
              style={{ width: `${yesPct}%` }}
            />
            <div
              data-testid="no-odds-bar"
              className="h-full bg-[var(--danger)] transition-[width]"
              style={{ width: `${noPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border bg-background/50 px-4 py-3 sm:px-5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)]">
          <Droplets className="size-3.5 text-primary" aria-hidden />
          {market.liquidityPool.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}{" "}
          ETH liquidity
        </span>
        <span className="inline-flex min-h-9 items-center rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground">
          Trade
        </span>
      </div>
    </Link>
  );
}
