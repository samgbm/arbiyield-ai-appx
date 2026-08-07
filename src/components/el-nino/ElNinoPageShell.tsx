/**
 * Shared shell chrome for El Niño Climate Resilience stub pages (Increment 1).
 */
export function ElNinoPageShell({
  eyebrow,
  title,
  description,
  testId,
}: {
  eyebrow: string;
  title: string;
  description: string;
  testId: string;
}) {
  return (
    <div className="hero-wash" data-testid={testId}>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--accent)] sm:text-base">
          {description}
        </p>
        <div className="mt-8 rounded-2xl border border-dashed border-sky-500/35 bg-sky-500/5 px-4 py-6 text-sm text-[var(--muted)]">
          Scaffold ready — Walkthrough UI lands in later increments.
        </div>
      </div>
    </div>
  );
}
