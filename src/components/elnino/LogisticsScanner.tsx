"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LoaderCircle, QrCode, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useReadContract } from "wagmi";
import {
  DEMO_AID_BATCH_HASH,
  NINO_CONTRACT_ADDRESS,
  ninoAbi,
} from "@/config/contracts";
import {
  isBytes32Hex,
  type AidCheckpointRow,
  type OnChainAidBatch,
} from "@/lib/aidProvenance";
import { getSupabase } from "@/lib/supabaseClient";
import { useDemoStore } from "@/store/useDemoStore";

const ARBITRUM_SEPOLIA_CHAIN_ID = 421_614;

export type LogisticsScanResult = {
  batchHash: `0x${string}`;
  onChain: OnChainAidBatch;
  checkpoints: AidCheckpointRow[];
  productName?: string | null;
  originFarm?: string | null;
  tipTxHash?: string | null;
};

type Props = {
  onResult: (result: LogisticsScanResult | null) => void;
};

function deepLinkHashFromSearch(
  searchParams: ReturnType<typeof useSearchParams>,
): `0x${string}` | undefined {
  const fromQuery = searchParams.get("hash")?.trim();
  if (!fromQuery || !isBytes32Hex(fromQuery)) return undefined;
  return fromQuery.toLowerCase() as `0x${string}`;
}

function buildDemoResult(hash: `0x${string}`): LogisticsScanResult {
  return {
    batchHash: hash,
    productName: "Flood-relief rice kits",
    originFarm: "Cooperativa Piura Norte",
    tipTxHash: null,
    onChain: {
      location: "Lima Aid Distribution Store",
      timestamp: BigInt(Math.floor(Date.now() / 1000) - 86_400),
      isFlagged: false,
    },
    checkpoints: [
      {
        step_index: 0,
        step_type: "farm",
        location_name: "Piura Cooperative Hub",
        facility_id: "FARM-PIU-01",
        farm_name: "Cooperativa Piura Norte",
        batch_weight_kg: 500,
        temperature_c: 22,
        sensor_id: "SEN-1",
        handler_name: "Maria Quispe",
        arrived_at: "2026-08-01T08:00:00.000Z",
        departed_at: "2026-08-01T12:00:00.000Z",
        parent_hash: null,
        step_hash:
          "0x46c31e2b629c81373e6c07cc9f75ab4f48dc7b680dda191f1f1efcaeae9427ca",
        tx_hash: null,
      },
      {
        step_index: 1,
        step_type: "factory",
        location_name: "Chiclayo Packing Plant",
        facility_id: "FAC-9082",
        farm_name: null,
        batch_weight_kg: 498,
        temperature_c: 18,
        sensor_id: "SEN-4",
        handler_name: "Plant Gate B",
        arrived_at: "2026-08-02T14:30:00.000Z",
        departed_at: "2026-08-03T10:00:00.000Z",
        parent_hash:
          "0x46c31e2b629c81373e6c07cc9f75ab4f48dc7b680dda191f1f1efcaeae9427ca",
        step_hash:
          "0x469aa5b523df57629252d6cb0a127033ef0d3dffcce607b7a2d2b47d5bdf75fa",
        tx_hash: null,
      },
      {
        step_index: 2,
        step_type: "depot",
        location_name: "Trujillo Cold Depot",
        facility_id: "DEP-TRU-12",
        farm_name: null,
        batch_weight_kg: 495,
        temperature_c: 4,
        sensor_id: "SEN-9",
        handler_name: "Cold-chain unit 3",
        arrived_at: "2026-08-04T09:15:00.000Z",
        departed_at: "2026-08-05T07:00:00.000Z",
        parent_hash:
          "0x469aa5b523df57629252d6cb0a127033ef0d3dffcce607b7a2d2b47d5bdf75fa",
        step_hash:
          "0x66390d0b551ad2c397fd3934f1785aa63395fbbcd7433f35c1ea1f3a79527a57",
        tx_hash: null,
      },
      {
        step_index: 3,
        step_type: "store",
        location_name: "Lima Aid Distribution Store",
        facility_id: "STR-LIM-03",
        farm_name: null,
        batch_weight_kg: 490,
        temperature_c: 6,
        sensor_id: "SEN-11",
        handler_name: "Store intake",
        arrived_at: "2026-08-06T16:45:00.000Z",
        departed_at: null,
        parent_hash:
          "0x66390d0b551ad2c397fd3934f1785aa63395fbbcd7433f35c1ea1f3a79527a57",
        step_hash: DEMO_AID_BATCH_HASH,
        tx_hash: null,
      },
    ],
  };
}

