"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { useWatchContractEvent } from "wagmi";
import { useDemoStore } from "@/store/useDemoStore";
import {
  ARBISCAN_ADDRESS,
  ARBISCAN_TX,
  EL_NINO_DEMO_PAYOUT_EVENT,
  NINO_CONTRACT_ADDRESS,
  elninoABI,
  formatUsdcFromBaseUnits,
  type ElNinoPayoutEvent,
} from "@/lib/elninoContract";

const ARBITRUM_SEPOLIA_CHAIN_ID = 421_614;

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * Live listener for `PayoutDisbursed` — updates instantly when climate relay pays out.
 */
export function PayoutFeed() {
  const isDemoMode = useDemoStore((s) => s.isDemoMode);
  const [payouts, setPayouts] = useState<ElNinoPayoutEvent[]>([]);

  const prependPayout = useCallback((entry: ElNinoPayoutEvent) => {
    setPayouts((prev) => {
      const key = `${entry.transactionHash ?? ""}-${entry.farmer}-${entry.receivedAt}`;
      if (
        prev.some(
          (p) =>
            `${p.transactionHash ?? ""}-${p.farmer}-${p.receivedAt}` === key,
        )
      ) {
        return prev;
      }
      return [entry, ...prev].slice(0, 40);
    });
  }, []);

  useWatchContractEvent({
    address: NINO_CONTRACT_ADDRESS,
    abi: elninoABI,
    eventName: "PayoutDisbursed",
    chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
    enabled: !isDemoMode,
    onLogs(logs) {
      for (const log of logs) {
        const farmer = log.args.farmer;
        const location = log.args.location;
        const amount = log.args.amount;
        if (!farmer || location === undefined || amount === undefined) continue;
        prependPayout({
          farmer,
          location,
          amount,
          transactionHash: log.transactionHash,
          receivedAt: Date.now(),
        });
      }
    },
  });

  useEffect(() => {
    function onDemoPayout(ev: Event) {
      const detail = (ev as CustomEvent<ElNinoPayoutEvent>).detail;
      if (!detail) return;
      prependPayout(detail);
    }
    window.addEventListener(EL_NINO_DEMO_PAYOUT_EVENT, onDemoPayout);
    return () =>
      window.removeEventListener(EL_NINO_DEMO_PAYOUT_EVENT, onDemoPayout);
  }, [prependPayout]);

  return (
    <section
      data-testid="payout-feed"
      className="flex h-full min-h-[28rem] flex-col rounded-2xl border border-border bg-secondary/70 p-5 shadow-[var(--shadow-soft)]"
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
            Zero-click payouts
          </p>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Live Payout Feed
          </h2>
        </div>
        <span
          data-testid="payout-feed-live"
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-emerald-500/35 dark:text-emerald-300"
        >
          <span className="relative flex size-2" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Live Listening
        </span>
      </header>

      {payouts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/40 px-4 py-10 text-center">
          <p className="text-sm font-semibold text-foreground">
            Waiting for PayoutDisbursed…
          </p>
          <p className="mt-1 max-w-sm text-xs text-[var(--muted)]">
            Push rainfall ≥ 50mm for an active location. Confirmed events appear
            here with Arbiscan links — no page refresh.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[20rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                <th className="px-2 py-2 font-semibold">Farmer</th>
                <th className="px-2 py-2 font-semibold">Location</th>
                <th className="px-2 py-2 font-semibold">Amount</th>
                <th className="px-2 py-2 font-semibold">Tx</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout, index) => (
                <tr
                  key={`${payout.transactionHash ?? "demo"}-${payout.farmer}-${payout.receivedAt}`}
                  data-testid={`payout-row-${index}`}
                  className="border-b border-border/70 bg-emerald-500/[0.04] transition"
                >
                  <td className="px-2 py-3">
                    <a
                      href={`${ARBISCAN_ADDRESS}/${payout.farmer}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-foreground hover:text-sky-600 hover:underline"
                    >
                      {shortAddress(payout.farmer)}
                      <ExternalLink className="size-3" aria-hidden />
                    </a>
                  </td>
                  <td className="px-2 py-3 font-semibold text-foreground">
                    {payout.location}
                  </td>
                  <td className="px-2 py-3 font-extrabold tabular-nums text-emerald-700 dark:text-emerald-300">
                    {formatUsdcFromBaseUnits(payout.amount)} USDC
                  </td>
                  <td className="px-2 py-3">
                    {payout.transactionHash ? (
                      <a
                        href={`${ARBISCAN_TX}/${payout.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline dark:text-sky-300"
                      >
                        Arbiscan
                        <ExternalLink className="size-3" aria-hidden />
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--muted)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
