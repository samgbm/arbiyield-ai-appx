"use client";

import Link from "next/link";
import { ArrowUpRight, Shield } from "lucide-react";

/** Matches MeleePMM: 0 = No, 1 = Yes. */
const OUTCOME_NO = 0;
const OUTCOME_YES = 1;

export type PortfolioOutcome = "Yes" | "No";

export type PortfolioPositionStatus = "active" | "winner" | "lost" | "claimed";

export type PortfolioPositionCardProps = {
  marketId: string | number;
  title: string;
  category: string;
  outcome: PortfolioOutcome;
  outcomeId: number;
  /** Human-readable ETH amount for shares. */
  sharesLabel: string;
  /** Human-readable ETH amount for minimum return floor. */
  floorLabel: string;
  isResolved: boolean;
  winningOutcome?: number;
  claimed?: boolean;
};

export function resolvePortfolioStatus(input: {
  isResolved: boolean;
  outcomeId: number;
  winningOutcome?: number;
  claimed?: boolean;
}): PortfolioPositionStatus {
  if (!input.isResolved) return "active";
  const isWinner =
    input.winningOutcome !== undefined &&
    input.outcomeId === input.winningOutcome;
  if (isWinner && input.claimed) return "claimed";
  if (isWinner) return "winner";
  return "lost";
}

/**
 * Clickable portfolio row — links to the market detail / trade page.
 */
export function PortfolioPositionCard({
  marketId,
  title,
  category,
  outcome,
  outcomeId,
  sharesLabel,
  floorLabel,
  isResolved,
  winningOutcome,
  claimed = false,
}: PortfolioPositionCardProps) {
  const status = resolvePortfolioStatus({
    isResolved,
    outcomeId,
    winningOutcome,
    claimed,
  });

  const isLost = status === "lost";

  return (
    <Link
      href={`/markets/${marketId}`}
      data-testid="portfolio-position-card"
      data-status={status}
      className={`surface group flex h-full flex-col gap-4 p-4 transition hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5 ${
        isLost ? "opacity-55" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex rounded-md bg-background px-2.5 py-1 font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)] ring-1 ring-border">
          {category}
        </span>
        <StatusBadge status={status} />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-bold leading-snug tracking-tight text-foreground group-hover:text-primary sm:text-xl">
          {title}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <span
            data-testid="portfolio-outcome"
            className={`inline-flex rounded-md px-2.5 py-1 text-xs font-extrabold ${
              outcome === "Yes"
                ? "bg-[var(--success)]/15 text-[var(--success)]"
                : "bg-[var(--danger)]/15 text-[var(--danger)]"
            }`}
          >
            {outcome}
          </span>
          <span className="text-xs text-[var(--muted)]">
            Market #{marketId}
          </span>
        </div>
      </div>

      <dl className="mt-auto grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Shares
          </dt>
          <dd
            data-testid="portfolio-shares"
            className="mt-0.5 font-bold tabular-nums text-foreground"
          >
            {sharesLabel} ETH
          </dd>
        </div>
        <div>
          <dt className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            <Shield className="size-3 text-primary" aria-hidden />
            Min floor
          </dt>
          <dd
            data-testid="portfolio-floor"
            className="mt-0.5 font-bold tabular-nums text-primary"
          >
            {floorLabel} ETH
          </dd>
        </div>
      </dl>

      <p className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
        Open market
        <ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </p>
    </Link>
  );
}

function StatusBadge({ status }: { status: PortfolioPositionStatus }) {
  if (status === "winner") {
    return (
      <span
        data-testid="portfolio-status-badge"
        className="inline-flex rounded-md bg-emerald-500 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-[0_0_18px_color-mix(in_oklab,#10b981_55%,transparent)]"
      >
        Winner — Claim Winnings
      </span>
    );
  }
  if (status === "claimed") {
    return (
      <span
        data-testid="portfolio-status-badge"
        className="inline-flex rounded-md bg-emerald-500/15 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-300"
      >
        Claimed
      </span>
    );
  }
  if (status === "lost") {
    return (
      <span
        data-testid="portfolio-status-badge"
        className="inline-flex rounded-md bg-[var(--muted)]/20 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[var(--muted)]"
      >
        Lost
      </span>
    );
  }
  return (
    <span
      data-testid="portfolio-status-badge"
      className="inline-flex rounded-md bg-sky-500/15 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-sky-700 ring-1 ring-sky-500/30 dark:text-sky-300"
    >
      Active
    </span>
  );
}

/** Map outcome id → Yes/No label. */
export function outcomeLabelFromId(outcomeId: number): PortfolioOutcome {
  return outcomeId === OUTCOME_YES
    ? "Yes"
    : outcomeId === OUTCOME_NO
      ? "No"
      : "No";
}
