"use client";

import Link from "next/link";
import { Bot } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-[color-mix(in_oklab,var(--secondary)_92%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Bot className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="font-display block text-[1.35rem] tracking-tight text-foreground">
              ArbiYield AI
            </span>
            <span className="-mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Stylus · Generative Yield
            </span>
          </span>
        </Link>
        <div className="ml-auto">
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
