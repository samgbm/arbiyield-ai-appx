import Link from "next/link";
import { ExternalLink } from "lucide-react";

const ARBITRUM_SEPOLIA_EXPLORER = "https://sepolia.arbiscan.io/";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-secondary pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-8">
        <p className="text-sm text-[var(--muted)]">© 2026 ArbiYield AI</p>
        <Link
          href={ARBITRUM_SEPOLIA_EXPLORER}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--accent)] transition hover:text-primary"
        >
          Arbitrum Sepolia Explorer
          <ExternalLink className="size-3.5 shrink-0" aria-hidden />
        </Link>
      </div>
    </footer>
  );
}
