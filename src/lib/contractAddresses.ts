/** Canonical Arbitrum Sepolia contract addresses for the three demo apps. */
export const YIELD_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x0d5170e733955952906011451dd89b7059e973a3") as `0x${string}`;

export const PMM_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_PMM_CONTRACT_ADDRESS ||
  "0x558a0f52d9fc7c0b13afe7965f6e757d6812527c") as `0x${string}`;

export const NINO_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_NINO_CONTRACT_ADDRESS ||
  "0x3b22f5c054919b8798d1422e92ba57f53b63570b") as `0x${string}`;

export const ARBISCAN_ADDRESS = "https://sepolia.arbiscan.io/address";
export const ARBISCAN_TX = "https://sepolia.arbiscan.io/tx";
