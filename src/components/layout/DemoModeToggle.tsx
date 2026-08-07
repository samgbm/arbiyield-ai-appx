"use client";

import { useDemoStore } from "@/store/useDemoStore";

/**
 * Global Demo Mode switch for the top nav — pitch fail-safe across Yield,
 * Markets, and El Niño modules.
 */
export function DemoModeToggle() {
  const isDemoMode = useDemoStore((s) => s.isDemoMode);
  const toggleDemoMode = useDemoStore((s) => s.toggleDemoMode);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDemoMode}
      aria-label={
        isDemoMode ? "Disable demo mode" : "Enable demo mode"
      }
      data-testid="header-demo-mode-toggle"
      onClick={toggleDemoMode}
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-secondary/80 px-2 py-1.5 pl-2.5 shadow-sm transition hover:bg-secondary"
    >
      <span
        data-testid="header-demo-mode-track"
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
          isDemoMode ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
        }`}
      >
        <span
          aria-hidden
          data-testid="header-demo-mode-thumb"
          className={`inline-block size-5 rounded-full bg-white shadow transition-transform duration-200 ${
            isDemoMode ? "translate-x-[1.35rem]" : "translate-x-0.5"
          }`}
        />
      </span>
      <span
        data-testid="header-demo-mode-badge"
        className={`pr-1.5 text-[11px] font-bold uppercase tracking-[0.08em] ${
          isDemoMode
            ? "text-emerald-700 dark:text-emerald-300"
            : "text-[var(--muted)]"
        }`}
      >
        {isDemoMode ? "Demo Data: ON" : "Live Network"}
      </span>
    </button>
  );
}
