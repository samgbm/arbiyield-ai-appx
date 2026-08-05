"use client";

/**
 * Pulsing placeholder that mirrors StrategyCard layout during TTFT
 * (before the first structured JSON fields arrive).
 */
export function StrategySkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Generating strategy"
      className="chat-msg overflow-hidden rounded-[var(--radius-panel)] border border-border bg-secondary shadow-[var(--shadow-soft)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-20 animate-pulse rounded bg-[color-mix(in_oklab,var(--muted)_35%,transparent)]" />
          <div className="h-6 w-3/4 max-w-xs animate-pulse rounded-md bg-[color-mix(in_oklab,var(--muted)_40%,transparent)]" />
        </div>
        <div className="h-7 w-20 animate-pulse rounded-md bg-[color-mix(in_oklab,var(--muted)_30%,transparent)]" />
      </div>

      <div className="space-y-5 px-4 py-5 sm:px-5">
        <div className="space-y-2">
          <div className="h-3 w-28 animate-pulse rounded bg-[color-mix(in_oklab,var(--muted)_30%,transparent)]" />
          <div className="h-12 w-36 animate-pulse rounded-md bg-[color-mix(in_oklab,var(--muted)_45%,transparent)] sm:h-14" />
        </div>

        <div className="space-y-2">
          <div className="h-3.5 w-full animate-pulse rounded bg-[color-mix(in_oklab,var(--muted)_28%,transparent)]" />
          <div className="h-3.5 w-11/12 animate-pulse rounded bg-[color-mix(in_oklab,var(--muted)_28%,transparent)]" />
          <div className="h-3.5 w-4/5 animate-pulse rounded bg-[color-mix(in_oklab,var(--muted)_28%,transparent)]" />
        </div>

        <div className="space-y-2">
          <div className="h-3 w-32 animate-pulse rounded bg-[color-mix(in_oklab,var(--muted)_30%,transparent)]" />
          <div className="h-11 w-full animate-pulse rounded-xl bg-[color-mix(in_oklab,var(--muted)_22%,transparent)]" />
          <div className="h-11 w-full animate-pulse rounded-xl bg-[color-mix(in_oklab,var(--muted)_22%,transparent)]" />
          <div className="h-11 w-full animate-pulse rounded-xl bg-[color-mix(in_oklab,var(--muted)_22%,transparent)]" />
        </div>
      </div>

      <div className="border-t border-border px-4 py-4 sm:px-5">
        <div className="h-11 w-full animate-pulse rounded-xl bg-[color-mix(in_oklab,var(--muted)_35%,transparent)]" />
        <p className="mt-2 text-center text-xs text-[var(--muted)]">
          Crafting your Arbitrum strategy…
        </p>
      </div>
    </div>
  );
}
