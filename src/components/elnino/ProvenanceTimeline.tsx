"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Factory,
  MapPin,
  ShieldCheck,
  Store,
  Truck,
  Warehouse,
} from "lucide-react";
import {
  formatAidTimestamp,
  type AidCheckpointRow,
  type AidStepType,
  type OnChainAidBatch,
} from "@/lib/aidProvenance";
import { ARBISCAN_ADDRESS, ARBISCAN_TX, NINO_CONTRACT_ADDRESS } from "@/lib/elninoContract";

const STEP_ICON: Record<AidStepType, typeof MapPin> = {
  farm: MapPin,
  factory: Factory,
  depot: Warehouse,
  store: Store,
};

function stepLabel(type: AidStepType): string {
  switch (type) {
    case "farm":
      return "Source / Farm";
    case "factory":
      return "Processing Plant";
    case "depot":
      return "Distribution Depot";
    case "store":
      return "Store / Last Mile";
  }
}

type Props = {
  onChain: OnChainAidBatch;
  /** Optional full off-chain chain (Supabase). Falls back to tip-only node. */
  checkpoints?: AidCheckpointRow[];
  batchHash: `0x${string}`;
  productName?: string | null;
  originFarm?: string | null;
  tipTxHash?: string | null;
};

/**
 * Vertical cryptographic audit trail for an aid shipment tip hash.
 */
