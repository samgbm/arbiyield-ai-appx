"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import {
  BookOpen,
  Briefcase,
  ChartCandlestick,
  CloudRain,
  HeartHandshake,
  LayoutDashboard,
  Menu,
  PackagePlus,
  Sparkles,
  Tractor,
  TrendingUp,
  Truck,
  X,
} from "lucide-react";

/**
 * App Switcher sidebar — Yield → Markets → El Niño (demo flow).
 * Desktop: fixed left rail. Mobile: slide-over drawer + overlay.
 */

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  testId: string;
};

/** Yield module — demo flow step 1. */
export const YIELD_NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/strategies",
    label: "Yield Strategies",
    description: "Live hub · Stylus + Supabase",
    icon: TrendingUp,
    testId: "nav-yield-strategies",
  },
  {
    href: "/strategies/create",
    label: "Create Strategy",
    description: "AI generator · sign on-chain",
    icon: LayoutDashboard,
    testId: "nav-yield-create",
  },
] as const;

/** Prediction markets — demo flow step 2. */
export const MARKET_NAV_ITEMS: readonly NavItem[] = [
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
] as const;

/**
 * El Niño Climate Resilience — demo flow step 3.
 * Order: awareness → fund pool → onboard → seal checkpoints → track → oracle.
 */
export const EL_NINO_NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/el-nino",
    label: "El Niño Overview",
    description: "Mission · demo guide",
    icon: BookOpen,
    testId: "nav-el-nino-overview",
  },
  {
    href: "/el-nino/funding",
    label: "Relief Funding",
    description: "Crowdfund ETH · zero-click",
    icon: HeartHandshake,
    testId: "nav-el-nino-funding",
  },
  {
    href: "/el-nino/onboarding",
    label: "Farmer Onboarding",
    description: "Batch register cooperatives",
    icon: Tractor,
    testId: "nav-el-nino-onboarding",
  },
  {
    href: "/el-nino/register",
    label: "Register Checkpoint",
    description: "Seal hash on-chain + SQL",
    icon: PackagePlus,
    testId: "nav-el-nino-register",
  },
  {
    href: "/el-nino/logistics",
    label: "Logistics Tracker",
    description: "Aid route provenance · QR",
    icon: Truck,
    testId: "nav-el-nino-logistics",
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
  // Exact match for El Niño overview so child routes don't highlight it.
  if (href === "/el-nino") return pathname === "/el-nino";
  // Keep hubs distinct from nested create / detail routes.
  if (href === "/markets") {
    return (
      pathname === "/markets" ||
      (pathname.startsWith("/markets/") &&
        !pathname.startsWith("/markets/create") &&
        !pathname.startsWith("/markets/portfolio"))
    );
  }
  if (href === "/strategies") {
    return (
      pathname === "/strategies" ||
      (pathname.startsWith("/strategies/") &&
        !pathname.startsWith("/strategies/create"))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavSection({
  title,
  items,
  pathname,
  onNavigate,
  activeClass,
}: {
  title: string;
  items: readonly NavItem[];
  pathname: string;
  onNavigate: () => void;
  activeClass: string;
}) {
  return (
    <div className="space-y-1">
      <p className="mb-1 px-3 font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        {title}
      </p>
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            data-testid={item.testId}
            onClick={onNavigate}
            className={`flex min-h-12 items-start gap-3 rounded-xl px-3 py-2.5 transition ${
              active
                ? activeClass
                : "text-[var(--accent)] hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] hover:text-foreground"
            }`}
          >
            <Icon
              className={`mt-0.5 size-5 shrink-0 ${
                active
                  ? activeClass.includes("sky")
                    ? "text-sky-500"
                    : activeClass.includes("violet")
                      ? "text-violet-500"
                      : "text-primary"
                  : ""
              }`}
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
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  // Open only while pathname matches the route when the drawer was opened —
  // navigating away closes it without a setState-in-effect.
  const [openedForPath, setOpenedForPath] = useState<string | null>(null);
  const mobileOpen = openedForPath === pathname;

  // Prevent background scroll while the mobile drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const closeMobile = () => setOpenedForPath(null);

  const nav = (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-4">
        <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          App switcher
        </p>
        <p className="mt-1 text-sm font-bold text-foreground">ArbiYield AI</p>
        <p className="mt-1 text-[11px] leading-snug text-[var(--muted)]">
          Home showcase · Yield → Markets → El Niño
        </p>
        <Link
          href="/"
          onClick={() => setOpenedForPath(null)}
          data-testid="nav-home"
          className="mt-2 inline-flex text-xs font-bold text-primary hover:underline"
        >
          ← Presentation home
        </Link>
      </div>

      <nav
        aria-label="Modules"
        data-testid="app-sidebar-nav"
        className="flex flex-1 flex-col gap-4 overflow-y-auto p-3"
      >
        <NavSection
          title="1 · Yield"
          items={YIELD_NAV_ITEMS}
          pathname={pathname}
          onNavigate={() => setOpenedForPath(null)}
          activeClass="bg-primary/12 text-foreground ring-1 ring-primary/30"
        />

        <div className="border-t border-border pt-3">
          <NavSection
            title="2 · Markets"
            items={MARKET_NAV_ITEMS}
            pathname={pathname}
            onNavigate={closeMobile}
            activeClass="bg-violet-500/12 text-foreground ring-1 ring-violet-500/35"
          />
        </div>

        <div className="border-t border-border pt-3">
          <NavSection
            title="3 · El Niño Resilience"
            items={EL_NINO_NAV_ITEMS}
            pathname={pathname}
            onNavigate={closeMobile}
            activeClass="bg-sky-500/12 text-foreground ring-1 ring-sky-500/35"
          />
        </div>
      </nav>
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
