"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronDown, Menu, ShieldCheck, X } from "lucide-react";
import { DemoModeToggle } from "@/components/layout/DemoModeToggle";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

const CREATE_LINKS = [
  {
    href: "/strategies/create",
    label: "Yield strategy",
    description: "AI generator · Stylus",
  },
  {
    href: "/markets/create",
    label: "Prediction market",
    description: "MeleePMM deploy card",
  },
] as const;

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [mobileCreateOpen, setMobileCreateOpen] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!createOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!createRef.current?.contains(event.target as Node)) {
        setCreateOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setCreateOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [createOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[color-mix(in_oklab,var(--secondary)_92%,transparent)] pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 pl-14 sm:h-16 sm:px-6 md:pl-6">
        <Link
          href="/"
          className="flex min-h-11 min-w-0 shrink-0 items-center gap-2"
          onClick={() => setMenuOpen(false)}
        >
          <span
            aria-hidden
            className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-extrabold text-primary-foreground shadow-sm"
          >
            AY
          </span>
          <span className="truncate font-display text-xl tracking-tight text-foreground sm:text-[1.35rem]">
            ArbiYield AI
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="ml-6 hidden items-center gap-1 md:flex"
        >
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] hover:text-foreground"
          >
            Home
          </Link>

          <div ref={createRef} className="relative">
            <button
              type="button"
              data-testid="header-create-menu"
              aria-expanded={createOpen}
              aria-haspopup="menu"
              onClick={() => setCreateOpen((open) => !open)}
              className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] hover:text-foreground"
            >
              Create
              <ChevronDown
                className={`size-4 transition ${createOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {createOpen ? (
              <div
                role="menu"
                data-testid="header-create-submenu"
                className="absolute left-0 top-full z-50 mt-1 min-w-[14rem] rounded-xl border border-border bg-secondary p-1.5 shadow-[var(--shadow-soft)]"
              >
                {CREATE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    onClick={() => setCreateOpen(false)}
                    className="block rounded-lg px-3 py-2.5 transition hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]"
                  >
                    <span className="block text-sm font-semibold text-foreground">
                      {link.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--muted)]">
                      {link.description}
                    </span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <Link
            href="/el-nino/funding"
            data-testid="header-fund"
            className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] hover:text-foreground"
          >
            Fund
          </Link>

          <Link
            href="/docs"
            data-testid="header-docs"
            className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] hover:text-foreground"
          >
            API Docs
          </Link>

          <Link
            href="/health"
            data-testid="header-system-status"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] hover:text-foreground"
          >
            <ShieldCheck className="size-4" aria-hidden />
            System Status
          </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <DemoModeToggle />

          <div className="hidden sm:block">
            <ThemeSwitcher />
          </div>

          <div className="flex items-center [&_button]:min-h-10">
            <ConnectButton
              chainStatus="icon"
              accountStatus={{
                smallScreen: "avatar",
                largeScreen: "full",
              }}
              showBalance={{
                smallScreen: false,
                largeScreen: true,
              }}
            />
          </div>

          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-secondary text-foreground md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="mobile-nav"
          className="border-t border-border bg-secondary px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center rounded-xl px-3 text-base font-semibold text-foreground transition hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>

            <button
              type="button"
              aria-expanded={mobileCreateOpen}
              onClick={() => setMobileCreateOpen((open) => !open)}
              className="inline-flex min-h-12 items-center justify-between rounded-xl px-3 text-base font-semibold text-foreground transition hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]"
            >
              Create
              <ChevronDown
                className={`size-4 transition ${mobileCreateOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {mobileCreateOpen ? (
              <div className="mb-1 ml-2 space-y-1 border-l border-border pl-3">
                {CREATE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-xl px-3 py-2.5 transition hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="block text-sm font-semibold text-foreground">
                      {link.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--muted)]">
                      {link.description}
                    </span>
                  </Link>
                ))}
              </div>
            ) : null}

            <Link
              href="/el-nino/funding"
              className="inline-flex min-h-12 items-center rounded-xl px-3 text-base font-semibold text-foreground transition hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]"
              onClick={() => setMenuOpen(false)}
            >
              Fund
            </Link>

            <Link
              href="/docs"
              className="inline-flex min-h-12 items-center rounded-xl px-3 text-base font-semibold text-foreground transition hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]"
              onClick={() => setMenuOpen(false)}
            >
              API Docs
            </Link>

            <Link
              href="/health"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl px-3 text-base font-semibold text-foreground transition hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]"
              onClick={() => setMenuOpen(false)}
            >
              <ShieldCheck className="size-4" aria-hidden />
              System Status
            </Link>
          </nav>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Demo
            </span>
            <DemoModeToggle />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 sm:hidden">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Theme
            </span>
            <ThemeSwitcher />
          </div>
        </div>
      )}
    </header>
  );
}
