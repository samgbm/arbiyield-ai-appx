import type { PublicClient } from "viem";

export type EstimatedEip1559Fees = {
  baseFee: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
};

/**
 * Arbitrum Sepolia base fees often tick between estimate and broadcast.
 * Re-read latest baseFee and pad maxFee so MetaMask doesn't reject with
 * "max fee per gas less than block base fee".
 */
export async function estimateArbitrumSepoliaFees(
  publicClient: PublicClient,
): Promise<EstimatedEip1559Fees> {
  const fallbackPriority = BigInt(10_000_000);
  const [block, priorityFee] = await Promise.all([
    publicClient.getBlock({ blockTag: "latest" }),
    publicClient.estimateMaxPriorityFeePerGas().catch(() => fallbackPriority),
  ]);

  const baseFee = block.baseFeePerGas ?? BigInt(20_000_000);
  const maxPriorityFeePerGas =
    priorityFee > BigInt(0) ? priorityFee : fallbackPriority;
  // 3× base + priority: covers base-fee ticks between wallet prompt and send.
  const maxFeePerGas = baseFee * BigInt(3) + maxPriorityFeePerGas;

  return { baseFee, maxFeePerGas, maxPriorityFeePerGas };
}
