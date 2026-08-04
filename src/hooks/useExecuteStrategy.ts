"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { CONTRACT_ADDRESS, strategyExecutorABI } from "@/lib/contract";
import { arbitrumSepolia } from "@/lib/wagmi";

export function useExecuteStrategy() {
  const queryClient = useQueryClient();
  const publicClient = usePublicClient({ chainId: arbitrumSepolia.id });

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
    if (!isSuccess) return;
    void queryClient.invalidateQueries();
  }, [isSuccess, queryClient]);

  async function executeStrategy(
    strategyName: string,
    expectedYield: bigint,
  ) {
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

  return {
    executeStrategy,
    isConfirming,
    isWaitingForTx,
    isSuccess,
    error,
    hash,
    reset,
  };
}
