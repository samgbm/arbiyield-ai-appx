"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  Database,
  Link2,
  RefreshCw,
} from "lucide-react";
import type { HealthReport, ServiceCheckResult } from "@/lib/healthChecks";

async function fetchHealth(): Promise<HealthReport> {
  const res = await fetch("/api/health", { cache: "no-store" });
  const body = (await res.json()) as HealthReport;
  return body;
}

function ServiceCard({
  title,
  icon: Icon,
  check,
  okLabel,
}: {
  title: string;
  icon: typeof Database;
  check?: ServiceCheckResult;
  okLabel: string;
}) {
  const isOk = check?.status === "ok";
  const isLoading = !check;

  return (
    <article
      data-testid={`health-card-${title.toLowerCase()}`}
      className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0b1220] p-5 shadow-[0_0_28px_rgba(34,211,238,0.06)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,0.08),transparent_55%)]"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-slate-900 ring-1 ring-slate-700">
            <Icon className="size-5 text-cyan-300" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-100">
              {title}
            </h2>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
              Dependency probe
            </p>
          </div>
        </div>

        {isLoading ? (
          <RefreshCw className="size-4 animate-spin text-slate-500" aria-hidden />
        ) : isOk ? (
          <span className="relative flex size-3" aria-label="ok">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
          </span>
        ) : (
          <AlertTriangle
            className="size-5 animate-pulse text-rose-400"
            aria-label="error"
          />
        )}
      </div>

      <div className="relative mt-5 space-y-2">
        {isLoading ? (
          <p className="text-sm text-slate-400">Checking…</p>
        ) : isOk ? (
          <>
            <p
              data-testid="health-ok-label"
              className="text-sm font-semibold text-emerald-300"
            >
              {okLabel} — {check.latencyMs}ms
            </p>
            {check.detail ? (
              <p className="font-mono text-xs text-slate-500">{check.detail}</p>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-rose-300">
              Unreachable — {check?.latencyMs ?? 0}ms
            </p>
            <p
              data-testid="health-error"
              className="break-words text-xs leading-relaxed text-rose-200/80"
            >
              {check?.error ?? "Unknown failure"}
            </p>
          </>
        )}
      </div>
    </article>
  );
}

/**
 * Pre-demo diagnostic dashboard — Database / Blockchain / AI.
 */
export default function HealthPage() {
  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["system-health"],
    queryFn: fetchHealth,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const overallOk = data?.status === "ok";

  return (
    <div className="min-h-full bg-[#070b14] text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6 sm:py-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-400/80">
              <Activity className="size-3.5" aria-hidden />
              System diagnostics
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              System Status
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-400">
              Live probes against Supabase, Arbitrum Sepolia RPC, and OpenAI —
              run this before a judge demo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              data-testid="health-overall"
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                isLoading
                  ? "bg-slate-800 text-slate-400"
                  : overallOk
                    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40"
                    : "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/40"
              }`}
            >
              {isLoading
                ? "Probing…"
                : overallOk
                  ? "All systems go"
                  : "Degraded"}
            </span>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/40 disabled:opacity-60"
            >
              <RefreshCw
                className={`size-4 ${isFetching ? "animate-spin" : ""}`}
                aria-hidden
              />
              Refresh
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ServiceCard
            title="Database"
            icon={Database}
            check={data?.services.database}
            okLabel="Database Connected"
          />
          <ServiceCard
            title="Blockchain"
            icon={Link2}
            check={data?.services.blockchain}
            okLabel="RPC Connected"
          />
          <ServiceCard
            title="AI"
            icon={BrainCircuit}
            check={data?.services.ai}
            okLabel="AI Provider Connected"
          />
        </div>

        {dataUpdatedAt ? (
          <p className="font-mono text-[11px] text-slate-600">
            Last checked {new Date(dataUpdatedAt).toLocaleTimeString()}
            {data?.timestamp ? ` · server ${data.timestamp}` : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}