async function fetchOffchainEnrichment(
  submittedHash: `0x${string}`,
  onChain: OnChainAidBatch,
): Promise<LogisticsScanResult> {
  const supabase = getSupabase();
  const { data: byTip } = await supabase
    .from("aid_shipments")
    .select("id, product_name, origin_farm, tip_tx_hash")
    .eq("tip_hash", submittedHash)
    .maybeSingle();

  let shipmentId = byTip?.id as string | undefined;
  let productName = (byTip?.product_name as string | undefined) ?? null;
  let originFarm = (byTip?.origin_farm as string | undefined) ?? null;
  let tipTxHash = (byTip?.tip_tx_hash as string | undefined) ?? null;

  if (!shipmentId) {
    const { data: byStep } = await supabase
      .from("aid_checkpoints")
      .select("shipment_id, tx_hash")
      .eq("step_hash", submittedHash)
      .maybeSingle();
    shipmentId = byStep?.shipment_id as string | undefined;
    tipTxHash = tipTxHash ?? (byStep?.tx_hash as string | undefined) ?? null;
  }

  let checkpoints: AidCheckpointRow[] = [];
  if (shipmentId) {
    if (!productName) {
      const { data: ship } = await supabase
        .from("aid_shipments")
        .select("product_name, origin_farm, tip_tx_hash")
        .eq("id", shipmentId)
        .maybeSingle();
      productName = (ship?.product_name as string | undefined) ?? null;
      originFarm = (ship?.origin_farm as string | undefined) ?? null;
      tipTxHash =
        tipTxHash ?? (ship?.tip_tx_hash as string | undefined) ?? null;
    }

    const { data: rows, error: cpErr } = await supabase
      .from("aid_checkpoints")
      .select("*")
      .eq("shipment_id", shipmentId)
      .order("step_index", { ascending: true });
    if (cpErr) throw cpErr;
    checkpoints = (rows ?? []) as AidCheckpointRow[];
    if (!tipTxHash) {
      const match = checkpoints.find((c) => c.step_hash === submittedHash);
      tipTxHash = match?.tx_hash ?? null;
    }
  }

  return {
    batchHash: submittedHash,
    onChain,
    checkpoints,
    productName,
    originFarm,
    tipTxHash,
  };
}

/**
 * Batch-hash scanner — reads `verifyAidBatch` from live Stylus + optional Supabase chain.
 */
