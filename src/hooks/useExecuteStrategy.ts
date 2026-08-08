"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAccount,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useDemoMode } from "@/components/providers/DemoModeProvider";
import { chainLogger } from "@/lib/chainLogger";
import {
  CONTRACT_ADDRESS,
  strategyExecutorABI,
  strategyIdFromName,
} from "@/lib/contract";
import { estimateArbitrumSepoliaFees } from "@/lib/gas";
import type { Strategy } from "@/lib/schemas";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { arbitrumSepolia } from "@/lib/wagmi";

const DEMO_TX_HASH =
  "0xdemodemo000000000000000000000000000000000000000000000000000001" as `0x${string}`;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useExecuteStrategy() {
  const { isDemoMode } = useDemoMode();
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const publicClient = usePublicClient({ chainId: arbitrumSepolia.id });

  const [mockConfirming, setMockConfirming] = useState(false);
  const [mockWaiting, setMockWaiting] = useState(false);
  const [mockSuccess, setMockSuccess] = useState(false);
  const [pendingMeta, setPendingMeta] = useState<{
    id: string;
    strategy: Strategy;
  } | null>(null);

  const {
    writeContractAsync,
    data: hash,
    isPending: isConfirming,
    error,
    reset,
  } = useWriteContract();

  const { isLoading: isWaitingForTx, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (!isSuccess || isDemoMode || !hash || !pendingMeta || !address) return;

    chainLogger.info(
      {
        event: "tx_confirmed",
        txHash: hash,
        contract: CONTRACT_ADDRESS,
        chainId: arbitrumSepolia.id,
        address,
      },
      "Blockchain write confirmed",
    );

    const { id, strategy } = pendingMeta;
    void (async () => {
      try {
        const supabase = createSupabaseClient();
        await supabase.from("strategies").upsert(
          {
            id,
            name: strategy.strategyName,
            description: strategy.description,
            protocol: "AI Generated · Arbitrum",
            risk_level: strategy.riskLevel,
            apy_pct: strategy.expectedYield,
            tvl_usd: 0,
            execution_steps: strategy.steps,
            narrative: strategy.description,
            creator_address: address,
            create_tx_hash: hash,
            tags: ["AI", "Arbitrum"],
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );
      } catch (err) {
        chainLogger.error(
          { event: "supabase_strategy_upsert_failed", err },
          "Failed to mirror strategy metadata",
        );
      } finally {
        setPendingMeta(null);
        void queryClient.invalidateQueries();
      }
    })();
  }, [isSuccess, isDemoMode, hash, pendingMeta, address, queryClient]);

  useEffect(() => {
    if (!error || isDemoMode) return;
    chainLogger.error(
      {
        event: "tx_error",
        err: error,
        contract: CONTRACT_ADDRESS,
        address,
      },
      "Blockchain write failed",
    );
  }, [error, isDemoMode, address]);

  async function executeStrategy(strategy: Strategy) {
    const strategyName = strategy.strategyName.trim();
    const id = strategyIdFromName(strategyName);

    if (isDemoMode) {
      chainLogger.info(
        {
          event: "demo_execute",
          strategyName,
          id,
          address,
          contract: CONTRACT_ADDRESS,
        },
        "Demo mode: simulating strategy execution",
      );
      setMockSuccess(false);
      setMockWaiting(false);
      setMockConfirming(true);
      await wait(1000);
      setMockConfirming(false);
      setMockWaiting(true);
      await wait(2000);
      setMockWaiting(false);
      setMockSuccess(true);
      return;
    }

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

    setPendingMeta({ id, strategy });

    chainLogger.info(
      {
        event: "tx_send",
        functionName: "createStrategy",
        contract: CONTRACT_ADDRESS,
        chainId: arbitrumSepolia.id,
        address,
        id,
      },
      "Sending createStrategy transaction",
    );

    await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: strategyExecutorABI,
      functionName: "createStrategy",
      args: [id],
      ...(maxFeePerGas != null
        ? { maxFeePerGas, maxPriorityFeePerGas }
        : {}),
    });
  }

  function resetAll() {
    setMockConfirming(false);
    setMockWaiting(false);
    setMockSuccess(false);
    setPendingMeta(null);
    reset();
  }

  return {
    executeStrategy,
    isConfirming: isDemoMode ? mockConfirming : isConfirming,
    isWaitingForTx: isDemoMode ? mockWaiting : isWaitingForTx,
    isSuccess: isDemoMode ? mockSuccess : isSuccess,
    error: isDemoMode ? null : error,
    hash: isDemoMode && mockSuccess ? DEMO_TX_HASH : hash,
    reset: resetAll,
  };
}
