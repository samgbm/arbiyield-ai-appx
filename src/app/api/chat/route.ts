import { streamObject, type ModelMessage } from "ai";
import { DEFAULT_MODEL } from "@/lib/ai";
import { StrategySchema } from "@/lib/schemas";

/** Allow longer generations on Vercel (complex strategies can exceed 10s). */
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a DeFi strategist. You must respond with a JSON object detailing a yield strategy on Arbitrum, adhering strictly to the requested schema.
Focus on low-risk, verifiable Arbitrum (or Arbitrum-deployed) opportunities such as established lending markets, liquid staking, and reputable DEXes.
Avoid leverage, unaudited farms, and speculative tips. expectedYield must be an integer APY percentage. This is educational, not financial advice.`;

export async function POST(req: Request) {
  const { messages }: { messages: ModelMessage[] } = await req.json();

  const result = streamObject({
    model: DEFAULT_MODEL,
    schema: StrategySchema,
    system: SYSTEM_PROMPT,
    messages,
  });

  // Text JSON object stream consumed by experimental_useObject / useObject.
  return result.toTextStreamResponse();
}
