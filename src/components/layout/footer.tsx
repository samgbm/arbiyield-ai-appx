export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-secondary">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} ArbiYield AI · ETH Lima 2026</p>
        <p>Arbitrum Scaffold-Stylus + Generative AI</p>
      </div>
    </footer>
  );
}
