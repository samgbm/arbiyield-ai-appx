import Link from "next/link";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { StrategyStats } from "@/components/StrategyStats";
import { CONTRACT_ADDRESS } from "@/lib/contract";

/**
 * AI yield strategy generator — formerly the home dashboard.
 * Registers strategy id + creator on Stylus; full copy lands in Supabase.
 */
export default function StrategiesCreatePage() {
  return (
    <div className="hero-wash" data-testid="strategies-create-page">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-14 sm:px-6 sm:py-16">
        <div className="space-y-4">
          <p className="font-mono-explorer text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            Yield · Create · Stylus + Supabase
          </p>
          <h1 className="font-display text-5xl tracking-tight text-foreground sm:text-6xl">
            Generate a Yield Strategy
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--accent)] sm:text-lg">
            Prompt the AI, review the generative card (including execution
            steps), then sign on Arbitrum Sepolia. On-chain we store only the
            strategy id and your wallet; rich metadata is matched in Supabase.
          </p>
        </div>

        <StrategyStats />
        <ChatInterface />

        <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-sm font-semibold text-foreground">
              StrategyExecutor
            </p>
            <p className="mt-1 break-all font-mono text-xs text-[var(--accent)]">
              {CONTRACT_ADDRESS}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/strategies"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-bold text-foreground"
            >
              Browse hub
            </Link>
            <Link
              href={`https://sepolia.arbiscan.io/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
            >
              View contract
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
