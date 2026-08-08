"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  HeartHandshake,
  LoaderCircle,
  Waves,
  Zap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
  useWriteContract,
} from "wagmi";
import { parseEther } from "viem";
import {
  NINO_CONTRACT_ADDRESS,
  RELIEF_POOL_GOAL_ETH,
  ninoAbi,
} from "@/config/contracts";
import {
  ARBISCAN_TX,
  formatEthFromWei,
} from "@/lib/elninoContract";
import { estimateArbitrumSepoliaFees } from "@/lib/gas";
import { parseRPCError } from "@/utils/rpcErrorHandler";
import { useDemoStore } from "@/store/useDemoStore";

const ARBITRUM_SEPOLIA_CHAIN_ID = 421_614;
const PRESETS = ["0.01", "0.05", "0.1", "0.25"] as const;

type DonorRow = { address: `0x${string}`; amount: bigint };

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

/**
 * Disaster crowdfunding pool — donate ETH that zero-click pays farmers on flood.
 */
export function CrowdfundingPool() {
  const isDemoMode = useDemoStore((s) => s.isDemoMode);
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: ARBITRUM_SEPOLIA_CHAIN_ID });
  const [amountEth, setAmountEth] = useState("0.05");
  const [demoPool, setDemoPool] = useState(parseEther("0.42"));
  const [demoDonated, setDemoDonated] = useState(parseEther("0.55"));
  const [demoDisbursed] = useState(parseEther("0.13"));
  const [demoDonorCount, setDemoDonorCount] = useState(12);

  const { data: stats, refetch: refetchStats } = useReadContract({
    address: NINO_CONTRACT_ADDRESS,
    abi: ninoAbi,
    functionName: "getPoolStats",
    chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
    query: { enabled: !isDemoMode, refetchInterval: 12_000 },
  });

  const { data: myDonation, refetch: refetchMine } = useReadContract({
    address: NINO_CONTRACT_ADDRESS,
    abi: ninoAbi,
    functionName: "getDonation",
    args: address ? [address] : undefined,
    chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
    query: { enabled: !isDemoMode && Boolean(address) },
  });

  const {
    writeContractAsync,
    data: txHash,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useWatchContractEvent({
    address: NINO_CONTRACT_ADDRESS,
    abi: ninoAbi,
    eventName: "DonationReceived",
    chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
    enabled: !isDemoMode,
    onLogs() {
      void refetchStats();
      void refetchMine();
    },
  });

  useEffect(() => {
    if (!writeError) return;
    toast.error(parseRPCError(writeError));
  }, [writeError]);

  useEffect(() => {
    if (!isSuccess || !txHash) return;
    toast.success("Donation confirmed — ETH is in the zero-click relief pool.", {
      action: {
        label: "Arbiscan",
        onClick: () =>
          window.open(`${ARBISCAN_TX}/${txHash}`, "_blank", "noopener,noreferrer"),
      },
    });
    void refetchStats();
    void refetchMine();
  }, [isSuccess, txHash, refetchStats, refetchMine]);

  const onChainDonorCount = Number(stats?.[3] ?? BigInt(0));

  const { data: donors = [] } = useQuery({
    queryKey: ["nino-donor-leaderboard", onChainDonorCount],
    enabled:
      !isDemoMode &&
      Boolean(publicClient) &&
      Boolean(stats) &&
      Number.isFinite(onChainDonorCount) &&
      onChainDonorCount > 0,
    queryFn: async (): Promise<DonorRow[]> => {
      if (!publicClient) return [];
      const rows: DonorRow[] = [];
      const limit = Math.min(onChainDonorCount, 24);
      for (let i = 0; i < limit; i++) {
        const donor = await publicClient.readContract({
          address: NINO_CONTRACT_ADDRESS,
          abi: ninoAbi,
          functionName: "getDonorAt",
          args: [BigInt(i)],
        });
        if (!donor || donor === "0x0000000000000000000000000000000000000000") {
          continue;
        }
        const amount = await publicClient.readContract({
          address: NINO_CONTRACT_ADDRESS,
          abi: ninoAbi,
          functionName: "getDonation",
          args: [donor],
        });
        rows.push({ address: donor, amount });
      }
      rows.sort((a, b) =>
        a.amount === b.amount ? 0 : a.amount > b.amount ? -1 : 1,
      );
      return rows.slice(0, 8);
    },
  });

  const totalDonated = isDemoMode ? demoDonated : (stats?.[0] ?? BigInt(0));
  const totalDisbursed = isDemoMode ? demoDisbursed : (stats?.[1] ?? BigInt(0));
  const reliefPool = isDemoMode ? demoPool : (stats?.[2] ?? BigInt(0));
  const donorCount = isDemoMode ? demoDonorCount : onChainDonorCount;

  const goalWei = parseEther(String(RELIEF_POOL_GOAL_ETH));
  const progressPct = useMemo(() => {
    if (goalWei === BigInt(0)) return 0;
    const pct = Number((totalDonated * BigInt(10_000)) / goalWei) / 100;
    return Math.min(100, Math.max(0, pct));
  }, [totalDonated, goalWei]);

  const busy = isPending || isConfirming;

  async function handleDonate(e: React.FormEvent) {
    e.preventDefault();
    const eth = Number(amountEth);
    if (!Number.isFinite(eth) || eth <= 0) {
      toast.error("Enter a positive ETH amount.");
      return;
    }

    if (isDemoMode) {
      const wei = parseEther(amountEth);
      setDemoPool((p) => p + wei);
      setDemoDonated((p) => p + wei);
      setDemoDonorCount((c) => c + 1);
      toast.success(`Demo: donated ${amountEth} ETH to the coastal relief pool.`);
      return;
    }

    if (!isConnected) {
      toast.error("Connect a wallet on Arbitrum Sepolia to donate.");
      return;
    }

    reset();
    let maxFeePerGas: bigint | undefined;
    let maxPriorityFeePerGas: bigint | undefined;
    if (publicClient) {
      try {
        const fees = await estimateArbitrumSepoliaFees(publicClient);
        maxFeePerGas = fees.maxFeePerGas;
        maxPriorityFeePerGas = fees.maxPriorityFeePerGas;
      } catch {
        // wallet defaults
      }
    }

    try {
      await writeContractAsync({
        address: NINO_CONTRACT_ADDRESS,
        abi: ninoAbi,
        functionName: "donate",
        value: parseEther(amountEth),
        chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
        ...(maxFeePerGas != null
          ? { maxFeePerGas, maxPriorityFeePerGas }
          : {}),
      });
    } catch {
      // toast via writeError
    }
  }

  return (
    <div className="space-y-6" data-testid="crowdfunding-pool">
      <section className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-600/15 via-secondary/80 to-cyan-500/10 p-5 shadow-[var(--shadow-soft)] sm:p-7">
        <Waves
          className="pointer-events-none absolute -right-4 bottom-0 size-36 text-sky-500/15"
          aria-hidden
        />
        <p className="font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
          Coastal El Niño · Crowdfunded ETH pool
        </p>
        <h2 className="mt-2 max-w-xl text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Fuel zero-click flood payouts for coastal cooperatives
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--accent)]">
          Global donors top up this Stylus relief pool with real ETH. When the
          Climate Relayer pushes rainfall ≥ 50mm, active farmers are paid
          automatically from the pool — no banking delays, near-zero Arbitrum
          gas so almost 100% of your gift reaches the field.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Pool ready" value={`${formatEthFromWei(reliefPool)} ETH`} />
          <Stat label="Lifetime raised" value={`${formatEthFromWei(totalDonated)} ETH`} />
          <Stat
            label="Disbursed"
            value={`${formatEthFromWei(totalDisbursed)} ETH`}
          />
          <Stat label="Donors" value={String(donorCount)} />
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[var(--muted)]">
              Campaign goal · {RELIEF_POOL_GOAL_ETH} ETH
            </span>
            <span className="tabular-nums text-sky-700 dark:text-sky-300">
              {progressPct.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-background/70 ring-1 ring-sky-500/25">
            <div
              data-testid="pool-progress"
              className="h-full rounded-full bg-gradient-to-r from-sky-600 to-cyan-400 transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-border bg-secondary/70 p-5 shadow-[var(--shadow-soft)] lg:col-span-3">
          <header className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                Direct aid
              </p>
              <h3 className="text-xl font-bold text-foreground">Donate ETH</h3>
            </div>
            <HeartHandshake className="size-6 text-emerald-600" aria-hidden />
          </header>

          <form onSubmit={(e) => void handleDonate(e)} className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmountEth(p)}
                  className={`min-h-10 rounded-xl px-3 text-sm font-bold transition ${
                    amountEth === p
                      ? "bg-sky-600 text-white"
                      : "border border-border bg-background text-foreground"
                  }`}
                >
                  {p} ETH
                </button>
              ))}
            </div>

            <label className="block space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Custom amount (ETH)
              </span>
              <input
                data-testid="donate-amount"
                type="number"
                min={0}
                step="0.001"
                value={amountEth}
                onChange={(e) => setAmountEth(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold tabular-nums outline-none ring-sky-500/40 focus:ring-2"
              />
            </label>

            <button
              type="submit"
              data-testid="donate-submit"
              disabled={busy}
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 text-base font-extrabold text-white shadow-[0_0_28px_rgba(16,185,129,0.35)] transition hover:brightness-110 disabled:opacity-60"
            >
              {busy ? (
                <LoaderCircle className="size-5 animate-spin" aria-hidden />
              ) : (
                <Zap className="size-5" aria-hidden />
              )}
              {isPending
                ? "Confirm in wallet…"
                : isConfirming
                  ? "Sealing on Arbitrum…"
                  : `Donate ${amountEth || "0"} ETH`}
            </button>
          </form>

          {!isDemoMode && !isConnected ? (
            <p className="mt-3 text-xs font-semibold text-amber-700 dark:text-amber-300">
              Connect a wallet on Arbitrum Sepolia to donate live ETH.
            </p>
          ) : null}

          {!isDemoMode && myDonation != null && myDonation > BigInt(0) ? (
            <p className="mt-3 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
              Your on-chain total: {formatEthFromWei(myDonation)} ETH
            </p>
          ) : null}

          {txHash ? (
            <a
              href={`${ARBISCAN_TX}/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline dark:text-sky-300"
            >
              View donation tx on Arbiscan
              <ExternalLink className="size-3" aria-hidden />
            </a>
          ) : null}

          <div className="mt-5 grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-3">
            <p className="rounded-xl border border-border bg-background/50 p-3">
              <span className="font-bold text-foreground">Families</span> — housing,
              food, medical after coastal floods.
            </p>
            <p className="rounded-xl border border-border bg-background/50 p-3">
              <span className="font-bold text-foreground">Transparent</span> — every
              donate + payout is on Arbiscan.
            </p>
            <p className="rounded-xl border border-border bg-background/50 p-3">
              <span className="font-bold text-foreground">Urgent</span> — pool pays
              when rainfall hits 50mm, no committee delay.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-secondary/70 p-5 shadow-[var(--shadow-soft)] lg:col-span-2">
          <h3 className="text-lg font-bold text-foreground">Donor leaderboard</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Unique wallets ranked by cumulative on-chain gifts.
          </p>
          <ul className="mt-4 space-y-2" data-testid="donor-leaderboard">
            {(isDemoMode
              ? ([
                  {
                    address:
                      "0xca76951A11A9adE6553ef54AB1d1260f08c3460d" as `0x${string}`,
                    amount: parseEther("0.12"),
                  },
                  {
                    address:
                      "0x1111111111111111111111111111111111111111" as `0x${string}`,
                    amount: parseEther("0.08"),
                  },
                ] satisfies DonorRow[])
              : donors
            ).map((d, i) => (
              <li
                key={d.address}
                className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-3 py-2.5"
              >
                <span className="font-mono text-xs font-semibold">
                  #{i + 1} {shortAddr(d.address)}
                </span>
                <span className="text-sm font-extrabold tabular-nums text-emerald-700 dark:text-emerald-300">
                  {formatEthFromWei(d.amount)} ETH
                </span>
              </li>
            ))}
            {!isDemoMode && donors.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-[var(--muted)]">
                Be the first donor after redeploy — your wallet leads the board.
              </li>
            ) : null}
          </ul>

          <Link
            href="/el-nino/oracle"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500/35 bg-sky-500/10 px-3 py-3 text-sm font-bold text-sky-800 dark:text-sky-200"
          >
            Watch live zero-click payout feed
          </Link>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/55 px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 text-lg font-extrabold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}
