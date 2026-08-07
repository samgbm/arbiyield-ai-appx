"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Sparkles, Wallet } from "lucide-react";
import { formatEther, type Address } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import {
  outcomeLabelFromId,
  PortfolioPositionCard,
  type PortfolioPositionCardProps,
} from "@/components/markets/PortfolioPositionCard";
import { OUTCOME_NO, OUTCOME_YES } from "@/components/markets/TradePanel";
import type { MarketMetadataRow } from "@/lib/supabaseClient";
import { PMM_CONTRACT_ADDRESS, pmmABI } from "@/lib/pmmContract";
import { useDemoStore } from "@/store/useDemoStore";

const ARBITRUM_SEPOLIA_CHAIN_ID = 421_614;

type LivePortfolioRow = PortfolioPositionCardProps & {
  shares: bigint;
  hasUnclaimedWinnings: boolean;
};

const DEMO_PORTFOLIO: PortfolioPositionCardProps[] = [
  {
    marketId: "eth-10k-2026",
    title: "Will ETH hit $10k in 2026?",
    category: "Crypto",
    outcome: "Yes",
    outcomeId: OUTCOME_YES,
    sharesLabel: "0.050000",
    floorLabel: "0.090000",
    isResolved: false,
  },
  {
    marketId: "eth-lima-winner-ai",
    title: "Will an AI × Arbitrum project win ETH Lima 2026 grand prize?",
    category: "Culture",
    outcome: "Yes",
    outcomeId: OUTCOME_YES,
    sharesLabel: "0.120000",
    floorLabel: "0.216000",
    isResolved: true,
    winningOutcome: OUTCOME_YES,
    claimed: false,
  },
  {
    marketId: "btc-etf-flows-sept",
    title: "Will US spot BTC ETFs see net inflows in September 2026?",
    category: "Macro",
    outcome: "No",
    outcomeId: OUTCOME_NO,
    sharesLabel: "0.080000",
    floorLabel: "0.144000",
    isResolved: true,
    winningOutcome: OUTCOME_YES,
    claimed: false,
  },
];

async function fetchAllMarketMetadata(): Promise<MarketMetadataRow[]> {
  const res = await fetch("/api/markets/metadata");
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? `Failed to load metadata (${res.status})`);
  }
  const data: unknown = await res.json();
  return Array.isArray(data) ? (data as MarketMetadataRow[]) : [];
}

