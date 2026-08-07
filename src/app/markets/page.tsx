"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useReadContracts } from "wagmi";
import { MarketCard } from "@/components/markets/MarketCard";
import { mockMarkets, type MockMarket } from "@/data/mockMarkets";
import type { MarketMetadataRow } from "@/lib/supabaseClient";
import { PMM_CONTRACT_ADDRESS, pmmABI } from "@/lib/pmmContract";
import { useDemoStore } from "@/store/useDemoStore";
import {
  metadataById,
  parseOnChainMarket,
} from "@/utils/marketParser";

/** Arbitrum Sepolia — keep reads on the Stylus deployment chain. */
const ARBITRUM_SEPOLIA_CHAIN_ID = 421_614;

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

function MarketsSkeleton() {
  return (
    <div
      data-testid="markets-skeleton"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Loading markets"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="surface flex h-64 flex-col gap-4 p-5"
          data-testid="market-skeleton-card"
        >
          <div className="flex justify-between gap-3">
            <div className="h-6 w-20 animate-pulse rounded-md bg-border" />
            <div className="h-4 w-24 animate-pulse rounded-md bg-border" />
          </div>
          <div className="space-y-2">
            <div className="h-6 w-[80%] animate-pulse rounded-md bg-border" />
            <div className="h-4 w-full animate-pulse rounded-md bg-border" />
            <div className="h-4 w-[60%] animate-pulse rounded-md bg-border" />
          </div>
          <div className="mt-auto space-y-2">
            <div className="flex justify-between">
              <div className="h-8 w-14 animate-pulse rounded-md bg-border" />
              <div className="h-8 w-14 animate-pulse rounded-md bg-border" />
            </div>
            <div className="h-2.5 w-full animate-pulse rounded-full bg-border" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyMarkets() {
  return (
    <div
      data-testid="markets-empty"
      className="surface flex min-h-64 flex-col items-center justify-center gap-4 px-6 py-16 text-center"
    >
      <p className="text-base font-semibold text-foreground">
        No active markets found. Create one!
      </p>
      <p className="max-w-sm text-sm text-[var(--muted)]">
        Deploy a Yes/No market to the MeleePMM Stylus contract to see it here.
      </p>
      <Link
        href="/markets/create"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
      >
        <Sparkles className="size-4" aria-hidden />
        Create Market
      </Link>
    </div>
  );
}

function MarketsGrid({ markets }: { markets: MockMarket[] }) {
  return (
    <div
      data-testid="markets-grid"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      {markets.map((market) => (
        <MarketCard key={market.id} market={market} />
      ))}
    </div>
  );
}

/**
 * Prediction Markets hub.
 * Demo Mode → mock marketplace for pitches.
 * Live Mode → Supabase metadata + multicall `getMarket` financial state.
 */
export default function MarketsPage() {
  const isDemoMode = useDemoStore((s) => s.isDemoMode);
  const createdMarkets = useDemoStore((s) => s.createdMarkets);

  const {
    data: metadataRows,
    isLoading: isMetaLoading,
    isFetching: isMetaFetching,
    isError: isMetaError,
    error: metaError,
  } = useQuery({
    queryKey: ["market-metadata"],
    queryFn: fetchAllMarketMetadata,
    enabled: !isDemoMode,
    staleTime: 15_000,
  });

  const metaMap = useMemo(
    () => metadataById(metadataRows ?? []),
    [metadataRows],
  );

  // Supabase IDs drive which on-chain markets we multicall.
  const marketIds = useMemo(() => {
    if (!metadataRows?.length) return [] as bigint[];
    return metadataRows
      .map((row) => Number(row.id))
      .filter((id) => Number.isInteger(id) && id >= 0)
      .map((id) => BigInt(id));
  }, [metadataRows]);

  const {
    data: marketsResults,
    isLoading: isMarketsLoading,
    isFetching: isMarketsFetching,
  } = useReadContracts({
    contracts: marketIds.map((id) => ({
      address: PMM_CONTRACT_ADDRESS,
      abi: pmmABI,
      functionName: "getMarket" as const,
      args: [id] as const,
      chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
    })),
    query: {
      enabled: !isDemoMode && marketIds.length > 0,
    },
  });

  const onChainMarkets = useMemo(() => {
    if (!marketsResults?.length || !marketIds.length) return [];
    const parsed: MockMarket[] = [];
    for (let i = 0; i < marketsResults.length; i++) {
      const result = marketsResults[i];
      const id = Number(marketIds[i]);
      if (result.status !== "success" || result.result == null) continue;
      try {
        parsed.push(
          parseOnChainMarket(id, result.result, metaMap.get(id) ?? null),
        );
      } catch {
        // Skip malformed rows rather than blanking the hub.
      }
    }
    // Newest first (higher ids at the top) — metadata query already orders desc,
    // but reverse-sort defensively in case row order drifts.
    return parsed.sort((a, b) => Number(b.id) - Number(a.id));
  }, [marketsResults, marketIds, metaMap]);

  const isLoading =
    !isDemoMode &&
    (isMetaLoading ||
      isMetaFetching ||
      (marketIds.length > 0 && (isMarketsLoading || isMarketsFetching)));

  const demoMarkets = [...createdMarkets, ...mockMarkets];
  const isEmpty =
    !isDemoMode &&
    !isLoading &&
    !isMetaError &&
    marketIds.length === 0;

  return (
    <div className="hero-wash">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="font-mono-explorer text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              Prediction Markets · PMM
            </p>
            <h1 className="font-display text-4xl tracking-tight text-foreground sm:text-5xl">
              Markets hub
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-[var(--accent)]">
              Discover active markets, create with AI, and trade Yes/No shares
              with Minimum Return Floor protection on Stylus.
            </p>
          </div>

          <Link
            href="/markets/create"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            <Sparkles className="size-4" aria-hidden />
            Create Market
          </Link>
        </div>

        {isDemoMode ? (
          <MarketsGrid markets={demoMarkets} />
        ) : isLoading ? (
          <MarketsSkeleton />
        ) : isMetaError ? (
          <div
            data-testid="markets-meta-error"
            className="surface px-6 py-10 text-center text-sm font-semibold text-[var(--danger)]"
          >
            {metaError instanceof Error
              ? metaError.message
              : "Failed to load market metadata from Supabase."}
          </div>
        ) : isEmpty ? (
          <EmptyMarkets />
        ) : (
          <MarketsGrid markets={onChainMarkets} />
        )}
      </div>
    </div>
  );
}
