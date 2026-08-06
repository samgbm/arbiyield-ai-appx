"use client";

import { useAccount, useReadContract } from "wagmi";
import { useDemoMode } from "@/components/providers/DemoModeProvider";
import { CONTRACT_ADDRESS, strategyExecutorABI } from "@/lib/contract";

export function useStrategyState() {
  const { isDemoMode } = useDemoMode();
  const { address } = useAccount();

  const totalQuery = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: strategyExecutorABI,
    functionName: "totalStrategiesExecuted",
    query: {
      enabled: !isDemoMode,
    },
  });

  const userQuery = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: strategyExecutorABI,
    functionName: "getUserStrategyCount",
    args: address ? [address] : undefined,
    query: {
      enabled: !isDemoMode && Boolean(address),
    },
  });

  if (isDemoMode) {
    return {
      totalExecuted: BigInt(1337),
      userStrategyCount: BigInt(42),
      isConnected: true,
      isLoadingTotal: false,
      isLoadingUser: false,
      isError: false,
    };
  }

  return {
    totalExecuted: totalQuery.data,
    userStrategyCount: userQuery.data,
    isConnected: Boolean(address),
    isLoadingTotal: totalQuery.isLoading || totalQuery.isFetching,
    isLoadingUser: userQuery.isLoading || userQuery.isFetching,
    isError: totalQuery.isError || userQuery.isError,
  };
}
