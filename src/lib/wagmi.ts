import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { arbitrumSepolia as arbitrumSepoliaBase } from "wagmi/chains";

/**
 * Arbitrum Sepolia base fees can tick between estimate and broadcast.
 * Raise the multiplier so client-side fee estimates stay above baseFee.
 */
export const arbitrumSepolia = {
  ...arbitrumSepoliaBase,
  fees: {
    ...arbitrumSepoliaBase.fees,
    baseFeeMultiplier: 2,
  },
} as typeof arbitrumSepoliaBase;

const rpcUrl =
  process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL ||
  "https://sepolia-rollup.arbitrum.io/rpc";

export const config = getDefaultConfig({
  appName: "ArbiYield AI",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "1234567890",
  chains: [arbitrumSepolia],
  ssr: true,
  transports: {
    [arbitrumSepolia.id]: http(rpcUrl),
  },
});
