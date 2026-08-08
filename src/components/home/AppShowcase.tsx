"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, LoaderCircle } from "lucide-react";
import {
  createPublicClient,
  http,
  parseAbiItem,
  type Log,
} from "viem";
import { arbitrumSepolia } from "viem/chains";
import {
  ARBISCAN_ADDRESS,
  ARBISCAN_TX,
  NINO_CONTRACT_ADDRESS,
  PMM_CONTRACT_ADDRESS,
  YIELD_CONTRACT_ADDRESS,
} from "@/lib/contractAddresses";

type TxRow = {
  hash: `0x${string}`;
  label: string;
  blockNumber: bigint;
};

type AppCard = {
  key: string;
  title: string;
  tagline: string;
  href: string;
  address: `0x${string}`;
  accent: string;
};

const APPS: AppCard[] = [
  {
    key: "yield",
    title: "Yield Strategies",
    tagline:
      "AI-generated sleeves notarized on Stylus — id + creator on-chain, full playbooks in Supabase.",
    href: "/strategies",
    address: YIELD_CONTRACT_ADDRESS,
    accent: "from-emerald-500/20 to-cyan-500/10 border-emerald-500/30",
  },
  {
    key: "markets",
    title: "Prediction Markets",
    tagline:
      "MeleePMM parimutuel markets with anti-dilution floors and AI oracle resolution.",
    href: "/markets",
    address: PMM_CONTRACT_ADDRESS,
    accent: "from-violet-500/20 to-fuchsia-500/10 border-violet-500/30",
  },
  {
    key: "elnino",
    title: "El Niño Resilience",
    tagline:
      "Crowdfunded ETH pool, logistics hash chains, and zero-click flood payouts for coastal co-ops.",
    href: "/el-nino",
    address: NINO_CONTRACT_ADDRESS,
    accent: "from-sky-500/20 to-cyan-500/10 border-sky-500/30",
  },
];

const EVENT_ABIS = [
  parseAbiItem(
    "event StrategyCreated(address indexed creator, string id)",
  ),
  parseAbiItem(
    "event StrategyExecuted(address indexed user, string strategyName, uint256 expectedYield)",
  ),
  parseAbiItem(
    "event MarketCreated(uint256 indexed marketId, address indexed creator, uint256 endTimestamp)",
  ),
  parseAbiItem(
    "event DonationReceived(address indexed donor, uint256 amount, uint256 pool_total)",
  ),
  parseAbiItem(
    "event PayoutDisbursed(address indexed farmer, string location, uint256 amount)",
  ),
  parseAbiItem(
    "event AidCheckpointLogged(bytes32 indexed batch_hash, string location, uint256 timestamp)",
  ),
] as const;

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function shortHash(h: string) {
  return `${h.slice(0, 10)}…${h.slice(-6)}`;
}

function labelForLog(log: Log): string {
  // viem decoded topics aren't always present; use topic0 fingerprint via event names in order.
  const topic0 = log.topics[0];
  if (!topic0) return "Contract event";
  // Heuristic labels by contract address context set by caller.
  return "On-chain event";
}

/**
 * Judge-facing home showcase — three apps, addresses, and recent live txs.
 */
