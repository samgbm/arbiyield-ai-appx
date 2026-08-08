/**
 * Demo-only yield strategies for pitch / offline demos.
 * Live mode never imports these into the Strategies Hub data path.
 */

export type DemoStrategy = {
  id: string;
  name: string;
  apy: number;
  tvl: number;
  riskLevel: "low" | "medium" | "high";
  protocol: string;
  description: string;
  steps: string[];
  kpis: {
    sharpe: number;
    utilization: number;
    healthFactor: number;
    weeklyPnlPct: number;
  };
};

export const DEMO_STRATEGIES: DemoStrategy[] = [
  {
    id: "aave-usdc-supply",
    name: "Aave V3 USDC Supply",
    apy: 5.4,
    tvl: 12_400_000,
    riskLevel: "low",
    protocol: "Aave V3 · Arbitrum",
    description:
      "Blue-chip USDC lending on Aave V3 with conservative LTV and automatic interest accrual.",
    steps: [
      "Bridge or mint USDC on Arbitrum Sepolia",
      "Approve Aave V3 Pool to spend USDC",
      "Supply USDC into the Aave V3 market",
      "Monitor utilization and withdraw when APY compresses",
    ],
    kpis: {
      sharpe: 1.8,
      utilization: 68,
      healthFactor: 2.4,
      weeklyPnlPct: 0.11,
    },
  },
  {
    id: "gmx-glp-yield",
    name: "GMX GLP Yield Sleeve",
    apy: 11.2,
    tvl: 4_850_000,
    riskLevel: "medium",
    protocol: "GMX · Arbitrum",
    description:
      "Diversified GLP exposure capturing trader fees with hedged ETH/BTC beta overlays.",
    steps: [
      "Acquire a balanced ETH/USDC basket for GLP minting",
      "Mint GLP via the GMX vault",
      "Stake GLP to earn fee share",
      "Hedge directional beta with a small ETH short if needed",
    ],
    kpis: {
      sharpe: 1.2,
      utilization: 74,
      healthFactor: 1.7,
      weeklyPnlPct: 0.28,
    },
  },
  {
    id: "pendle-eth-pt",
    name: "Pendle stETH PT Ladder",
    apy: 8.6,
    tvl: 3_200_000,
    riskLevel: "medium",
    protocol: "Pendle · Arbitrum",
    description:
      "Fixed-yield principal tokens laddered across 30/60/90d maturities for predictable ETH yield.",
    steps: [
      "Source liquid stETH (or wstETH) on Arbitrum",
      "Split into PT/YT on Pendle for staggered maturities",
      "Hold PT ladder (30/60/90d) to lock fixed yield",
      "Roll matured PT into the next ladder rung",
    ],
    kpis: {
      sharpe: 1.5,
      utilization: 55,
      healthFactor: 3.1,
      weeklyPnlPct: 0.17,
    },
  },
  {
    id: "radiant-loop-eth",
    name: "Radiant ETH Loop (Conservative)",
    apy: 14.8,
    tvl: 1_950_000,
    riskLevel: "high",
    protocol: "Radiant · Arbitrum",
    description:
      "1.5× recursive ETH supply/borrow loop capped by a hard health-factor floor of 1.45.",
    steps: [
      "Deposit ETH as collateral on Radiant",
      "Borrow a conservative ETH amount (~0.5×)",
      "Re-supply borrowed ETH once (1.5× loop max)",
      "Auto-pause if health factor drops below 1.45",
    ],
    kpis: {
      sharpe: 0.9,
      utilization: 81,
      healthFactor: 1.52,
      weeklyPnlPct: 0.34,
    },
  },
  {
    id: "uniswap-eth-usdc",
    name: "Uniswap V3 ETH/USDC Narrow",
    apy: 9.1,
    tvl: 6_750_000,
    riskLevel: "medium",
    protocol: "Uniswap V3 · Arbitrum",
    description:
      "Active-range ETH/USDC LP with inventory rebalancing around ±4% of spot mid.",
    steps: [
      "Deposit balanced ETH and USDC",
      "Open a Uniswap V3 position in a ±4% spot band",
      "Harvest fees on a daily cadence",
      "Re-center the range when price exits the band",
    ],
    kpis: {
      sharpe: 1.1,
      utilization: 92,
      healthFactor: 2.0,
      weeklyPnlPct: 0.22,
    },
  },
];

export function getDemoStrategy(id: string): DemoStrategy | undefined {
  return DEMO_STRATEGIES.find((s) => s.id === id);
}
