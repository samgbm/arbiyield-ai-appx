"use server";

import {
  createAI,
  getMutableAIState,
  streamUI,
} from "@ai-sdk/rsc";
import type { ReactNode } from "react";
import { z } from "zod";
import { openai } from "@/lib/ai";
import { MarketPreviewCard } from "@/components/markets/MarketPreviewCard";
import { logger } from "@/lib/logger";

/**
 * Server messages stored in AI state for multi-turn Market Creator chat.
 */
export type ServerMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ClientMessage = {
  id: number;
  role: "user" | "assistant";
  display: ReactNode;
};

const SYSTEM_PROMPT = `You are the ArbiYield AI Market Creator for Arbitrum prediction markets.
Help the user define a clear YES/NO market.
Ask clarifying questions until you have: title, description, category (Crypto|Culture|AI|Sports|Macro), and endDate (ISO-8601 date or datetime).
When you have all four fields, call the generateMarketCard tool.
Keep replies concise and pitch-friendly.`;

/**
 * Continues the Market Creator conversation and may stream a Generative UI card.
 */
export async function submitUserMessage(
  content: string,
): Promise<ClientMessage> {
  "use server";

  const requestId = crypto.randomUUID();
  const log = logger.child({ requestId, action: "submitUserMessage" });
  log.info({ contentPreview: content.slice(0, 120) }, "Market creator turn");

  const history = getMutableAIState();

  // Optimistic AI-state update with the latest user turn.
  history.update([
    ...(history.get() as ServerMessage[]),
    { role: "user", content },
  ]);

  const result = await streamUI({
    model: openai("gpt-4o"),
    system: SYSTEM_PROMPT,
    messages: history.get() as ServerMessage[],
    text: ({ content: textContent, done }) => {
      if (done) {
        history.done([
          ...(history.get() as ServerMessage[]),
          { role: "assistant", content: textContent },
        ]);
      }

      return (
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {textContent}
        </div>
      );
    },
    tools: {
      generateMarketCard: {
        description:
          "Render a Generative UI market preview card once title, description, category, and endDate are known.",
        inputSchema: z.object({
          title: z.string().describe("Short YES/NO market question"),
          description: z
            .string()
            .describe("Resolution criteria and data source"),
          category: z
            .enum(["Crypto", "Culture", "AI", "Sports", "Macro"])
            .describe("Market category"),
          endDate: z
            .string()
            .describe("ISO-8601 end date/time for market resolution"),
        }),
        generate: async function* ({
          title,
          description,
          category,
          endDate,
        }) {
          yield (
            <div className="animate-pulse rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-[var(--muted)]">
              Drafting market preview card…
            </div>
          );

          history.done([
            ...(history.get() as ServerMessage[]),
            {
              role: "assistant",
              content: `Generated market card: ${title}`,
            },
          ]);

          log.info(
            { title, category, endDate },
            "Streaming MarketPreviewCard via generateMarketCard tool",
          );

          return (
            <MarketPreviewCard
              title={title}
              description={description}
              category={category}
              endDate={endDate}
            />
          );
        },
      },
    },
  });

  return {
    id: Date.now(),
    role: "assistant",
    display: result.value,
  };
}

export type AIState = ServerMessage[];
export type UIState = ClientMessage[];

/**
 * AI context provider — wrap the Create Market route so useUIState / useActions work.
 */
export const AI = createAI({
  actions: {
    submitUserMessage,
  },
  initialAIState: [] as AIState,
  initialUIState: [] as UIState,
});
