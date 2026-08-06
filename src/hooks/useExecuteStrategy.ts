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
import { CONTRACT_ADDRESS, strategyExecutorABI } from "@/lib/contract";
import { estimateArbitrumSepoliaFees } from "@/lib/gas";
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
    if (!isSuccess || isDemoMode || !hash) return;

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

    void queryClient.invalidateQueries();
  }, [isSuccess, isDemoMode, hash, address, queryClient]);

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

  async function executeStrategy(
    strategyName: string,
    expectedYield: bigint,
  ) {
    if (isDemoMode) {
      chainLogger.info(
        {
          event: "demo_execute",
          strategyName,
          expectedYield,
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
      chainLogger.info(
        {
          event: "demo_execute_success",
          txHash: DEMO_TX_HASH,
          strategyName,
          expectedYield,
        },
        "Demo mode: mock transaction succeeded",
      );
      return;
    }

    // Re-estimate right before send. Arbitrum Sepolia base fee often moves
    // enough that a stale maxFeePerGas lands just under the new baseFee.
    let maxFeePerGas: bigint | undefined;
    let maxPriorityFeePerGas: bigint | undefined;
    let baseFee: bigint | undefined;

    if (publicClient) {
      try {
        const fees = await estimateArbitrumSepoliaFees(publicClient);
        baseFee = fees.baseFee;
        maxFeePerGas = fees.maxFeePerGas;
        maxPriorityFeePerGas = fees.maxPriorityFeePerGas;
      } catch {
        // Fall back to wagmi/wallet defaults if fee estimate fails.
      }
    }

    chainLogger.info(
      {
        event: "tx_send",
        functionName: "executeStrategy",
        contract: CONTRACT_ADDRESS,
        chainId: arbitrumSepolia.id,
        address,
        strategyName,
        expectedYield,
        gas: {
          baseFee,
          maxFeePerGas,
          maxPriorityFeePerGas,
        },
        args: [strategyName, expectedYield.toString()],
      },
      "Sending executeStrategy transaction",
    );

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