function formatEthLabel(value: bigint) {
  const n = Number(formatEther(value));
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

function PortfolioSkeleton() {
  return (
    <div
      data-testid="portfolio-skeleton"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Loading portfolio"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="surface flex h-56 flex-col gap-4 p-5"
          data-testid="portfolio-skeleton-card"
        >
          <div className="flex justify-between gap-3">
            <div className="h-6 w-20 animate-pulse rounded-md bg-border" />
            <div className="h-6 w-24 animate-pulse rounded-md bg-border" />
          </div>
          <div className="h-6 w-[85%] animate-pulse rounded-md bg-border" />
          <div className="mt-auto grid grid-cols-2 gap-3">
            <div className="h-10 animate-pulse rounded-md bg-border" />
            <div className="h-10 animate-pulse rounded-md bg-border" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PortfolioEmpty() {
  return (
    <div
      data-testid="portfolio-empty"
      className="surface flex min-h-64 flex-col items-center justify-center gap-4 px-6 py-16 text-center"
    >
      <p className="text-base font-semibold text-foreground">
        You have no active positions. Go trade!
      </p>
      <p className="max-w-sm text-sm text-[var(--muted)]">
        Browse the markets hub and buy Yes/No shares to populate your portfolio.
      </p>
      <Link
        href="/markets"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
      >
        <Sparkles className="size-4" aria-hidden />
        Browse markets
      </Link>
    </div>
  );
}

/**
 * Global portfolio — Supabase market index × multicall getPosition / getMarket.
 */
export default function PortfolioPage() {
  const isDemoMode = useDemoStore((s) => s.isDemoMode);
  const { address, isConnected } = useAccount();

  const {
    data: metadataRows,
    isLoading: isMetaLoading,
    isFetching: isMetaFetching,
    isError: isMetaError,
    error: metaError,
  } = useQuery({
    queryKey: ["market-metadata"],
    queryFn: fetchAllMarketMetadata,
    enabled: !isDemoMode && isConnected,
    staleTime: 15_000,
  });

  const marketIds = useMemo(() => {
    if (!metadataRows?.length) return [] as bigint[];
    return metadataRows
      .map((row) => Number(row.id))
      .filter((id) => Number.isInteger(id) && id >= 0)
      .map((id) => BigInt(id));
  }, [metadataRows]);

  const metaById = useMemo(() => {
    const map = new Map<number, MarketMetadataRow>();
    for (const row of metadataRows ?? []) {
      map.set(Number(row.id), row);
    }
    return map;
  }, [metadataRows]);

  // Per market: getMarket + getPosition(No) + getPosition(Yes)
  const contracts = useMemo(() => {
    if (!address || marketIds.length === 0) return [];

    return marketIds.flatMap((marketId) => [
      {
        address: PMM_CONTRACT_ADDRESS,
        abi: pmmABI,
        functionName: "getMarket" as const,
        args: [marketId] as const,
        chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
      },
      {
        address: PMM_CONTRACT_ADDRESS,
        abi: pmmABI,
        functionName: "getPosition" as const,
        args: [marketId, address as Address, OUTCOME_NO] as const,
        chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
      },
      {
        address: PMM_CONTRACT_ADDRESS,
        abi: pmmABI,
        functionName: "getPosition" as const,
        args: [marketId, address as Address, OUTCOME_YES] as const,
        chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
      },
    ]);
  }, [address, marketIds]);

  const {
    data: multicallResults,
    isLoading: isMulticallLoading,
    isFetching: isMulticallFetching,
  } = useReadContracts({
    contracts,
    query: {
      enabled:
        !isDemoMode &&
        isConnected &&
        Boolean(address) &&
        contracts.length > 0,
    },
  });

  const livePositions = useMemo(() => {
    // Mixed getMarket/getPosition calls widen wagmi inference to `never` —
    // read results through a narrow runtime shape instead.
    type CallResult =
      | { status: "success"; result: unknown }
      | { status: "failure"; error?: Error }
      | undefined;

    const results = (multicallResults ?? []) as CallResult[];

    if (!results.length || marketIds.length === 0) {
      return [] as LivePortfolioRow[];
    }

    const rows: LivePortfolioRow[] = [];

    for (let i = 0; i < marketIds.length; i++) {
      const base = i * 3;
      const marketResult = results[base];
      const noResult = results[base + 1];
      const yesResult = results[base + 2];
      const marketId = Number(marketIds[i]);
      const meta = metaById.get(marketId);

      if (marketResult?.status !== "success" || marketResult.result == null) {
        continue;
      }

      const raw = marketResult.result as readonly [
        string,
        bigint,
        boolean,
        number | bigint,
        bigint,
        bigint,
        bigint,
      ];
      const isResolved = Boolean(raw[2]);
      const winningOutcome = Number(raw[3]);

      const sides: {
        outcomeId: number;
        result: CallResult;
      }[] = [
        { outcomeId: OUTCOME_NO, result: noResult },
        { outcomeId: OUTCOME_YES, result: yesResult },
      ];

      for (const side of sides) {
        if (side.result?.status !== "success" || side.result.result == null) {
          continue;
        }
        const [shares, , floor, claimed] = side.result.result as readonly [
          bigint,
          bigint,
          bigint,
          boolean,
        ];

        const hasUnclaimedWinnings =
          isResolved &&
          !claimed &&
          shares > BigInt(0) &&
          side.outcomeId === winningOutcome;

        // Keep open bets and unclaimed winning positions only.
        if (shares <= BigInt(0) && !hasUnclaimedWinnings) continue;

        rows.push({
          marketId,
          title: meta?.title?.trim() || `Market #${marketId}`,
          category: meta?.category?.trim() || "Crypto",
          outcome: outcomeLabelFromId(side.outcomeId),
          outcomeId: side.outcomeId,
          sharesLabel: formatEthLabel(shares),
          floorLabel: formatEthLabel(floor),
          isResolved,
          winningOutcome,
          claimed,
          shares,
          hasUnclaimedWinnings,
        });
      }
    }

    return rows.sort((a, b) => Number(b.marketId) - Number(a.marketId));
  }, [multicallResults, marketIds, metaById]);

  const isLoading =
    !isDemoMode &&
    isConnected &&
    (isMetaLoading ||
      isMetaFetching ||
      (marketIds.length > 0 &&
        (isMulticallLoading || isMulticallFetching)));

  const activeCount = isDemoMode
    ? DEMO_PORTFOLIO.filter((p) => !p.isResolved).length
    : livePositions.filter((p) => !p.isResolved).length;

  const claimableCount = isDemoMode
    ? DEMO_PORTFOLIO.filter(
        (p) => p.isResolved && p.winningOutcome === p.outcomeId && !p.claimed,
      ).length
    : livePositions.filter((p) => p.hasUnclaimedWinnings).length;

  const positions = isDemoMode ? DEMO_PORTFOLIO : livePositions;

  return (
    <div className="hero-wash">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="font-mono-explorer text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              Portfolio · cross-market
            </p>
            <h1 className="font-display text-4xl tracking-tight text-foreground sm:text-5xl">
              Your Portfolio
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-[var(--accent)]">
              Track every Yes/No bet across MeleePMM — active floors, winners
              ready to claim, and settled losses.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div
              data-testid="portfolio-stat-active"
              className="rounded-xl border border-border bg-secondary px-4 py-3"
            >
              <p className="font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Total Active Bets
              </p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-foreground">
                {activeCount}
              </p>
            </div>
            <div
              data-testid="portfolio-stat-claimable"
              className="rounded-xl border border-border bg-secondary px-4 py-3"
            >
              <p className="font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Claimable
              </p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
                {claimableCount}
              </p>
            </div>
          </div>
        </div>

        {isDemoMode ? (
          <div
            data-testid="portfolio-grid"
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {DEMO_PORTFOLIO.map((position) => (
              <PortfolioPositionCard
                key={`${position.marketId}-${position.outcome}`}
                {...position}
              />
            ))}
          </div>
        ) : !isConnected ? (
          <div
            data-testid="portfolio-connect"
            className="surface flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-16 text-center"
          >
            <Wallet className="size-8 text-primary" aria-hidden />
            <p className="text-base font-semibold text-foreground">
              Connect your wallet
            </p>
            <p className="max-w-sm text-sm text-[var(--muted)]">
              Portfolio positions are loaded from Arbitrum Sepolia for the
              connected address.
            </p>
          </div>
        ) : isLoading ? (
          <PortfolioSkeleton />
        ) : isMetaError ? (
          <div
            data-testid="portfolio-meta-error"
            className="surface px-6 py-10 text-center text-sm font-semibold text-[var(--danger)]"
          >
            {metaError instanceof Error
              ? metaError.message
              : "Failed to load market metadata."}
          </div>
        ) : positions.length === 0 ? (
          <PortfolioEmpty />
        ) : (
          <div
            data-testid="portfolio-grid"
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {livePositions.map((position) => (
              <PortfolioPositionCard
                key={`${position.marketId}-${position.outcomeId}`}
                marketId={position.marketId}
                title={position.title}
                category={position.category}
                outcome={position.outcome}
                outcomeId={position.outcomeId}
                sharesLabel={position.sharesLabel}
                floorLabel={position.floorLabel}
                isResolved={position.isResolved}
                winningOutcome={position.winningOutcome}
                claimed={position.claimed}
              />
            ))}
          </div>
        )}

        {isDemoMode && (
          <p className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">
            <Briefcase className="size-3.5" aria-hidden />
            Demo Mode — showing mock portfolio holdings for the pitch.
          </p>
        )}
      </div>
    </div>
  );
}
