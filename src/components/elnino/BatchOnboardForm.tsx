"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { isAddress, type Address } from "viem";
import {
  useAccount,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDemoStore } from "@/store/useDemoStore";
import { OnboardingArena } from "@/components/elnino/OnboardingArena";
import {
  EL_NINO_LOCATIONS,
  NINO_CONTRACT_ADDRESS,
  elninoABI,
  ethToWei,
  type ElNinoLocation,
} from "@/lib/elninoContract";
import { estimateArbitrumSepoliaFees } from "@/lib/gas";
import { parseRPCError } from "@/utils/rpcErrorHandler";

const ARBITRUM_SEPOLIA_CHAIN_ID = 421_614;

type FarmerRow = {
  id: string;
  address: string;
  location: ElNinoLocation;
  coverageEth: string;
};

/** Stable seed row — must not use random UUIDs (breaks SSR hydration). */
const INITIAL_ROW: FarmerRow = {
  id: "row-0",
  address: "",
  location: "Piura",
  coverageEth: "0.01",
};

let clientRowSeq = 1;

function newRow(): FarmerRow {
  // Only called from client event handlers (Add Row), never during SSR.
  const id = `row-${clientRowSeq++}`;
  return {
    id,
    address: "",
    location: "Piura",
    coverageEth: "0.01",
  };
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Agricultural cooperative batch onboarding form — Demo Mode or live Stylus write.
 * Coverage is ETH wei paid from the crowdfunded relief pool on flood.
 */
export function BatchOnboardForm() {
  const formId = useId();
  const isDemoMode = useDemoStore((s) => s.isDemoMode);
  const { isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: ARBITRUM_SEPOLIA_CHAIN_ID });
  const [rows, setRows] = useState<FarmerRow[]>([INITIAL_ROW]);
  const [demoLoading, setDemoLoading] = useState(false);
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

  const coverageEthTotal = useMemo(
    () =>
      rows.reduce((sum, row) => {
        const n = Number(row.coverageEth);
        return sum + (Number.isFinite(n) && n > 0 ? n : 0);
      }, 0),
    [rows],
  );

  useEffect(() => {
    if (!isSuccess || !hash || notifiedHash.current === hash) return;
    notifiedHash.current = hash;
    toast.success(
      `Quest complete — ${rows.length} farmers armored on Arbitrum Sepolia.`,
      {
        description: `+${rows.length * 120} XP · ${coverageEthTotal.toFixed(3)} ETH coverage queued`,
      },
    );
  }, [isSuccess, hash, rows.length, coverageEthTotal]);

  useEffect(() => {
    if (!writeError) return;
    toast.error(parseRPCError(writeError));
  }, [writeError]);

  function updateRow(id: string, patch: Partial<FarmerRow>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, newRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }

  const busy = demoLoading || isPending || isConfirming;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (rows.length === 0) {
      toast.error("Add at least one farmer row.");
      return;
    }

    for (const row of rows) {
      if (!isAddress(row.address)) {
        toast.error(`Invalid farmer address: ${row.address || "(empty)"}`);
        return;
      }
      const amount = Number(row.coverageEth);
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error("Coverage must be a positive ETH amount.");
        return;
      }
    }

    if (isDemoMode) {
      setDemoLoading(true);
      await wait(2000);
      setDemoLoading(false);
      toast.success(
        `Demo quest clear — ${rows.length} policies registered (+${rows.length * 120} XP)!`,
      );
      return;
    }

    if (!isConnected) {
      toast.error("Connect a wallet to register farmers on-chain.");
      return;
    }

    const farmers = rows.map((r) => r.address as Address);
    const locations = rows.map((r) => r.location);
    const coverageAmounts = rows.map((r) => ethToWei(Number(r.coverageEth)));

    reset();
    notifiedHash.current = null;

    let maxFeePerGas: bigint | undefined;
    let maxPriorityFeePerGas: bigint | undefined;
    if (publicClient) {
      try {
        const fees = await estimateArbitrumSepoliaFees(publicClient);
        maxFeePerGas = fees.maxFeePerGas;
        maxPriorityFeePerGas = fees.maxPriorityFeePerGas;
      } catch {
        // Fall back to wallet defaults.
      }
    }

    try {
      await writeContractAsync({
        address: NINO_CONTRACT_ADDRESS,
        abi: elninoABI,
        functionName: "batchRegisterFarmers",
        args: [farmers, locations, coverageAmounts],
        chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
        ...(maxFeePerGas != null
          ? { maxFeePerGas, maxPriorityFeePerGas }
          : {}),
      });
    } catch {
      // writeError effect toasts a clean message.
    }
  }

  return (
    <div className="space-y-6">
      <OnboardingArena
        batchSize={rows.length}
        coverageEthTotal={coverageEthTotal}
      />

      <form
        data-testid="batch-onboard-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-5 rounded-2xl border border-border bg-secondary/70 p-4 shadow-[var(--shadow-soft)] sm:p-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Batch policy registration
            </h2>
            <p className="mt-1 text-sm text-[var(--accent)]">
              Cover each farmer in ETH. When rainfall ≥ 50mm, Stylus pays them
              from the crowdfunded relief pool — zero click.
            </p>
          </div>
          <span
            data-testid="batch-onboard-mode-badge"
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${
              isDemoMode
                ? "bg-emerald-500/15 text-emerald-700 ring-emerald-500/35 dark:text-emerald-300"
                : "bg-sky-500/10 text-sky-800 ring-sky-500/30 dark:text-sky-300"
            }`}
          >
            {isDemoMode ? "Demo Mode" : "Live Network"}
          </span>
        </div>

        <div className="space-y-3" role="list" aria-label="Farmer rows">
          {rows.map((row, index) => (
            <div
              key={row.id}
              role="listitem"
              data-testid={`farmer-row-${index}`}
              className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-background/50 p-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.6fr)_auto] sm:items-end"
            >
              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Farmer address
                </span>
                <input
                  data-testid={`farmer-address-${index}`}
                  name={`${formId}-address-${row.id}`}
                  type="text"
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="0x…"
                  value={row.address}
                  onChange={(ev) =>
                    updateRow(row.id, { address: ev.target.value.trim() })
                  }
                  className="min-h-11 w-full rounded-xl border border-border bg-secondary px-3 font-mono text-sm text-foreground outline-none ring-sky-500/40 focus:ring-2"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Location
                </span>
                <select
                  data-testid={`farmer-location-${index}`}
                  name={`${formId}-location-${row.id}`}
                  value={row.location}
                  onChange={(ev) =>
                    updateRow(row.id, {
                      location: ev.target.value as ElNinoLocation,
                    })
                  }
                  className="min-h-11 w-full rounded-xl border border-border bg-secondary px-3 text-sm font-semibold text-foreground outline-none ring-sky-500/40 focus:ring-2"
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
                  Coverage (ETH)
                </span>
                <input
                  data-testid={`farmer-coverage-${index}`}
                  name={`${formId}-coverage-${row.id}`}
                  type="number"
                  min={0}
                  step="0.001"
                  inputMode="decimal"
                  value={row.coverageEth}
                  onChange={(ev) =>
                    updateRow(row.id, { coverageEth: ev.target.value })
                  }
                  className="min-h-11 w-full rounded-xl border border-border bg-secondary px-3 text-sm font-semibold tabular-nums text-foreground outline-none ring-sky-500/40 focus:ring-2"
                />
              </label>

              <button
                type="button"
                data-testid={`farmer-remove-${index}`}
                aria-label={`Remove farmer row ${index + 1}`}
                disabled={rows.length <= 1 || busy}
                onClick={() => removeRow(row.id)}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold text-[var(--danger)] transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="size-4" aria-hidden />
                <span className="sm:hidden">Remove</span>
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            data-testid="add-farmer-row"
            onClick={addRow}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:border-sky-500/40 disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden />
            Add farmer (+120 XP)
          </button>

          <button
            type="submit"
            data-testid="batch-register-submit"
            disabled={busy}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 text-sm font-extrabold text-white shadow-[0_0_24px_rgba(245,158,11,0.4)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : null}
            {demoLoading
              ? "Simulating quest…"
              : isPending
                ? "Confirm in wallet…"
                : isConfirming
                  ? "Confirming on Stylus…"
                  : `Complete quest · Register ${rows.length}`}
          </button>
        </div>

        {!isDemoMode && !isConnected ? (
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            Connect a wallet to submit the live on-chain batch.
          </p>
        ) : null}
      </form>
    </div>
  );
}
