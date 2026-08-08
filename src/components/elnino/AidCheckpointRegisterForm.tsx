"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, LoaderCircle, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import {
  useAccount,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { NINO_CONTRACT_ADDRESS, ninoAbi } from "@/config/contracts";
import {
  AID_STEP_TYPES,
  computeAidStepHash,
  isBytes32Hex,
  type AidStepType,
} from "@/lib/aidProvenance";
import { ARBISCAN_TX } from "@/lib/elninoContract";
import { estimateArbitrumSepoliaFees } from "@/lib/gas";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { parseRPCError } from "@/utils/rpcErrorHandler";
import type { Hex } from "viem";

const ARBITRUM_SEPOLIA_CHAIN_ID = 421_614;

type Mode = "genesis" | "continue";

function toIsoArrived(localValue: string): string {
  const d = new Date(localValue);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid arrival time");
  }
  return d.toISOString();
}

function shortHash(hash: string) {
  return `${hash.slice(0, 10)}…${hash.slice(-4)}`;
}

/**
 * Register a new aid shipment (genesis) or append a chained checkpoint.
 * Writes Stylus `logAidCheckpoint` + Supabase off-chain detail.
 */
export function AidCheckpointRegisterForm() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: ARBITRUM_SEPOLIA_CHAIN_ID });
  const [mode, setMode] = useState<Mode>("genesis");
  const [trailCode, setTrailCode] = useState("");
  const [productName, setProductName] = useState("");
  const [originFarm, setOriginFarm] = useState("");
  const [parentHash, setParentHash] = useState("");
  const [stepType, setStepType] = useState<AidStepType>("farm");
  const [locationName, setLocationName] = useState("");
  const [facilityId, setFacilityId] = useState("");
  const [farmName, setFarmName] = useState("");
  const [weightKg, setWeightKg] = useState("500");
  const [tempC, setTempC] = useState("22");
  const [sensorId, setSensorId] = useState("SEN-1");
  const [handlerName, setHandlerName] = useState("");
  const [arrivedLocal, setArrivedLocal] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [savingOffchain, setSavingOffchain] = useState(false);
  const [result, setResult] = useState<{
    stepHash: `0x${string}`;
    txHash: `0x${string}`;
  } | null>(null);
  const [lookingUpParent, setLookingUpParent] = useState(false);

  const {
    writeContractAsync,
    data: pendingTx,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: pendingTx,
  });

  useEffect(() => {
    if (!writeError) return;
    toast.error(parseRPCError(writeError));
  }, [writeError]);

  useEffect(() => {
    if (mode === "genesis") {
      setStepType("farm");
      setParentHash("");
      return;
    }
    if (stepType === "farm") setStepType("factory");
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fill trail metadata from parent checkpoint.
  useEffect(() => {
    if (mode !== "continue") return;
    const trimmed = parentHash.trim().toLowerCase();
    if (!isBytes32Hex(trimmed)) return;

    let cancelled = false;
    setLookingUpParent(true);
    void (async () => {
      try {
        const supabase = createSupabaseClient();
        const { data: parent } = await supabase
          .from("aid_checkpoints")
          .select("shipment_id, step_type, step_index")
          .eq("step_hash", trimmed)
          .maybeSingle();
        if (!parent || cancelled) return;

        const { data: ship } = await supabase
          .from("aid_shipments")
          .select("trail_code, product_name, origin_farm")
          .eq("id", parent.shipment_id)
          .maybeSingle();
        if (!ship || cancelled) return;

        setTrailCode(ship.trail_code ?? "");
        setProductName(ship.product_name ?? "");
        setOriginFarm(ship.origin_farm ?? "");

        const order: AidStepType[] = ["farm", "factory", "depot", "store"];
        const idx = order.indexOf(parent.step_type as AidStepType);
        if (idx >= 0 && idx < order.length - 1) {
          setStepType(order[idx + 1]!);
        }
      } catch {
        // Manual entry still works.
      } finally {
        if (!cancelled) setLookingUpParent(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, parentHash]);

  const previewHash = useMemo(() => {
    try {
      const weight = Number(weightKg);
      const temp = Number(tempC);
      if (!trailCode.trim() || !locationName.trim() || !facilityId.trim()) {
        return null;
      }
      if (!Number.isFinite(weight) || !Number.isFinite(temp)) return null;
      if (!sensorId.trim()) return null;
      const arrivedAt = toIsoArrived(arrivedLocal);
      const parent =
        mode === "continue" && isBytes32Hex(parentHash.trim())
          ? (parentHash.trim().toLowerCase() as Hex)
          : null;
      if (mode === "continue" && !parent) return null;
      return computeAidStepHash(parent, [
        trailCode.trim(),
        stepType,
        locationName.trim(),
        facilityId.trim(),
        String(weight),
        String(temp),
        sensorId.trim(),
        arrivedAt,
      ]);
    } catch {
      return null;
    }
  }, [
    mode,
    parentHash,
    trailCode,
    stepType,
    locationName,
    facilityId,
    weightKg,
    tempC,
    sensorId,
    arrivedLocal,
  ]);

  const busy = isPending || isConfirming || savingOffchain;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    reset();

    if (!isConnected) {
      toast.error("Connect a wallet to notarize on Arbitrum Sepolia.");
      return;
    }
    if (!publicClient) {
      toast.error("RPC client unavailable.");
      return;
    }

    const code = trailCode.trim();
    const product = productName.trim();
    const farm = originFarm.trim() || farmName.trim();
    const location = locationName.trim();
    const facility = facilityId.trim();
    const sensor = sensorId.trim();
    const handler = handlerName.trim() || "Handler";
    const weight = Number(weightKg);
    const temp = Number(tempC);

    if (!code || !product || !location || !facility || !sensor) {
      toast.error("Fill trail code, product, location, facility, and sensor.");
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(temp)) {
      toast.error("Enter valid weight (kg) and temperature (°C).");
      return;
    }

    let arrivedAt: string;
    try {
      arrivedAt = toIsoArrived(arrivedLocal);
    } catch {
      toast.error("Invalid arrival time.");
      return;
    }

    let parent: Hex | null = null;
    if (mode === "continue") {
      const p = parentHash.trim().toLowerCase();
      if (!isBytes32Hex(p)) {
        toast.error("Parent hash must be a valid bytes32 (0x + 64 hex).");
        return;
      }
      parent = p as Hex;
    } else if (stepType !== "farm") {
      toast.error("Genesis shipments must start with a farm checkpoint.");
      return;
    }

    const stepHash = computeAidStepHash(parent, [
      code,
      stepType,
      location,
      facility,
      String(weight),
      String(temp),
      sensor,
      arrivedAt,
    ]);

    // Reject duplicate on-chain hash early.
    const existing = await publicClient.readContract({
      address: NINO_CONTRACT_ADDRESS,
      abi: ninoAbi,
      functionName: "verifyAidBatch",
      args: [stepHash],
    });
    if (existing[1] > BigInt(0)) {
      toast.error("This hash is already notarized on-chain (immutable).");
      return;
    }

    if (parent) {
      const parentOnChain = await publicClient.readContract({
        address: NINO_CONTRACT_ADDRESS,
        abi: ninoAbi,
        functionName: "verifyAidBatch",
        args: [parent],
      });
      if (parentOnChain[1] === BigInt(0)) {
        toast.error("Parent hash is not notarized on-chain yet.");
        return;
      }
    }

    toast.message("Submitting logAidCheckpoint on Arbitrum Sepolia…");

    let maxFeePerGas: bigint | undefined;
    let maxPriorityFeePerGas: bigint | undefined;
    try {
      const fees = await estimateArbitrumSepoliaFees(publicClient);
      maxFeePerGas = fees.maxFeePerGas;
      maxPriorityFeePerGas = fees.maxPriorityFeePerGas;
    } catch {
      // wallet defaults
    }

    try {
      const txHash = await writeContractAsync({
        address: NINO_CONTRACT_ADDRESS,
        abi: ninoAbi,
        functionName: "logAidCheckpoint",
        args: [stepHash, location],
        chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
        ...(maxFeePerGas != null
          ? { maxFeePerGas, maxPriorityFeePerGas }
          : {}),
      });

      toast.message("Waiting for confirmation…", {
        description: shortHash(txHash),
      });
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      if (receipt.status !== "success") {
        toast.error("On-chain notarization reverted.");
        return;
      }

      setSavingOffchain(true);
      const supabase = createSupabaseClient();
      let shipmentId: string | undefined;
      let stepIndex = 0;

      if (mode === "genesis") {
        const { data: ship, error: shipErr } = await supabase
          .from("aid_shipments")
          .insert({
            trail_code: code,
            product_name: product,
            origin_farm: farm || "Unknown farm",
            tip_hash: stepHash,
            tip_tx_hash: txHash,
            is_flagged: false,
          })
          .select("id")
          .single();
        if (shipErr || !ship) {
          throw new Error(shipErr?.message ?? "Failed to create shipment");
        }
        shipmentId = ship.id as string;
        stepIndex = 0;
      } else {
        const { data: parentRow, error: parentErr } = await supabase
          .from("aid_checkpoints")
          .select("shipment_id, step_index")
          .eq("step_hash", parent!)
          .maybeSingle();
        if (parentErr || !parentRow) {
          throw new Error(
            parentErr?.message ??
              "Parent hash not found off-chain — register genesis first.",
          );
        }
        shipmentId = parentRow.shipment_id as string;
        stepIndex = Number(parentRow.step_index) + 1;

        const { error: tipErr } = await supabase
          .from("aid_shipments")
          .update({
            tip_hash: stepHash,
            tip_tx_hash: txHash,
            product_name: product,
          })
          .eq("id", shipmentId);
        if (tipErr) throw new Error(tipErr.message);
      }

      const { error: cpErr } = await supabase.from("aid_checkpoints").insert({
        shipment_id: shipmentId,
        step_index: stepIndex,
        step_type: stepType,
        location_name: location,
        facility_id: facility,
        farm_name: farmName.trim() || (mode === "genesis" ? farm : null),
        batch_weight_kg: weight,
        temperature_c: temp,
        sensor_id: sensor,
        handler_name: handler,
        arrived_at: arrivedAt,
        departed_at: null,
        parent_hash: parent,
        step_hash: stepHash,
        tx_hash: txHash,
      });
      if (cpErr) throw new Error(cpErr.message);

      setResult({ stepHash, txHash });
      toast.success("Checkpoint notarized on-chain and saved off-chain.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : parseRPCError(err),
      );
    } finally {
      setSavingOffchain(false);
    }
  }

  const fieldClass =
    "min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none ring-sky-500/40 focus:ring-2";
  const labelClass =
    "text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]";

  return (
    <section
      data-testid="aid-checkpoint-register"
      className="rounded-2xl border border-border bg-secondary/70 p-5 shadow-[var(--shadow-soft)]"
    >
      <header className="mb-5 space-y-1">
        <p className="font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
          Aid Route Notary
        </p>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Register Checkpoint
        </h2>
        <p className="text-sm text-[var(--accent)]">
          Generate a chained keccak hash, seal it with Stylus{" "}
          <code className="font-mono text-xs">logAidCheckpoint</code>, and
          mirror human-readable detail in Supabase.
        </p>
      </header>

      <div className="mb-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          data-testid="mode-genesis"
          onClick={() => setMode("genesis")}
          className={`min-h-11 rounded-xl text-sm font-bold transition ${
            mode === "genesis"
              ? "bg-sky-600 text-white"
              : "border border-border bg-background text-foreground"
          }`}
        >
          New shipment
        </button>
        <button
          type="button"
          data-testid="mode-continue"
          onClick={() => setMode("continue")}
          className={`min-h-11 rounded-xl text-sm font-bold transition ${
            mode === "continue"
              ? "bg-sky-600 text-white"
              : "border border-border bg-background text-foreground"
          }`}
        >
          Next checkpoint
        </button>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {mode === "continue" ? (
          <label className="block space-y-1.5">
            <span className={labelClass}>
              Parent hash {lookingUpParent ? "(looking up…)" : ""}
            </span>
            <input
              data-testid="parent-hash-input"
              value={parentHash}
              onChange={(e) => setParentHash(e.target.value)}
              placeholder="0x… previous checkpoint"
              spellCheck={false}
              className={`${fieldClass} font-mono text-xs`}
              required
            />
          </label>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className={labelClass}>Trail code</span>
            <input
              data-testid="trail-code"
              value={trailCode}
              onChange={(e) => setTrailCode(e.target.value)}
              placeholder="AID-011"
              className={fieldClass}
              required
              readOnly={mode === "continue" && Boolean(trailCode)}
            />
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>Step type</span>
            <select
              data-testid="step-type"
              value={stepType}
              onChange={(e) => setStepType(e.target.value as AidStepType)}
              className={fieldClass}
              disabled={mode === "genesis"}
            >
              {AID_STEP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className={labelClass}>Product name</span>
          <input
            data-testid="product-name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Flood-relief rice kits"
            className={fieldClass}
            required
          />
        </label>

        {mode === "genesis" ? (
          <label className="block space-y-1.5">
            <span className={labelClass}>Origin farm</span>
            <input
              data-testid="origin-farm"
              value={originFarm}
              onChange={(e) => setOriginFarm(e.target.value)}
              placeholder="Cooperativa Piura Norte"
              className={fieldClass}
              required
            />
          </label>
        ) : null}

        <label className="block space-y-1.5">
          <span className={labelClass}>Location name</span>
          <input
            data-testid="location-name"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Piura Cooperative Hub"
            className={fieldClass}
            required
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className={labelClass}>Facility ID</span>
            <input
              data-testid="facility-id"
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              placeholder="FARM-PIU-01"
              className={fieldClass}
              required
            />
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>Handler</span>
            <input
              data-testid="handler-name"
              value={handlerName}
              onChange={(e) => setHandlerName(e.target.value)}
              placeholder="Maria Quispe"
              className={fieldClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block space-y-1.5">
            <span className={labelClass}>Weight (kg)</span>
            <input
              data-testid="weight-kg"
              type="number"
              min={0}
              step="any"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className={fieldClass}
              required
            />
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>Temp (°C)</span>
            <input
              data-testid="temp-c"
              type="number"
              step="any"
              value={tempC}
              onChange={(e) => setTempC(e.target.value)}
              className={fieldClass}
              required
            />
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>Sensor ID</span>
            <input
              data-testid="sensor-id"
              value={sensorId}
              onChange={(e) => setSensorId(e.target.value)}
              className={fieldClass}
              required
            />
          </label>
        </div>

        {mode === "genesis" ? (
          <label className="block space-y-1.5">
            <span className={labelClass}>Farm name (detail)</span>
            <input
              data-testid="farm-name"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              placeholder="Optional display name"
              className={fieldClass}
            />
          </label>
        ) : null}

        <label className="block space-y-1.5">
          <span className={labelClass}>Arrival time</span>
          <input
            data-testid="arrived-at"
            type="datetime-local"
            value={arrivedLocal}
            onChange={(e) => setArrivedLocal(e.target.value)}
            className={fieldClass}
            required
          />
        </label>

        <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 px-3 py-3">
          <p className={labelClass}>Generated step hash</p>
          <p
            data-testid="preview-hash"
            className="mt-1 break-all font-mono text-xs font-semibold text-foreground"
          >
            {previewHash ?? "Fill required fields to preview keccak chain hash…"}
          </p>
        </div>

        <button
          type="submit"
          data-testid="register-checkpoint"
          disabled={busy || !previewHash}
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-5 text-base font-extrabold text-white shadow-[0_0_32px_rgba(2,132,199,0.4)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <LoaderCircle className="size-5 animate-spin" aria-hidden />
          ) : (
            <PackagePlus className="size-5" aria-hidden />
          )}
          {isPending
            ? "Confirm in wallet…"
            : isConfirming
              ? "Confirming on Arbitrum…"
              : savingOffchain
                ? "Saving off-chain…"
                : "Register on-chain + off-chain"}
        </button>
      </form>

      {!isConnected ? (
        <p className="mt-3 text-xs font-semibold text-amber-700 dark:text-amber-300">
          Connect your wallet on Arbitrum Sepolia to notarize checkpoints.
        </p>
      ) : null}

      {result ? (
        <div
          data-testid="register-success"
          className="mt-5 space-y-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4"
        >
          <p className="text-sm font-extrabold text-emerald-800 dark:text-emerald-200">
            Checkpoint sealed
          </p>
          <p className="break-all font-mono text-[11px] text-foreground">
            {result.stepHash}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              data-testid="arbiscan-tx-link"
              href={`${ARBISCAN_TX}/${result.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-sky-500/35 bg-sky-500/10 px-3 text-sm font-semibold text-sky-800 hover:underline dark:text-sky-200"
            >
              View tx on Arbiscan
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
            <Link
              href={`/el-nino/logistics?hash=${result.stepHash}`}
              data-testid="open-tracker-link"
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white hover:brightness-110"
            >
              Verify on Logistics Tracker
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
