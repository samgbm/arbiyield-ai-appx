"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Briefcase,
  ChartCandlestick,
  CloudRain,
  FileJson,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Sparkles,
  Tractor,
  TrendingUp,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { useDemoStore } from "@/store/useDemoStore";

/**
 * App Switcher sidebar — toggles between Yield, Prediction Markets, and the
 * El Niño Climate Resilience module.
 * Desktop: fixed left rail. Mobile: slide-over drawer + overlay.
 */

const NAV_ITEMS = [
  {
    href: "/",
    label: "Yield Dashboard",
    description: "AI strategies · Stylus ledger",
    icon: LayoutDashboard,
    testId: "nav-yield-dashboard",
  },
  {
    href: "/strategies",
    label: "Yield Strategies",
    description: "On-chain sleeves · Stylus hub",
    icon: TrendingUp,
    testId: "nav-yield-strategies",
  },
  {
    href: "/markets",
    label: "Prediction Markets",
    description: "PMM hub · create & trade",
    icon: ChartCandlestick,
    testId: "nav-markets",
  },
  {
    href: "/markets/portfolio",
    label: "Portfolio",
    description: "Your bets across markets",
    icon: Briefcase,
    testId: "nav-portfolio",
  },
  {
    href: "/markets/create",
    label: "Create Market",
    description: "AI generative deploy card",
    icon: Sparkles,
    testId: "nav-create-market",
  },
  {
    href: "/docs",
    label: "API Docs",
    description: "OpenAPI · Try it out",
    icon: FileJson,
    testId: "nav-docs",
  },
] as const;

/** El Niño Climate Resilience module routes (Increment 1 shell). */
export const EL_NINO_NAV_ITEMS = [
  {
    href: "/el-nino/logistics",
    label: "Logistics Tracker",
    description: "Aid route provenance · QR",
    icon: Truck,
    testId: "nav-el-nino-logistics",
  },
  {
    href: "/el-nino/onboarding",
    label: "Farmer Onboarding",
    description: "Batch register cooperatives",
    icon: Tractor,
    testId: "nav-el-nino-onboarding",
  },
  {
    href: "/el-nino/oracle",
    label: "Oracle Trigger",
    description: "Rainfall → zero-click payout",
    icon: CloudRain,
    testId: "nav-el-nino-oracle",
  },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // Keep /markets hub distinct from create / portfolio sub-routes.
  if (href === "/markets") {
    return (
      pathname === "/markets" ||
      (pathname.startsWith("/markets/") &&
        !pathname.startsWith("/markets/create") &&
        !pathname.startsWith("/markets/portfolio"))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  // Open only while pathname matches the route when the drawer was opened —
  // navigating away closes it without a setState-in-effect.
  const [openedForPath, setOpenedForPath] = useState<string | null>(null);
  const mobileOpen = openedForPath === pathname;
  const isDemoMode = useDemoStore((s) => s.isDemoMode);
  const toggleDemoMode = useDemoStore((s) => s.toggleDemoMode);

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

      <nav
        aria-label="Modules"
        data-testid="app-sidebar-nav"
        className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={item.testId}
              onClick={() => setOpenedForPath(null)}
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

        <div className="my-2 border-t border-border pt-3">
          <p className="mb-1 px-3 font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            El Niño Resilience
          </p>
          {EL_NINO_NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={item.testId}
                onClick={() => setOpenedForPath(null)}
                className={`flex min-h-12 items-start gap-3 rounded-xl px-3 py-2.5 transition ${
                  active
                    ? "bg-sky-500/12 text-foreground ring-1 ring-sky-500/35"
                    : "text-[var(--accent)] hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] hover:text-foreground"
                }`}
              >
                <Icon
                  className={`mt-0.5 size-5 shrink-0 ${active ? "text-sky-500" : ""}`}
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--muted)]">
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Live-pitch fail-safe + system status */}
      <div className="space-y-1 border-t border-border p-3">
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

        <Link
          href="/health"
          onClick={() => setOpenedForPath(null)}
          data-testid="nav-system-status"
          className={`flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
            pathname.startsWith("/health")
              ? "bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300"
              : "text-[var(--muted)] hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] hover:text-foreground"
          }`}
        >
          <ShieldCheck className="size-4 shrink-0" aria-hidden />
          <span className="text-xs font-semibold tracking-wide">
            System Status
          </span>
        </Link>
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
        onClick={() =>
          setOpenedForPath((prev) => (prev === pathname ? null : pathname))
        }
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {/* Scrim for mobile drawer */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close app switcher overlay"
          className="fixed inset-0 z-40 bg-black/45 md:hidden"
          onClick={() => setOpenedForPath(null)}
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