export function LogisticsScanner({ onResult }: Props) {
  const isDemoMode = useDemoStore((s) => s.isDemoMode);
  const searchParams = useSearchParams();
  const deepLinkHash = useMemo(
    () => deepLinkHashFromSearch(searchParams),
    [searchParams],
  );

  const [input, setInput] = useState(deepLinkHash ?? "");
  const [submittedHash, setSubmittedHash] = useState<
    `0x${string}` | undefined
  >(deepLinkHash);
  const demoDeepLinkPublished = useRef(false);
  const lastPublishedKey = useRef<string | null>(null);

  const {
    data,
    isFetching,
    isError,
    error,
    refetch,
  } = useReadContract({
    address: NINO_CONTRACT_ADDRESS,
    abi: ninoAbi,
    functionName: "verifyAidBatch",
    args: submittedHash ? [submittedHash] : undefined,
    chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
    query: {
      enabled: Boolean(submittedHash) && !isDemoMode,
    },
  });

  useEffect(() => {
    if (!isError || !error) return;
    toast.error(
      error instanceof Error
        ? error.message
        : "Failed to read verifyAidBatch from Arbitrum.",
    );
    onResult(null);
  }, [isError, error, onResult]);

  // Demo deep link: initial state already holds the hash; publish once.
  useEffect(() => {
    if (!isDemoMode || !deepLinkHash || demoDeepLinkPublished.current) return;
    demoDeepLinkPublished.current = true;
    onResult(buildDemoResult(deepLinkHash));
    toast.success("Demo: cryptographic audit trail loaded.");
  }, [isDemoMode, deepLinkHash, onResult]);

  const onChain: OnChainAidBatch | null = useMemo(() => {
    if (!submittedHash || isDemoMode || data === undefined || isFetching) {
      return null;
    }
    const [location, timestamp, isFlagged] = data;
    if (!location && timestamp === BigInt(0)) return null;
    return { location, timestamp, isFlagged };
  }, [submittedHash, isDemoMode, data, isFetching]);

  useEffect(() => {
    if (!submittedHash || isDemoMode) return;
    if (data === undefined || isFetching) return;
    const [location, timestamp] = data;
    if (!location && timestamp === BigInt(0)) {
      toast.error("No on-chain checkpoint for this hash.");
      onResult(null);
    }
  }, [submittedHash, isDemoMode, data, isFetching, onResult]);

  const {
    data: enriched,
    isFetching: loadingOffchain,
    isError: offchainError,
    error: offchainErr,
    isSuccess: offchainSuccess,
  } = useQuery({
    queryKey: [
      "aid-logistics-offchain",
      submittedHash,
      onChain?.location,
      onChain?.timestamp?.toString(),
      onChain?.isFlagged,
    ],
    enabled: Boolean(submittedHash && onChain && !isDemoMode),
    queryFn: () => fetchOffchainEnrichment(submittedHash!, onChain!),
    retry: false,
  });

  useEffect(() => {
    if (!offchainSuccess || !enriched) return;
    const key = `${enriched.batchHash}:${enriched.onChain.timestamp.toString()}:ok`;
    if (lastPublishedKey.current === key) return;
    lastPublishedKey.current = key;
    onResult(enriched);
    toast.success(
      enriched.onChain.isFlagged
        ? "Batch flagged on-chain — review deviation."
        : "Batch verified on Arbitrum Sepolia.",
    );
  }, [offchainSuccess, enriched, onResult]);

  useEffect(() => {
    if (!offchainError || !onChain || !submittedHash) return;
    const key = `${submittedHash}:${onChain.timestamp.toString()}:fallback`;
    if (lastPublishedKey.current === key) return;
    lastPublishedKey.current = key;
    onResult({
      batchHash: submittedHash,
      onChain,
      checkpoints: [],
      productName: null,
      originFarm: null,
      tipTxHash: null,
    });
    toast.message("On-chain verify OK — off-chain timeline unavailable.", {
      description:
        offchainErr instanceof Error ? offchainErr.message : undefined,
    });
  }, [offchainError, offchainErr, onChain, submittedHash, onResult]);

  function trackHash(raw: string) {
    const trimmed = raw.trim();
    if (!isBytes32Hex(trimmed)) {
      toast.error("Enter a valid bytes32 hash (0x + 64 hex chars).");
      return;
    }
    const hash = trimmed.toLowerCase() as `0x${string}`;
    lastPublishedKey.current = null;
    onResult(null);

    if (isDemoMode) {
      setInput(hash);
      setSubmittedHash(hash);
      onResult(buildDemoResult(hash));
      toast.success("Demo: cryptographic audit trail loaded.");
      return;
    }

    setInput(hash);
    setSubmittedHash(hash);
    void refetch();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    trackHash(input);
  }

  function simulateQr() {
    trackHash(DEMO_AID_BATCH_HASH);
  }

  const busy = isFetching || loadingOffchain;

  return (
    <section
      data-testid="logistics-scanner"
      className="rounded-2xl border border-border bg-secondary/70 p-5 shadow-[var(--shadow-soft)]"
    >
      <header className="mb-5 space-y-1">
        <p className="font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
          QR / Hash Scanner
        </p>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Track Shipment
        </h2>
        <p className="text-sm text-[var(--accent)]">
          Paste a Stylus checkpoint hash to notarize the off-chain SQL trail
          against Arbitrum Sepolia.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Batch Hash (bytes32)
          </span>
          <input
            data-testid="batch-hash-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0x…"
            spellCheck={false}
            className="min-h-12 w-full rounded-xl border border-border bg-background px-3 font-mono text-xs font-semibold text-foreground outline-none ring-sky-500/40 focus:ring-2"
          />
        </label>

        <button
          type="submit"
          data-testid="track-shipment"
          disabled={busy}
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-5 text-base font-extrabold text-white shadow-[0_0_32px_rgba(2,132,199,0.4)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <LoaderCircle className="size-5 animate-spin" aria-hidden />
          ) : (
            <Search className="size-5" aria-hidden />
          )}
          {busy ? "Querying Arbitrum…" : "Track Shipment"}
        </button>
      </form>

      <button
        type="button"
        data-testid="simulate-qr-scan"
        onClick={simulateQr}
        disabled={busy}
        className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-sky-500/35 bg-sky-500/10 px-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-500/15 disabled:opacity-60 dark:text-sky-200"
      >
        <QrCode className="size-4" aria-hidden />
        Simulate QR Scan
      </button>

      {busy ? (
        <div
          data-testid="scanner-skeleton"
          className="mt-4 space-y-2"
          aria-hidden
        >
          <div className="h-3 animate-pulse rounded bg-border/80" />
          <div className="h-3 w-[80%] animate-pulse rounded bg-border/60" />
          <div className="h-3 w-[66%] animate-pulse rounded bg-border/40" />
        </div>
      ) : null}
    </section>
  );
}
