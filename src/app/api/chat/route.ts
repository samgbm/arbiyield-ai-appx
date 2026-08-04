import { streamText, type ModelMessage } from "ai";
import { DEFAULT_MODEL } from "@/lib/ai";

/** Allow longer generations on Vercel (complex strategies can exceed 10s). */
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are an expert DeFi strategist specializing in Arbitrum yield opportunities.
Respond only with concise, low-risk, verifiable strategies on Arbitrum (or Arbitrum-deployed protocols).
Prefer established lending markets, liquid staking, and reputable DEXes. Avoid leverage, unaudited farms, and speculative tips.
State key risks and assumptions clearly. This is educational, not financial advice.`;

export async function POST(req: Request) {
  const { messages }: { messages: ModelMessage[] } = await req.json();

  const result = streamText({
    model: DEFAULT_MODEL,
    system: SYSTEM_PROMPT,
    messages,
  });

  // AI SDK 7+: replaces the older toDataStreamResponse()
  return result.toUIMessageStreamResponse();
}
