"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useDemoMode } from "@/components/providers/DemoModeProvider";
import { CONTRACT_ADDRESS, strategyExecutorABI } from "@/lib/contract";
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
  const queryClient = useQueryClient();
  const publicClient = usePublicClient({ chainId: arbitrumSepolia.id });

  const [mockConfirming, setMockConfirming] = useState(false);
  const [mockWaiting, setMockWaiting] = useState(false);
  const [mockSuccess, setMockSuccess] = useState(false);

  const {
    writeContract,
    data: hash,
    isPending: isConfirming,
    error,
    reset,
  } = useWriteContract();

  const { isLoading: isWaitingForTx, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (!isSuccess || isDemoMode) return;
    void queryClient.invalidateQueries();
  }, [isSuccess, isDemoMode, queryClient]);

  async function executeStrategy(
    strategyName: string,
    expectedYield: bigint,
  ) {
    if (isDemoMode) {
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

    // Re-estimate right before send. Arbitrum Sepolia base fee often moves
    // enough that a stale maxFeePerGas lands just under the new baseFee.
    let maxFeePerGas: bigint | undefined;
    let maxPriorityFeePerGas: bigint | undefined;

    if (publicClient) {
      const fallbackPriority = BigInt(10_000_000);
      const [block, priorityFee] = await Promise.all([
        publicClient.getBlock({ blockTag: "latest" }),
        publicClient
          .estimateMaxPriorityFeePerGas()
          .catch(() => fallbackPriority),
      ]);

      const baseFee = block.baseFeePerGas ?? BigInt(20_000_000);
      const priority =
        priorityFee > BigInt(0) ? priorityFee : fallbackPriority;
      maxPriorityFeePerGas = priority;
      maxFeePerGas = baseFee * BigInt(2) + priority;
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: strategyExecutorABI,
      functionName: "executeStrategy",
      args: [strategyName, expectedYield],
      ...(maxFeePerGas != null
        ? { maxFeePerGas, maxPriorityFeePerGas }
        : {}),
    });
  }

  function resetAll() {
    setMockConfirming(false);
    setMockWaiting(false);
    setMockSuccess(false);
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
