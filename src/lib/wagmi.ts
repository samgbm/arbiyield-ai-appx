import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrumSepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "ArbiYield AI",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "1234567890",
  chains: [arbitrumSepolia],
  ssr: true,
});
