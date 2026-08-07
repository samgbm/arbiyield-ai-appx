"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Segment error boundary — keeps the app shell and offers a retry.
 */
export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[error.tsx]", error);
  }, [error]);

  return (
    <div className="hero-wash flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div
        data-testid="app-error-boundary"
        className="w-full max-w-lg overflow-hidden rounded-[var(--radius-panel)] border border-[color-mix(in_oklab,var(--danger)_40%,transparent)] bg-[color-mix(in_oklab,#070b14_92%,var(--danger))] p-6 shadow-[0_0_40px_color-mix(in_oklab,var(--danger)_18%,transparent)] sm:p-8"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="mt-0.5 size-6 shrink-0 text-[var(--danger)]"
            aria-hidden
          />
          <div className="min-w-0 space-y-2">
            <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--danger)]">
              Runtime fault
            </p>
            <h1 className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">
              Oops! Something went wrong
            </h1>
            <p className="text-sm leading-relaxed text-[var(--accent)]">
              A component crashed while rendering. Your wallet and on-chain
              state are fine — hit Try Again to remount this view.
            </p>
            {error.digest ? (
              <p className="font-mono-explorer text-[11px] text-[var(--muted)]">
                digest: {error.digest}
              </p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          data-testid="error-try-again"
          onClick={() => reset()}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:brightness-105"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
