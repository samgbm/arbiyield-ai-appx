import Link from "next/link";
import { AppShowcase } from "@/components/home/AppShowcase";
import {
  NINO_CONTRACT_ADDRESS,
  PMM_CONTRACT_ADDRESS,
  YIELD_CONTRACT_ADDRESS,
} from "@/lib/contractAddresses";

/**
 * Hackathon presentation home — three apps, contract addresses, live txs.
 */
export default function HomePage() {
  return (
    <div className="hero-wash" data-testid="home-showcase-page">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="max-w-3xl space-y-4">
          <p className="font-mono-explorer text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            ETH Lima 2026 · Arbitrum Stylus · Generative AI
          </p>
          <h1 className="font-display text-4xl tracking-tight text-foreground sm:text-6xl">
            ArbiYield AI
          </h1>
          <p className="text-base leading-relaxed text-[var(--accent)] sm:text-lg">
            One scaffold, three production demos on Arbitrum Sepolia: AI yield
            strategies, prediction markets, and El Niño climate resilience —
            each backed by a live Stylus contract judges can verify on Arbiscan.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="/strategies"
              className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-extrabold text-primary-foreground"
            >
              Explore strategies
            </Link>
            <Link
              href="/markets"
              className="inline-flex min-h-11 items-center rounded-xl border border-border bg-secondary px-4 text-sm font-bold text-foreground"
            >
              Prediction markets
            </Link>
            <Link
              href="/el-nino"
              className="inline-flex min-h-11 items-center rounded-xl border border-sky-500/35 bg-sky-500/10 px-4 text-sm font-bold text-sky-800 dark:text-sky-200"
            >
              El Niño module
            </Link>
          </div>
        </header>

        <dl className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ContractChip label="Yield StrategyExecutor" address={YIELD_CONTRACT_ADDRESS} />
          <ContractChip label="MeleePMM Markets" address={PMM_CONTRACT_ADDRESS} />
          <ContractChip label="El Niño Resilience" address={NINO_CONTRACT_ADDRESS} />
        </dl>

        <AppShowcase />

        <p className="mt-12 text-sm text-[var(--muted)]">
          Demo flow in the sidebar: Yield → Markets → El Niño. Every address and
          transaction below is live on Arbitrum Sepolia.
        </p>
      </div>
    </div>
  );
}

function ContractChip({
  label,
  address,
}: {
  label: string;
  address: `0x${string}`;
}) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/70 px-4 py-3">
      <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </dt>
      <dd className="mt-1 break-all font-mono text-[11px] font-semibold text-foreground">
        <a
          href={`https://sepolia.arbiscan.io/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-sky-600 hover:underline"
        >
          {address}
        </a>
      </dd>
    </div>
  );
}
