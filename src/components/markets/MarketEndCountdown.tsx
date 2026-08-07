"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import {
  formatCountdown,
  hasMarketEnded,
  msUntilEnd,
} from "@/utils/marketDates";

type MarketEndCountdownProps = {
  /** On-chain end timestamp (unix seconds). */
  endTimestamp: number | bigint | string;
  isResolved?: boolean;
  className?: string;
};

/**
 * Live countdown to market end. Switches to "ready to resolve" when time is up.
 */
export function MarketEndCountdown({
  endTimestamp,
  isResolved = false,
  className = "",
}: MarketEndCountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (isResolved) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [isResolved]);

  if (isResolved) {
    return (
      <div
        data-testid="market-end-countdown"
        data-state="resolved"
        className={`inline-flex items-center gap-2 rounded-xl bg-emerald-500/12 px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300 ${className}`}
      >
        <Timer className="size-4 shrink-0" aria-hidden />
        Market resolved
      </div>
    );
  }

  const remaining = msUntilEnd(endTimestamp, new Date(now));
  const ended = hasMarketEnded(endTimestamp, new Date(now));

  if (ended) {
    return (
      <div
        data-testid="market-end-countdown"
        data-state="ended"
        className={`inline-flex items-center gap-2 rounded-xl bg-amber-500/15 px-3 py-2 text-sm font-extrabold text-amber-800 ring-1 ring-amber-500/40 dark:text-amber-200 ${className}`}
      >
        <Timer className="size-4 shrink-0 animate-pulse" aria-hidden />
        End time reached — ready to resolve
      </div>
    );
  }

  return (
    <div
      data-testid="market-end-countdown"
      data-state="counting"
      className={`inline-flex items-center gap-2 rounded-xl bg-background px-3 py-2 text-sm font-semibold text-foreground ring-1 ring-border ${className}`}
    >
      <Timer className="size-4 shrink-0 text-primary" aria-hidden />
      <span className="text-[var(--muted)]">Ends in</span>
      <span className="font-mono-explorer tabular-nums tracking-wide text-primary">
        {formatCountdown(remaining)}
      </span>
    </div>
  );
}
