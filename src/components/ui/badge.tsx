import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning";
}) {
  const tones = {
    neutral:
      "bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] text-[var(--accent)] border-border",
    accent:
      "bg-[color-mix(in_oklab,var(--primary)_16%,transparent)] text-primary border-[color-mix(in_oklab,var(--primary)_30%,var(--border))]",
    success:
      "bg-[color-mix(in_oklab,var(--success)_14%,transparent)] text-[var(--success)] border-[color-mix(in_oklab,var(--success)_28%,var(--border))]",
    warning:
      "bg-[color-mix(in_oklab,var(--warning)_14%,transparent)] text-[var(--warning)] border-[color-mix(in_oklab,var(--warning)_28%,var(--border))]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
