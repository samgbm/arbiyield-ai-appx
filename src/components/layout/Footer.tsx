"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useDemoStore } from "@/store/useDemoStore";

const ARBITRUM_SEPOLIA_EXPLORER = "https://sepolia.arbiscan.io/";

export function Footer() {
  // Stealth footer toggle stays in sync with Sidebar via Zustand persistence.
  const isDemoMode = useDemoStore((s) => s.isDemoMode);
  const toggleDemoMode = useDemoStore((s) => s.toggleDemoMode);

  return (
    <footer className="mt-auto border-t border-border bg-secondary pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-8">
        <div className="flex items-center gap-2">
          <p className="text-sm text-[var(--muted)]">© 2026 ArbiYield AI</p>
          <button
            type="button"
            onClick={toggleDemoMode}
            aria-pressed={isDemoMode}
            aria-label={isDemoMode ? "Disable demo mode" : "Enable demo mode"}
            title={isDemoMode ? "Demo mode on" : undefined}
            className={`inline-flex size-7 items-center justify-center rounded-md text-xs transition ${
              isDemoMode
                ? "bg-primary/15 text-primary shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_45%,transparent)]"
                : "text-[var(--muted)]/40 hover:text-[var(--muted)]/70"
            }`}
          >
            ⚡
          </button>
        </div>
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
