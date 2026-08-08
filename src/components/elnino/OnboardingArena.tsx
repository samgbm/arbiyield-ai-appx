"use client";

import Link from "next/link";
import { useReadContract } from "wagmi";
import {
  Flame,
  HeartHandshake,
  Shield,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { NINO_CONTRACT_ADDRESS, ninoAbi } from "@/config/contracts";
import { formatEthFromWei } from "@/lib/elninoContract";
import { useDemoStore } from "@/store/useDemoStore";

const ARBITRUM_SEPOLIA_CHAIN_ID = 421_614;

type Props = {
  /** Farmers in the current batch form (live XP meter). */
  batchSize: number;
  /** Sum of coverage ETH typed in the form. */
  coverageEthTotal: number;
};

/**
 * Gamified chrome around farmer onboarding — drives urgency + donation FOMO.
 */
export function OnboardingArena({ batchSize, coverageEthTotal }: Props) {
  const isDemoMode = useDemoStore((s) => s.isDemoMode);

  const { data: stats } = useReadContract({
    address: NINO_CONTRACT_ADDRESS,
    abi: ninoAbi,
    functionName: "getPoolStats",
    chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
    query: { enabled: !isDemoMode, refetchInterval: 15_000 },
  });

  const poolEth = isDemoMode
    ? 0.42
    : Number(formatEthFromWei(stats?.[2] ?? BigInt(0), 4));
  const donorCount = isDemoMode ? 12 : Number(stats?.[3] ?? BigInt(0));

  const impactXp = batchSize * 120 + Math.round(coverageEthTotal * 1000);
  const level = Math.max(1, Math.floor(impactXp / 500) + 1);
  const levelProgress = impactXp % 500;
  const levelPct = Math.min(100, (levelProgress / 500) * 100);
  const comboLabel =
    batchSize >= 10
      ? "Mega Co-op Combo"
      : batchSize >= 5
        ? "Squad Boost"
        : batchSize >= 2
          ? "Dual Shield"
          : "First Seed";

  const poolCoverRatio =
    coverageEthTotal > 0 ? Math.min(100, (poolEth / coverageEthTotal) * 100) : 0;

  return (
    <section
      data-testid="onboarding-arena"
      className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-secondary/80 to-sky-500/10 p-5 shadow-[var(--shadow-soft)] sm:p-6"
    >
      <Trophy
        className="pointer-events-none absolute -right-3 -top-3 size-28 text-amber-500/10"
        aria-hidden
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
            Cooperative Quest
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
            Armor the coast before the flood
          </h2>
          <p className="mt-2 max-w-xl text-sm text-[var(--accent)]">
            Every farmer you register is a claim on the crowdfunded ETH pool.
            Hit the batch streak, climb Impact Levels, and pull global donors
            into the fight against coastal El Niño.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/15 px-4 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-200">
            Impact Level
          </p>
          <p className="text-3xl font-black tabular-nums text-foreground">
            {level}
          </p>
          <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-200">
            {impactXp} XP
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-[11px] font-semibold">
          <span className="text-[var(--muted)]">Next level</span>
          <span className="tabular-nums">{levelProgress}/500 XP</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-background/70 ring-1 ring-amber-500/25">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500"
            style={{ width: `${levelPct}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric
          icon={Users}
          label="Batch size"
          value={String(batchSize)}
          hint={comboLabel}
        />
        <Metric
          icon={Shield}
          label="Coverage queued"
          value={`${coverageEthTotal.toFixed(3)} ETH`}
          hint="Paid from pool on ≥50mm"
        />
        <Metric
          icon={HeartHandshake}
          label="Pool ready"
          value={`${poolEth.toFixed(3)} ETH`}
          hint={`${donorCount} donors`}
        />
        <Metric
          icon={Target}
          label="Pool cover"
          value={`${poolCoverRatio.toFixed(0)}%`}
          hint={
            poolCoverRatio >= 100
              ? "Fully backed"
              : "Call donors to top up"
          }
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
          <Flame className="size-4 text-orange-500" aria-hidden />
          Streak tip: register 5+ farmers in one tx for Squad Boost XP.
        </p>
        <Link
          href="/el-nino/funding"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-extrabold text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:brightness-110"
        >
          Rally donors → Funding pool
        </Link>
      </div>

      {coverageEthTotal > 0 && poolEth + 1e-9 < coverageEthTotal ? (
        <p
          data-testid="pool-shortfall-banner"
          className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-900 dark:text-amber-100"
        >
          Shortfall risk: this batch needs ~{coverageEthTotal.toFixed(3)} ETH
          of coverage but the pool shows ~{poolEth.toFixed(3)} ETH. Share the{" "}
          <Link href="/el-nino/funding" className="underline">
            funding page
          </Link>{" "}
          so donors can top up before the next storm.
        </p>
      ) : null}
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/55 px-3 py-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </div>
      <p className="mt-1 text-lg font-extrabold tabular-nums text-foreground">
        {value}
      </p>
      <p className="text-[11px] font-semibold text-[var(--accent)]">{hint}</p>
    </div>
  );
}
