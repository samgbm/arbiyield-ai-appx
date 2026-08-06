"use client";

import { useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useDemoMode } from "@/components/providers/DemoModeProvider";
import { chainLogger } from "@/lib/chainLogger";
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

  useEffect(() => {
    if (!isDemoMode) return;

    chainLogger.info(
      {
        event: "demo_read",
        contract: CONTRACT_ADDRESS,
        totalExecuted: 1337,
        userStrategyCount: 42,
      },
      "Demo mode: serving mock strategy ledger reads",
    );
  }, [isDemoMode]);

  useEffect(() => {
    if (isDemoMode || totalQuery.data === undefined) return;

    chainLogger.info(
      {
        event: "contract_receive",
        contract: CONTRACT_ADDRESS,
        functionName: "totalStrategiesExecuted",
        data: totalQuery.data,
      },
      "Received totalStrategiesExecuted",
    );
  }, [isDemoMode, totalQuery.data]);

  useEffect(() => {
    if (isDemoMode || userQuery.data === undefined || !address) return;

    chainLogger.info(
      {
        event: "contract_receive",
        contract: CONTRACT_ADDRESS,
        functionName: "getUserStrategyCount",
        address,
        data: userQuery.data,
      },
      "Received getUserStrategyCount",
    );
  }, [isDemoMode, userQuery.data, address]);

  useEffect(() => {
    if (isDemoMode) return;
    if (totalQuery.error) {
      chainLogger.error(
        {
          event: "contract_read_error",
          functionName: "totalStrategiesExecuted",
          contract: CONTRACT_ADDRESS,
          err: totalQuery.error,
        },
        "Failed to read totalStrategiesExecuted",
      );
    }
    if (userQuery.error) {
      chainLogger.error(
        {
          event: "contract_read_error",
          functionName: "getUserStrategyCount",
          contract: CONTRACT_ADDRESS,
          address,
          err: userQuery.error,
        },
        "Failed to read getUserStrategyCount",
      );
    }
  }, [isDemoMode, totalQuery.error, userQuery.error, address]);

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
