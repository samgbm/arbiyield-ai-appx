"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Root layout error boundary — must render its own <html>/<body>.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[global-error.tsx]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#070b14] text-slate-100 antialiased">
        <div className="flex min-h-screen items-center justify-center px-4 py-16">
          <div
            data-testid="global-error-boundary"
            className="w-full max-w-lg rounded-2xl border border-rose-500/40 bg-[#0c1220] p-6 shadow-[0_0_40px_rgba(244,63,94,0.2)] sm:p-8"
          >
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-400">
              Root fault
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Oops! Something went wrong
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              The root shell crashed. Retry to remount the app without a full
              reload.
            </p>
            {error.digest ? (
              <p className="mt-3 font-mono text-[11px] text-slate-500">
                digest: {error.digest}
              </p>
            ) : null}
            <button
              type="button"
              data-testid="global-error-try-again"
              onClick={() => reset()}
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-cyan-500 px-4 text-sm font-bold text-slate-950 transition hover:brightness-110"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
