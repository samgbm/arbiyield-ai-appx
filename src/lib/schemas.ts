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

/** AI Oracle verdict for prediction-market resolution. */
export const OracleVerdictSchema = z.object({
  verdict: z
    .enum(["YES", "NO", "UNDECIDED"])
    .describe("YES if the condition is met, NO if not, UNDECIDED if unclear"),
  reasoning: z
    .string()
    .describe("Brief impartial explanation of how the verdict was reached"),
  sources: z
    .array(
      z.object({
        title: z.string().describe("Source headline or site name"),
        // Plain string — OpenAI json_schema rejects format: "uri" from z.string().url().
        url: z
          .string()
          .describe("Public http(s) URL for compliance / verification"),
      }),
    )
    .describe("Links used as proof for the verdict (empty array if none)"),
});

export type OracleVerdict = z.infer<typeof OracleVerdictSchema>;
