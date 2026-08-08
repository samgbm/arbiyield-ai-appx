import { BatchOnboardForm } from "@/components/elnino/BatchOnboardForm";

/**
 * Walkthrough 2 — Gamified pre-El Niño farmer batch onboarding.
 */
export default function ElNinoOnboardingPage() {
  return (
    <div className="hero-wash" data-testid="el-nino-onboarding-page">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-8 space-y-3">
          <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
            El Niño · Walkthrough 2
          </p>
          <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            Cooperative Quest — Armor Farmers Before the Flood
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--accent)] sm:text-base">
            Batch-register smallholders with ETH coverage backed by the global
            crowdfunding pool. Climb Impact Levels, stack combo bonuses, and
            pull donors in so zero-click payouts never run dry when rainfall
            clears 50mm.
          </p>
        </header>

        <BatchOnboardForm />
      </div>
    </div>
  );
}
