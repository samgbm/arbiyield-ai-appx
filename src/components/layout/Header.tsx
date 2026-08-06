"use client";

import Link from "next/link";
import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Menu, X } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/strategies", label: "Strategies" },
  { href: "/docs", label: "Docs" },
] as const;

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

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
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
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
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-12 items-center rounded-xl px-3 text-base font-semibold text-foreground transition hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
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
