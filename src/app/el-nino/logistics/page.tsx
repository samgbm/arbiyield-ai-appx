"use client";

import { Suspense, useCallback, useState } from "react";
import {
  LogisticsScanner,
  type LogisticsScanResult,
} from "@/components/elnino/LogisticsScanner";
import { ProvenanceTimeline } from "@/components/elnino/ProvenanceTimeline";
import { NINO_CONTRACT_ADDRESS } from "@/lib/elninoContract";

function LogisticsTrackerBody() {
  const [result, setResult] = useState<LogisticsScanResult | null>(null);
  const onResult = useCallback((next: LogisticsScanResult | null) => {
    setResult(next);
  }, []);

  const hasOnChainData =
    result != null &&
    (result.onChain.location.length > 0 || result.onChain.timestamp > BigInt(0));

  return (
    <>
      <LogisticsScanner onResult={onResult} />
      {hasOnChainData && result ? (
        <ProvenanceTimeline
          batchHash={result.batchHash}
          onChain={result.onChain}
          checkpoints={result.checkpoints}
          productName={result.productName}
          originFarm={result.originFarm}
          tipTxHash={result.tipTxHash}
        />
      ) : null}
    </>
  );
}

/**
 * Walkthrough 1 — Immutable Aid Provenance Tracker.
 */
export default function ElNinoLogisticsPage() {
  return (
    <div className="hero-wash" data-testid="el-nino-logistics-page">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-8 space-y-3">
          <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
            El Niño · Walkthrough 1
          </p>
          <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            Immutable Aid Provenance Tracker
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--accent)] sm:text-base">
            Scan a checkpoint hash to prove aid was not stolen or diverted.
            Readable logistics live in Supabase; Stylus on Arbitrum is the
            notary that seals every stop in the chain.
          </p>
          <a
            href={`https://sepolia.arbiscan.io/address/${NINO_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-xs font-semibold text-sky-700 hover:underline dark:text-sky-300"
          >
            Contract {NINO_CONTRACT_ADDRESS.slice(0, 10)}… on Arbiscan
          </a>
        </header>

        <div className="space-y-6">
          <Suspense
            fallback={
              <div className="h-40 animate-pulse rounded-2xl border border-border bg-secondary/50" />
            }
          >
            <LogisticsTrackerBody />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
