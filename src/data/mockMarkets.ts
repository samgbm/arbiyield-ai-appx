/**
 * Demo / pitch seed data for the Prediction Markets hub.
 * Used when Zustand `isDemoMode` is on so the marketplace never depends
 * on live Stylus + Supabase during a judge demo.
 */

export type MarketOption = {
  label: "Yes" | "No";
  /** ETH currently allocated to this side of the parimutuel pool. */
  poolAmount: number;
};

export type MockMarket = {
  id: string;
  title: string;
  description: string;
  category: "Crypto" | "Culture" | "AI" | "Sports" | "Macro";
  /** Total ETH liquidity in the shared PMM pool. */
  liquidityPool: number;
  endDate: string;
  options: [MarketOption, MarketOption];
  status: "active";
};

/** Shared frontend market shape (mock + on-chain parsed). */
export type Market = MockMarket;

export const mockMarkets: MockMarket[] = [
  {
    id: "eth-10k-2026",
    title: "Will ETH hit $10k in 2026?",
    description:
      "Resolves YES if CoinGecko ETH/USD prints at or above $10,000 on any UTC day before Jan 1, 2027. Official source: CoinGecko spot close.",
    category: "Crypto",
    liquidityPool: 184.5,
    endDate: "2026-12-31T23:59:59.000Z",
    options: [
      { label: "Yes", poolAmount: 112.2 },
      { label: "No", poolAmount: 72.3 },
    ],
    status: "active",
  },
  {
    id: "stylus-mainnet-q4",
    title: "Will Stylus mainnet TVL exceed $500M by Q4 2026?",
    description:
      "Resolves YES if DefiLlama reports aggregate Arbitrum Stylus-related TVL ≥ $500M on any snapshot before Oct 1, 2026.",
    category: "Crypto",
    liquidityPool: 96.8,
    endDate: "2026-09-30T23:59:59.000Z",
    options: [
      { label: "Yes", poolAmount: 41.1 },
      { label: "No", poolAmount: 55.7 },
    ],
    status: "active",
  },
  {
    id: "eth-lima-winner-ai",
    title: "Will an AI × Arbitrum project win ETH Lima 2026 grand prize?",
    description:
      "Resolves YES if the official ETH Lima 2026 winners announcement lists an Arbitrum + AI track project as overall grand prize winner.",
    category: "Culture",
    liquidityPool: 42.25,
    endDate: "2026-08-20T23:59:59.000Z",
    options: [
      { label: "Yes", poolAmount: 28.4 },
      { label: "No", poolAmount: 13.85 },
    ],
    status: "active",
  },
  {
    id: "openai-o-series-2026",
    title: "Will OpenAI ship a public o-series model before July 2026?",
    description:
      "Resolves YES if OpenAI publishes a generally available API model whose branding includes an o-series identifier before July 1, 2026 UTC.",
    category: "AI",
    liquidityPool: 128.0,
    endDate: "2026-06-30T23:59:59.000Z",
    options: [
      { label: "Yes", poolAmount: 79.5 },
      { label: "No", poolAmount: 48.5 },
    ],
    status: "active",
  },
  {
    id: "btc-etf-flows-sept",
    title: "Will US spot BTC ETFs see net inflows in September 2026?",
    description:
      "Resolves YES if aggregated US spot Bitcoin ETF net flows for September 2026 are positive per Bloomberg / Farside data releases.",
    category: "Macro",
    liquidityPool: 210.75,
    endDate: "2026-10-05T23:59:59.000Z",
    options: [
      { label: "Yes", poolAmount: 98.2 },
      { label: "No", poolAmount: 112.55 },
    ],
    status: "active",
  },
];
