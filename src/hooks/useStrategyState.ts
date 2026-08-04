"use client";

import { useAccount, useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, strategyExecutorABI } from "@/lib/contract";

export function useStrategyState() {
  const { address } = useAccount();

  const totalQuery = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: strategyExecutorABI,
    functionName: "totalStrategiesExecuted",
  });

  const userQuery = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: strategyExecutorABI,
    functionName: "getUserStrategyCount",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  return {
    totalExecuted: totalQuery.data,
    userStrategyCount: userQuery.data,
    isConnected: Boolean(address),
    isLoadingTotal: totalQuery.isLoading || totalQuery.isFetching,
    isLoadingUser: userQuery.isLoading || userQuery.isFetching,
    isError: totalQuery.isError || userQuery.isError,
  };
}
