import type { Metadata } from "next";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Market ${id}`,
    description: `Prediction market ${id} on ArbiYield PMM.`,
  };
}

/** Scaffold for individual market trading / resolution views. */
export default async function MarketDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="hero-wash">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-14 sm:px-6 sm:py-16">
        <p className="font-mono-explorer text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
          Market · {id}
        </p>
        <h1 className="font-display text-4xl tracking-tight text-foreground sm:text-5xl">
          Market detail
        </h1>
        <p className="text-base text-[var(--accent)]">
          Trading, Minimum Return Floor, Instant Cashout, and claim flows will
          mount here in later increments.
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
