export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
        Arbitrum Sepolia · Stylus · Generative AI
      </p>
      <h1 className="font-display text-5xl tracking-tight text-foreground">
        ArbiYield AI
      </h1>
      <p className="text-base leading-relaxed text-[var(--accent)] sm:text-lg">
        Prompt a yield strategy, review the generative UI card, then sign and
        execute on Arbitrum Sepolia via our Stylus (Rust/WASM) contract.
      </p>
      <p className="text-sm text-[var(--muted)]">
        ETH Lima 2026 · Arbitrum &amp; AI Hackathon
      </p>
    </div>
  );
}
