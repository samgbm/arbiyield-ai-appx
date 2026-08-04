"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { THEMES, THEME_META, type ThemeName } from "@/lib/themes";

function subscribe() {
  return () => {};
}

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
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

  const current = (mounted ? theme : "light") as ThemeName;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-secondary px-3 text-sm font-medium text-foreground transition hover:border-[color-mix(in_oklab,var(--primary)_40%,var(--border))]"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Palette className="size-4 text-primary" />
        <span className="hidden sm:inline">
          {mounted ? THEME_META[current]?.label ?? "Theme" : "Theme"}
        </span>
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
            className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-border bg-secondary p-3 shadow-[var(--shadow-soft)] animate-fade"
          >
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              11 themes
            </p>
            <div className="grid grid-cols-1 gap-1">
              {THEMES.map((name) => {
                const meta = THEME_META[name];
                const active = current === name;
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
                      style={{ background: meta.swatch }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground">
                        {meta.label}
                      </span>
                      <span className="block truncate text-xs text-[var(--accent)]">
                        {meta.description}
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