export function ProvenanceTimeline({
  onChain,
  checkpoints = [],
  batchHash,
  productName,
  originFarm,
  tipTxHash,
}: Props) {
  const flagged = onChain.isFlagged;
  const hasChain = checkpoints.length > 0;
  const notaryStamp = `${onChain.location || "—"} · ${formatAidTimestamp(onChain.timestamp)} UTC`;

  return (
    <section
      data-testid="provenance-timeline"
      className="rounded-2xl border border-border bg-secondary/70 p-5 shadow-[var(--shadow-soft)]"
    >
      <header className="mb-6 space-y-2">
        <p className="font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
          Cryptographic Audit Trail
        </p>
        {productName ? (
          <h2
            data-testid="provenance-product-name"
            className="text-2xl font-extrabold tracking-tight text-foreground"
          >
            {productName}
          </h2>
        ) : (
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Shipment Provenance
          </h2>
        )}
        {originFarm ? (
          <p className="text-sm text-[var(--accent)]">Origin · {originFarm}</p>
        ) : null}
        <p className="break-all font-mono text-[11px] text-[var(--muted)]">
          Tip hash {batchHash}
        </p>
      </header>

      {flagged ? (
        <div
          data-testid="provenance-compromised"
          className="relative mb-6 overflow-hidden rounded-2xl border-2 border-red-500/50 bg-gradient-to-br from-red-500/20 via-background to-orange-500/10 p-5"
        >
          <div className="flex items-start gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full border-4 border-red-500 bg-red-500/20 text-red-600 dark:text-red-400">
              <AlertTriangle className="size-8" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-700 dark:text-red-300">
                Arbitrum Sepolia · Stylus notary
              </p>
              <p className="text-lg font-extrabold text-red-700 dark:text-red-300">
                Compromised / Deviated
              </p>
              <p className="text-sm font-semibold text-foreground">
                Stylus notary: {notaryStamp}
              </p>
              <p className="text-xs leading-relaxed text-red-800/90 dark:text-red-200/90">
                Live <code className="font-mono">verifyAidBatch</code> returned{" "}
                <code className="font-mono">is_flagged = true</code>. This is
                an on-chain flag — not a database-only warning.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div
          data-testid="provenance-verified-banner"
          className="relative mb-6 overflow-hidden rounded-2xl border-2 border-emerald-500/55 bg-gradient-to-br from-emerald-500/20 via-background to-sky-500/15 p-5 shadow-[0_0_40px_rgba(16,185,129,0.18)]"
        >
          <div
            className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full border-2 border-emerald-500/25 opacity-60"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-2 top-2 size-16 rotate-12 rounded-full border border-dashed border-emerald-500/40"
            aria-hidden
          />

          <div className="flex items-start gap-4">
            <div className="relative flex size-16 shrink-0 items-center justify-center rounded-full border-4 border-emerald-500 bg-emerald-500/25 text-emerald-700 shadow-[0_0_24px_rgba(16,185,129,0.45)] dark:text-emerald-300">
              <ShieldCheck className="size-8" aria-hidden />
              <CheckCircle2
                className="absolute -bottom-1 -right-1 size-5 rounded-full bg-background text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-300">
                Arbitrum Sepolia · Stylus notary
              </p>
              <p className="text-xl font-extrabold tracking-tight text-emerald-800 dark:text-emerald-200">
                Verified on Arbitrum
              </p>
              <p
                data-testid="stylus-notary-line"
                className="text-sm font-semibold text-foreground"
              >
                Stylus notary: {notaryStamp}
              </p>
              <p className="text-xs leading-relaxed text-[var(--muted)]">
                Proof source: live RPC{" "}
                <code className="font-mono text-[11px]">verifyAidBatch</code>{" "}
                on contract{" "}
                <code className="font-mono text-[11px]">
                  {NINO_CONTRACT_ADDRESS.slice(0, 10)}…
                </code>
                . Supabase only enriches the readable timeline — the seal is
                on-chain.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={`${ARBISCAN_ADDRESS}/${NINO_CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-900 hover:underline dark:text-emerald-200"
                >
                  Contract on Arbiscan
                  <ExternalLink className="size-3" aria-hidden />
                </a>
                {tipTxHash ? (
                  <a
                    href={`${ARBISCAN_TX}/${tipTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-sky-500/35 bg-sky-500/10 px-2.5 py-1.5 text-[11px] font-bold text-sky-900 hover:underline dark:text-sky-200"
                  >
                    Notarization tx
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      <ol className="space-y-0" data-testid="provenance-steps">
        {hasChain ? (
          checkpoints.map((step, index) => {
            const Icon = STEP_ICON[step.step_type] ?? Truck;
            const isLast = index === checkpoints.length - 1;
            const stopHere = flagged && isLast;

            return (
              <li
                key={step.step_hash}
                data-testid={`provenance-step-${step.step_index}`}
                className="flex gap-4"
              >
                <div className="flex w-8 shrink-0 flex-col items-center">
                  <span
                    className={`flex size-8 items-center justify-center rounded-full border-2 bg-background ${
                      stopHere
                        ? "border-red-500 text-red-600"
                        : "border-emerald-500 text-emerald-600"
                    }`}
                  >
                    {stopHere ? (
                      <AlertTriangle className="size-4" aria-hidden />
                    ) : (
                      <Icon className="size-4" aria-hidden />
                    )}
                  </span>
                  {!isLast ? (
                    <span
                      className="mt-1 w-0.5 flex-1 min-h-8 bg-sky-500/35"
                      aria-hidden
                    />
                  ) : null}
                </div>

                <div className={`min-w-0 flex-1 space-y-1 ${isLast ? "" : "pb-8"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-foreground">
                      {stepLabel(step.step_type)}
                    </p>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        stopHere
                          ? "bg-red-500/15 text-red-700 dark:text-red-300"
                          : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                      }`}
                    >
                      {stopHere ? "Deviated" : "Verified"}
                    </span>
                  </div>
                  <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <MapPin className="size-3.5 shrink-0 text-sky-600" aria-hidden />
                    {step.location_name}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Arrived{" "}
                    {new Intl.DateTimeFormat("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "UTC",
                    }).format(new Date(step.arrived_at))}{" "}
                    UTC
                    {step.facility_id ? ` · ${step.facility_id}` : ""}
                    {step.temperature_c != null
                      ? ` · ${step.temperature_c}°C`
                      : ""}
                    {step.batch_weight_kg != null
                      ? ` · ${step.batch_weight_kg} kg`
                      : ""}
                  </p>
                  <p className="break-all font-mono text-[10px] text-[var(--muted)]">
                    Hash {step.step_hash}
                    {step.parent_hash
                      ? ` · parent ${step.parent_hash.slice(0, 10)}…`
                      : " · genesis"}
                  </p>
                  {step.tx_hash ? (
                    <a
                      href={`${ARBISCAN_TX}/${step.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:underline dark:text-sky-300"
                    >
                      Arbiscan tx
                      <ExternalLink className="size-3" aria-hidden />
                    </a>
                  ) : null}
                  {stopHere ? (
                    <p className="mt-2 text-xs font-semibold text-red-700 dark:text-red-300">
                      Chain halted — further stops are not trusted.
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })
        ) : (
          <li data-testid="provenance-step-tip" className="flex gap-4">
            <div className="flex w-8 shrink-0 flex-col items-center">
              <span
                className={`flex size-8 items-center justify-center rounded-full border-2 bg-background ${
                  flagged
                    ? "border-red-500 text-red-600"
                    : "border-emerald-500 text-emerald-600"
                }`}
              >
                {flagged ? (
                  <AlertTriangle className="size-4" aria-hidden />
                ) : (
                  <CheckCircle2 className="size-4" aria-hidden />
                )}
              </span>
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-bold text-foreground">
                {onChain.location || "Unknown location"}
              </p>
              <p className="text-xs text-[var(--muted)]">
                Notarized {formatAidTimestamp(onChain.timestamp)} UTC
              </p>
            </div>
          </li>
        )}
      </ol>
    </section>
  );
}
