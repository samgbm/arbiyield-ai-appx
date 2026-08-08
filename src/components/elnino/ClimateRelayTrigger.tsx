"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, LoaderCircle, Radio } from "lucide-react";
import { toast } from "sonner";
import {
  useAccount,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useDemoStore } from "@/store/useDemoStore";
import {
  ARBISCAN_TX,
  CLIMATE_RELAYER_ADMIN,
  EL_NINO_DEMO_PAYOUT_EVENT,
  EL_NINO_LOCATIONS,
  NINO_CONTRACT_ADDRESS,
  elninoABI,
  type ElNinoLocation,
  type ElNinoPayoutEvent,
} from "@/lib/elninoContract";
import { estimateArbitrumSepoliaFees } from "@/lib/gas";
import { parseRPCError } from "@/utils/rpcErrorHandler";
import { zeroAddress } from "viem";

const ARBITRUM_SEPOLIA_CHAIN_ID = 421_614;
const RELAYER_SHORT = `${CLIMATE_RELAYER_ADMIN.slice(0, 6)}…${CLIMATE_RELAYER_ADMIN.slice(-4)}`;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function shortHash(hash: `0x${string}`) {
  return `${hash.slice(0, 10)}…${hash.slice(-4)}`;
}

/**
 * Admin Climate Data Relay — pushes rainfall readings into Stylus
 * `processClimateRelay` (threshold ≥ 50mm).
 */
