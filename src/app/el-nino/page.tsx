import Link from "next/link";
import {
  ArrowRight,
  CloudRain,
  HeartHandshake,
  PackagePlus,
  Tractor,
  Truck,
} from "lucide-react";
import { NINO_CONTRACT_ADDRESS } from "@/lib/elninoContract";

const STEPS = [
  {
    n: "01",
    href: "/el-nino/funding",
    title: "Fund the relief pool",
    blurb:
      "Crowdfund real ETH on Arbitrum. Near-zero L2 fees mean almost every wei reaches coastal cooperatives.",
    icon: HeartHandshake,
    cta: "Open Relief Funding",
  },
  {
    n: "02",
    href: "/el-nino/onboarding",
    title: "Onboard farmers",
    blurb:
      "Batch-register parametric policies with ETH coverage. Gamified quests push co-ops to armor before the flood.",
    icon: Tractor,
    cta: "Start Cooperative Quest",
  },
  {
    n: "03",
    href: "/el-nino/register",
    title: "Seal aid checkpoints",
    blurb:
      "Each logistics stop creates a chained keccak hash — farm → factory → depot → store — notarized on Stylus.",
    icon: PackagePlus,
    cta: "Register Checkpoint",
  },
  {
    n: "04",
    href: "/el-nino/logistics",
    title: "Track provenance",
    blurb:
      "Scan a tip hash to prove aid wasn’t diverted. Live verifyAidBatch is the notary; Supabase is the readable trail.",
    icon: Truck,
    cta: "Open Logistics Tracker",
  },
  {
    n: "05",
    href: "/el-nino/oracle",
    title: "Trigger zero-click payouts",
    blurb:
      "When rainfall ≥ 50mm, the Climate Relayer disburses ETH from the pool to active farmers — no banking delay.",
    icon: CloudRain,
    cta: "Open Oracle Dashboard",
  },
] as const;

/**
 * El Niño module landing — awareness, mission, and demo walkthrough guide.
 */
export default function ElNinoOverviewPage() {
  return (
    <div className="hero-wash" data-testid="el-nino-overview-page">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="space-y-4">
          <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
            El Niño Climate Resilience
          </p>
          <h1 className="font-display max-w-3xl text-3xl tracking-tight text-foreground sm:text-5xl">
            Climate-triggered aid for coastal Peru — proven on Arbitrum Stylus
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--accent)] sm:text-base">
            Coastal El Niño floods destroy harvests and divert emergency
            shipments. This module crowdfunds ETH, registers farmers, seals an
            unbroken logistics hash chain, and pays out automatically when
            rainfall clears a transparent flood threshold — all with L2 finality
            and public Arbiscan proofs.
          </p>
          <a
            href={`https://sepolia.arbiscan.io/address/${NINO_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-xs font-semibold text-sky-700 hover:underline dark:text-sky-300"
          >
            Live contract {NINO_CONTRACT_ADDRESS.slice(0, 10)}… on Arbiscan
          </a>
        </header>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <AwarenessCard
            title="Why it matters"
            body="Parametric cover + crowdfunded ETH reaches cooperatives in minutes, not weeks of banking rails."
          />
          <AwarenessCard
            title="What’s on-chain"
            body="Relief pool balance, farmer policies, checkpoint hashes, and zero-click ETH transfers — notary-grade."
          />
          <AwarenessCard
            title="What’s off-chain"
            body="Human-readable logistics (farm names, temps, weights) in Supabase, always bound to the tip hash."
          />
        </section>

        <section className="mt-12 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
                Live demo walkthrough
              </p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
                Five steps to tell the story
              </h2>
            </div>
            <Link
              href="/el-nino/funding"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-extrabold text-white hover:brightness-110"
            >
              Start at Funding
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <ol className="space-y-3">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.href}
                  data-testid={`el-nino-step-${step.n}`}
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-secondary/70 p-4 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:p-5"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 font-mono text-sm font-bold text-sky-700 dark:text-sky-300">
                    {step.n}
                  </div>
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-sky-500/35 bg-background text-sky-600">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--accent)]">
                      {step.blurb}
                    </p>
                  </div>
                  <Link
                    href={step.href}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-sky-500/35 bg-sky-500/10 px-4 text-sm font-bold text-sky-800 dark:text-sky-200"
                  >
                    {step.cta}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}

function AwarenessCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-sky-500/25 bg-sky-500/5 p-4">
      <h3 className="text-sm font-extrabold text-foreground">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-[var(--accent)] sm:text-sm">
        {body}
      </p>
    </div>
  );
}
