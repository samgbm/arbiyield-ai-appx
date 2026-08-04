"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, Monitor, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import {
  THEME_META,
  THEME_OPTIONS,
  type ThemeOption,
} from "@/lib/themes";

function subscribe() {
  return () => {};
}

/** Fixed footprint so SSR → client theme resolution does not shift the header. */
function ThemeSwitcherSkeleton() {
  return (
    <div
      className="inline-flex h-10 w-[8.75rem] items-center gap-2 rounded-xl border border-border bg-secondary px-3"
      aria-hidden
      data-testid="theme-switcher-skeleton"
    >
      <span className="size-4 shrink-0 rounded animate-pulse-soft bg-[color-mix(in_oklab,var(--muted)_40%,transparent)]" />
      <span className="hidden h-3 flex-1 rounded animate-pulse-soft bg-[color-mix(in_oklab,var(--muted)_35%,transparent)] sm:block" />
    </div>
  );
}

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!mounted) {
    return <ThemeSwitcherSkeleton />;
  }

  const current = (theme ?? "system") as ThemeOption;
  const meta = THEME_META[current] ?? THEME_META.system;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-[8.75rem] items-center gap-2 rounded-xl border border-border bg-secondary px-3 text-sm font-medium text-foreground transition hover:border-[color-mix(in_oklab,var(--primary)_40%,var(--border))]"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Theme: ${meta.label}`}
      >
        {current === "system" ? (
          <Monitor className="size-4 shrink-0 text-primary" />
        ) : (
          <Palette className="size-4 shrink-0 text-primary" />
        )}
        <span className="truncate">{meta.label}</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close theme menu"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label="Choose theme"
            className="absolute right-0 z-50 mt-2 max-h-[min(24rem,70vh)] w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-border bg-secondary p-3 shadow-[var(--shadow-soft)] animate-fade"
          >
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              Themes · Light / Dim / Dark / Auto
            </p>
            <div className="grid grid-cols-1 gap-1">
              {THEME_OPTIONS.map((name) => {
                const item = THEME_META[name];
                const active = current === name;
                const isSystem = name === "system";
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setTheme(name);
                      setOpen(false);
                    }}
                    className={`flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${
                      active
                        ? "bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]"
                        : "hover:bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)]"
                    }`}
                  >
                    <span
                      className="size-7 shrink-0 rounded-lg border border-border"
                      style={{ background: item.swatch }}
                      title={
                        isSystem
                          ? `Resolved: ${resolvedTheme ?? "…"}`
                          : item.label
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground">
                        {item.label}
                      </span>
                      <span className="block truncate text-xs text-[var(--accent)]">
                        {item.description}
                      </span>
                    </span>
                    {active && <Check className="size-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