export function AppShowcase() {
  const [txsByApp, setTxsByApp] = useState<Record<string, TxRow[]>>({
    yield: [],
    markets: [],
    elnino: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const rpc =
      process.env.NEXT_PUBLIC_RPC_URL ||
      process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL ||
      "https://sepolia-rollup.arbitrum.io/rpc";

    void (async () => {
      try {
        const client = createPublicClient({
          chain: arbitrumSepolia,
          transport: http(rpc),
        });
        const latest = await client.getBlockNumber();
        // Keep the window RPC-friendly while still catching hackathon demo activity.
        const fromBlock = latest > BigInt(400_000) ? latest - BigInt(400_000) : BigInt(0);

        const addresses = [
          YIELD_CONTRACT_ADDRESS,
          PMM_CONTRACT_ADDRESS,
          NINO_CONTRACT_ADDRESS,
        ] as const;

        const logBatches = await Promise.all(
          addresses.map((address) =>
            client.getLogs({
              address,
              events: [...EVENT_ABIS],
              fromBlock,
              toBlock: "latest",
            }).catch(() => [] as Log[]),
          ),
        );
        const logs = logBatches.flat();

        const sorted = [...logs].sort((a, b) => {
          const ba = a.blockNumber ?? BigInt(0);
          const bb = b.blockNumber ?? BigInt(0);
          if (ba === bb) return Number((b.logIndex ?? 0) - (a.logIndex ?? 0));
          return ba > bb ? -1 : 1;
        });

        const buckets: Record<string, TxRow[]> = {
          yield: [],
          markets: [],
          elnino: [],
        };

        for (const log of sorted) {
          if (!log.transactionHash || log.blockNumber == null) continue;
          const addr = (log.address ?? "").toLowerCase();
          let key: string | null = null;
          if (addr === YIELD_CONTRACT_ADDRESS.toLowerCase()) key = "yield";
          else if (addr === PMM_CONTRACT_ADDRESS.toLowerCase()) key = "markets";
          else if (addr === NINO_CONTRACT_ADDRESS.toLowerCase()) key = "elnino";
          if (!key) continue;

          const bucket = buckets[key]!;
          if (bucket.some((t) => t.hash === log.transactionHash)) continue;

          const eventName =
            (log as { eventName?: string }).eventName ?? labelForLog(log);
          bucket.push({
            hash: log.transactionHash,
            label: eventName,
            blockNumber: log.blockNumber,
          });
          if (bucket.length >= 6) continue;
        }

        // Cap each bucket.
        for (const k of Object.keys(buckets)) {
          buckets[k] = buckets[k]!.slice(0, 6);
        }

        if (!cancelled) {
          setTxsByApp(buckets);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load recent contract transactions",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mt-12 space-y-6" data-testid="app-showcase">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Live on Arbitrum Sepolia
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Three apps · three Stylus contracts · verifiable txs
          </h2>
        </div>
        {loading ? (
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
            Indexing recent events…
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {APPS.map((app) => (
          <article
            key={app.key}
            data-testid={`showcase-${app.key}`}
            className={`flex flex-col rounded-2xl border bg-gradient-to-br p-5 shadow-[var(--shadow-soft)] ${app.accent}`}
          >
            <h3 className="text-xl font-extrabold text-foreground">
              {app.title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--accent)]">
              {app.tagline}
            </p>

            <div className="mt-4 rounded-xl border border-border/70 bg-background/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                Smart contract
              </p>
              <a
                href={`${ARBISCAN_ADDRESS}/${app.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex break-all font-mono text-[11px] font-semibold text-sky-700 hover:underline dark:text-sky-300"
              >
                {app.address}
                <ExternalLink className="ml-1 size-3 shrink-0" aria-hidden />
              </a>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                {shortAddr(app.address)} · Arbiscan Sepolia
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                Recent transactions
              </p>
              {(txsByApp[app.key] ?? []).length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-[11px] text-[var(--muted)]">
                  {loading ? "Loading…" : "No recent indexed events in window"}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {(txsByApp[app.key] ?? []).map((tx) => (
                    <li key={tx.hash}>
                      <a
                        href={`${ARBISCAN_TX}/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/50 px-2.5 py-2 text-[11px] hover:border-sky-500/40"
                      >
                        <span className="min-w-0 truncate font-semibold text-foreground">
                          {tx.label}
                        </span>
                        <span className="shrink-0 font-mono text-[var(--muted)]">
                          {shortHash(tx.hash)}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Link
              href={app.href}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-extrabold text-background hover:opacity-90"
            >
              Open {app.title}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
