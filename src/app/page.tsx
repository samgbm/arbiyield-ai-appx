import Link from "next/link";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { StrategyStats } from "@/components/StrategyStats";

export default function HomePage() {
  return (
    <div className="hero-wash">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-14 sm:px-6 sm:py-16">
        <div className="space-y-4">
          <p className="font-mono-explorer text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            Arbitrum Sepolia · Stylus · Generative AI
          </p>
          <h1 className="font-display text-5xl tracking-tight text-foreground sm:text-6xl">
            Welcome to ArbiYield AI
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--accent)] sm:text-lg">
            Prompt a yield strategy, review the generative UI card, then sign and
            execute on Arbitrum Sepolia via our Stylus (Rust/WASM) contract.
          </p>
        </div>

        <StrategyStats />
        <ChatInterface />

        <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Theme engine ready
            </p>
            <p className="mt-1 text-xs text-[var(--accent)]">
              Light · Dim · Dark · Auto (System) · Quantum3 · ETH Lima · Arbiscan
            </p>
          </div>
          <Link
            href="https://sepolia.arbiscan.io/address/0xdb76e1ca5056c550afcd2084fc571c7fef2e89ae"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            View contract
          </Link>
        </div>

        <p className="text-sm text-[var(--muted)]">
          ETH Lima 2026 · Arbitrum &amp; AI Hackathon
        </p>
      </div>
    </div>
  );
}
