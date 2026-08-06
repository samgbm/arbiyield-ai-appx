import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create Market",
  description: "AI-assisted prediction market creator for ArbiYield PMM.",
};

/** Scaffold for the AI Market Creator chat (Phase 3). */
export default function CreateMarketPage() {
  return (
    <div className="hero-wash">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-14 sm:px-6 sm:py-16">
        <p className="font-mono-explorer text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
          AI Market Creator
        </p>
        <h1 className="font-display text-4xl tracking-tight text-foreground sm:text-5xl">
          Create a market
        </h1>
        <p className="text-base text-[var(--accent)]">
          The generative chat UI for market creation lands in Phase 3. For now,
          this route reserves the path in the App Router.
        </p>
        <Link
          href="/markets"
          className="inline-flex min-h-11 w-fit items-center justify-center rounded-xl border border-border bg-secondary px-4 text-sm font-semibold text-foreground"
        >
          Back to markets
        </Link>
      </div>
    </div>
  );
}