export function ClimateRelayTrigger() {
  const isDemoMode = useDemoStore((s) => s.isDemoMode);
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: ARBITRUM_SEPOLIA_CHAIN_ID });
  const [location, setLocation] = useState<ElNinoLocation>("Piura");
  const [rainfallMm, setRainfallMm] = useState("85");
  const [demoLoading, setDemoLoading] = useState(false);
  const [initPending, setInitPending] = useState(false);
  const notifiedHash = useRef<`0x${string}` | null>(null);

  const {
    writeContractAsync,
    data: hash,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (!isSuccess || !hash || notifiedHash.current === hash) return;
    notifiedHash.current = hash;
    toast.success("Climate relay confirmed — payouts disbursing on Stylus.", {
      description: shortHash(hash),
      action: {
        label: "Arbiscan",
        onClick: () =>
          window.open(`${ARBISCAN_TX}/${hash}`, "_blank", "noopener,noreferrer"),
      },
    });
  }, [isSuccess, hash]);

  useEffect(() => {
    if (!writeError) return;
    toast.error(parseRPCError(writeError));
  }, [writeError]);

  const busy = demoLoading || initPending || isPending || isConfirming;

  async function feeOverrides() {
    if (!publicClient) return {};
    try {
      const fees = await estimateArbitrumSepoliaFees(publicClient);
      return {
        maxFeePerGas: fees.maxFeePerGas,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      };
    } catch {
      return {};
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mm = Number(rainfallMm);
    if (!Number.isFinite(mm) || mm < 0) {
      toast.error("Enter a valid rainfall amount in millimeters.");
      return;
    }

    if (isDemoMode) {
      setDemoLoading(true);
      toast.message("Demo: Pushing weather data to Arbitrum…");
      await wait(2000);
      setDemoLoading(false);
      const demoHash =
        "0xdemodemo0000000000000000000000000000000000000000000000000000eln1" as `0x${string}`;
      const demoPayout: ElNinoPayoutEvent = {
        farmer:
          (address as `0x${string}` | undefined) ??
          "0x5a967532fd910921f970fcff449eb95b61c782f4",
        location,
        amount: BigInt(100_000_000),
        transactionHash: demoHash,
        receivedAt: Date.now(),
      };
      window.dispatchEvent(
        new CustomEvent(EL_NINO_DEMO_PAYOUT_EVENT, { detail: demoPayout }),
      );
      toast.success("Demo: Climate relay executed — FUNDS DISBURSED.", {
        description: shortHash(demoHash),
      });
      return;
    }

    if (!isConnected) {
      toast.error("Connect the Climate Relayer wallet to push weather data.");
      return;
    }

    if (
      address &&
      address.toLowerCase() !== CLIMATE_RELAYER_ADMIN.toLowerCase()
    ) {
      toast.error(
        `Wrong wallet — connect Climate Relayer ${RELAYER_SHORT} (you are ${address.slice(0, 6)}…${address.slice(-4)}).`,
      );
      return;
    }

    if (!publicClient) {
      toast.error("RPC client unavailable. Check Arbitrum Sepolia connection.");
      return;
    }

    reset();
    notifiedHash.current = null;

    try {
      const admin = await publicClient.readContract({
        address: NINO_CONTRACT_ADDRESS,
        abi: elninoABI,
        functionName: "getAdmin",
      });

      // Deploy leaves admin = 0x0 until initialize() runs once.
      // Uninitialized processClimateRelay reverts → MetaMask "Network fee Unavailable".
      if (admin === zeroAddress) {
        setInitPending(true);
        toast.message(
          "Contract not initialized — confirm initialize() in MetaMask first…",
        );
        const initHash = await writeContractAsync({
          address: NINO_CONTRACT_ADDRESS,
          abi: elninoABI,
          functionName: "initialize",
          chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
          ...(await feeOverrides()),
        });
        toast.message("Initializing Stylus contract…", {
          description: shortHash(initHash),
        });
        await publicClient.waitForTransactionReceipt({ hash: initHash });
        toast.success("Contract initialized — now submit climate relay.");
        setInitPending(false);
      }

      toast.message("Submitting climate relay on Arbitrum Sepolia…");
      const txHash = await writeContractAsync({
        address: NINO_CONTRACT_ADDRESS,
        abi: elninoABI,
        functionName: "processClimateRelay",
        args: [location, BigInt(Math.floor(mm))],
        chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
        ...(await feeOverrides()),
      });
      toast.message("Transaction submitted — waiting for confirmation…", {
        description: shortHash(txHash),
        action: {
          label: "Arbiscan",
          onClick: () =>
            window.open(
              `${ARBISCAN_TX}/${txHash}`,
              "_blank",
              "noopener,noreferrer",
            ),
        },
      });
    } catch {
      setInitPending(false);
      // writeError effect toasts.
    }
  }

  return (
    <section
      data-testid="climate-relay-trigger"
      className="rounded-2xl border border-border bg-secondary/70 p-5 shadow-[var(--shadow-soft)]"
    >
      <header className="mb-5 space-y-1">
        <p className="font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
          Climate Data Relay
        </p>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Push Weather Data
        </h2>
        <p className="text-sm text-[var(--accent)]">
          Submit ENFEN / SENAMHI-style rainfall. Threshold ≥ 50mm triggers
          zero-click payouts for matching active policies.
        </p>
      </header>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
        <label className="block space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Location
          </span>
          <select
            data-testid="climate-location"
            value={location}
            onChange={(ev) => setLocation(ev.target.value as ElNinoLocation)}
            className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none ring-sky-500/40 focus:ring-2"
          >
            {EL_NINO_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Rainfall (mm)
          </span>
          <input
            data-testid="climate-rainfall"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={rainfallMm}
            onChange={(ev) => setRainfallMm(ev.target.value)}
            className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold tabular-nums text-foreground outline-none ring-sky-500/40 focus:ring-2"
          />
        </label>

        <button
          type="submit"
          data-testid="push-weather-data"
          disabled={busy}
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-5 text-base font-extrabold text-white shadow-[0_0_32px_rgba(2,132,199,0.4)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <LoaderCircle className="size-5 animate-spin" aria-hidden />
          ) : (
            <Radio className="size-5" aria-hidden />
          )}
          {demoLoading
            ? "Simulating relay…"
            : initPending
              ? "Initializing contract…"
              : isPending
                ? "Confirm in wallet…"
                : isConfirming
                  ? "Executing on Arbitrum…"
                  : "Push Weather Data"}
        </button>
      </form>

      {hash ? (
        <a
          data-testid="climate-tx-link"
          href={`${ARBISCAN_TX}/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-sky-500/35 bg-sky-500/10 px-3 py-2.5 text-sm font-semibold text-sky-800 hover:underline dark:text-sky-200"
        >
          {isSuccess ? "Confirmed on Arbiscan" : "View pending tx on Arbiscan"}{" "}
          · {shortHash(hash)}
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      ) : null}

      {!isDemoMode && !isConnected ? (
        <p className="mt-3 text-xs font-semibold text-amber-700 dark:text-amber-300">
          Connect the authorized Climate Relayer wallet (
          <code className="font-mono text-[10px]">{RELAYER_SHORT}</code>) to push
          live weather data.
        </p>
      ) : null}

      {!isDemoMode ? (
        <p className="mt-3 text-[11px] leading-relaxed text-[var(--muted)]">
          MetaMask &quot;Network fee Unavailable&quot; means the call would
          revert (usually contract not initialized). First push will ask you to
          confirm <code className="font-mono">initialize()</code>, then the
          climate relay. You need a little Arbitrum Sepolia ETH for gas (~0.15
          ETH on {RELAYER_SHORT} is fine).
        </p>
      ) : null}
    </section>
  );
}
