"use client";

import { ArrowUpRight, ListOrdered } from "lucide-react";
import type { Strategy } from "@/lib/schemas";

const riskBadgeStyles: Record<
  NonNullable<Strategy["riskLevel"]>,
  string
> = {
  low: "bg-[color-mix(in_oklab,var(--success)_18%,transparent)] text-[var(--success)] ring-[color-mix(in_oklab,var(--success)_35%,transparent)]",
  medium:
    "bg-[color-mix(in_oklab,var(--warning)_20%,transparent)] text-[var(--warning)] ring-[color-mix(in_oklab,var(--warning)_40%,transparent)]",
  high: "bg-[color-mix(in_oklab,var(--danger)_18%,transparent)] text-[var(--danger)] ring-[color-mix(in_oklab,var(--danger)_35%,transparent)]",
};

export function StrategyCard({ strategy }: { strategy: Partial<Strategy> }) {
  const ready =
    Boolean(strategy.strategyName?.trim()) &&
    typeof strategy.expectedYield === "number";

  const steps = strategy.steps?.filter(
    (step): step is string => typeof step === "string" && step.length > 0,
  );

  return (
    <article
      aria-label={strategy.strategyName ?? "Generating strategy"}
      className="chat-msg overflow-hidden rounded-[var(--radius-panel)] border border-border bg-secondary shadow-[var(--shadow-soft)]"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            AI strategy
          </p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {strategy.strategyName?.trim() || "Generating Strategy…"}
          </h3>
        </div>

        {strategy.riskLevel ? (
          <span
            className={`inline-flex shrink-0 items-center rounded-md px-2.5 py-1 font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.12em] ring-1 ${riskBadgeStyles[strategy.riskLevel]}`}
          >
            {strategy.riskLevel} risk
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center rounded-md bg-background px-2.5 py-1 font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)] ring-1 ring-border">
            Risk…
          </span>
        )}
      </header>

      <div className="space-y-5 px-4 py-5 sm:px-5">
        <div>
          <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Expected yield
          </p>
          <p className="mt-1 font-display text-4xl tracking-tight text-primary sm:text-5xl">
            {typeof strategy.expectedYield === "number" ? (
              <>
                {strategy.expectedYield}
                <span className="text-2xl sm:text-3xl">% APY</span>
              </>
            ) : (
              <span className="text-2xl text-[var(--muted)] sm:text-3xl">
                —% APY
              </span>
            )}
          </p>
        </div>

        {strategy.description ? (
          <p className="text-sm leading-relaxed text-[var(--accent)] sm:text-[15px]">
            {strategy.description}
          </p>
        ) : (
          <p className="animate-pulse-soft text-sm text-[var(--muted)]">
            Drafting strategy details…
          </p>
        )}

        {steps && steps.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-[var(--accent)]">
              <ListOrdered className="size-4 text-primary" aria-hidden />
              <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.14em]">
                Execution steps
              </p>
            </div>
            <ol className="space-y-2">
              {steps.map((step, index) => (
                <li
                  key={`${index}-${step.slice(0, 24)}`}
                  className="flex gap-3 rounded-xl bg-background px-3 py-2.5 text-sm leading-snug text-foreground ring-1 ring-border"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono-explorer text-[11px] font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <footer className="border-t border-border px-4 py-4 sm:px-5">
        <button
          type="button"
          disabled={!ready}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Execute on Arbitrum
          <ArrowUpRight className="size-4" aria-hidden />
        </button>
        {!ready && (
          <p className="mt-2 text-center text-xs text-[var(--muted)]">
            Waiting for name and yield before execution…
          </p>
        )}
      </footer>
    </article>
  );
}
