import { z } from "zod";

/** Structured yield strategy emitted by the AI for Generative UI. */
export const StrategySchema = z.object({
  strategyName: z
    .string()
    .describe('Short strategy title, e.g. "USDC Low-Risk Lending"'),
  expectedYield: z
    .number()
    .int()
    .describe("Expected APY as an integer percentage, e.g. 5"),
  riskLevel: z.enum(["low", "medium", "high"]),
  description: z
    .string()
    .describe("Concise explanation of the strategy and why it fits"),
  steps: z
    .array(z.string())
    .describe("Ordered steps to execute the strategy on Arbitrum"),
});

export type Strategy = z.infer<typeof StrategySchema>;
