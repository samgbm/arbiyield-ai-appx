"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChartCandlestick,
  LayoutDashboard,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { useDemoStore } from "@/store/useDemoStore";

/**
 * App Switcher sidebar — toggles between core Yield Dashboard and the
 * Prediction Markets hub without disrupting either module.
 * Desktop: fixed left rail. Mobile: slide-over drawer + overlay.
 */

const NAV_ITEMS = [
  {
    href: "/",
    label: "Yield Dashboard",
    description: "AI strategies · Stylus ledger",
    icon: LayoutDashboard,
  },
  {
    href: "/markets",
    label: "Prediction Markets",
    description: "PMM hub · create & trade",
    icon: ChartCandlestick,
  },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDemoMode = useDemoStore((s) => s.isDemoMode);
  const toggleDemoMode = useDemoStore((s) => s.toggleDemoMode);

  // Close the drawer on route change (mobile UX).
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent background scroll while the mobile drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const nav = (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-4">
        <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          App switcher
        </p>
        <p className="mt-1 text-sm font-bold text-foreground">ArbiYield AI</p>
      </div>

      <nav aria-label="Modules" className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-12 items-start gap-3 rounded-xl px-3 py-2.5 transition ${
                active
                  ? "bg-primary/12 text-foreground ring-1 ring-primary/30"
                  : "text-[var(--accent)] hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] hover:text-foreground"
              }`}
            >
              <Icon
                className={`mt-0.5 size-5 shrink-0 ${active ? "text-primary" : ""}`}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="mt-0.5 block text-xs text-[var(--muted)]">
                  {item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Live-pitch fail-safe — mirrors footer stealth toggle via Zustand. */}
      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={toggleDemoMode}
          aria-pressed={isDemoMode}
          className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
            isDemoMode
              ? "bg-primary/15 text-primary ring-1 ring-primary/35"
              : "text-[var(--muted)] hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] hover:text-foreground"
          }`}
        >
          <Zap
            className={`size-5 shrink-0 ${isDemoMode ? "fill-primary/30" : ""}`}
            aria-hidden
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold">
              Demo Mode {isDemoMode ? "On" : "Off"}
            </span>
            <span className="mt-0.5 block text-xs opacity-80">
              Mock AI + Web3 for live pitches
            </span>
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile open control — sits above content, clears the fixed header. */}
      <button
        type="button"
        className="fixed left-3 top-[calc(env(safe-area-inset-top)+0.65rem)] z-50 inline-flex size-11 items-center justify-center rounded-xl border border-border bg-secondary text-foreground shadow-sm md:hidden"
        aria-expanded={mobileOpen}
        aria-controls="app-sidebar"
        aria-label={mobileOpen ? "Close app switcher" : "Open app switcher"}
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {/* Scrim for mobile drawer */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close app switcher overlay"
          className="fixed inset-0 z-40 bg-black/45 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col border-r border-border bg-secondary pt-[env(safe-area-inset-top)] shadow-[var(--shadow-soft)] transition-transform duration-200 ease-out md:w-72 md:translate-x-0 md:pt-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {nav}
      </aside>
    </>
  );
}
