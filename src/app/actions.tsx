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
import { normalizeMarketEndDate } from "@/utils/marketDates";

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

const CATEGORIES = ["Crypto", "Culture", "AI", "Sports", "Macro"] as const;

const SYSTEM_PROMPT = `You are the ArbiYield AI Market Creator for Arbitrum prediction markets.

Help the user define a clear YES/NO market. You MUST collect ALL four fields from the user before calling generateMarketCard:

1. title — a concise YES/NO question (e.g. "Will Brazil win the next FIFA World Cup?")
2. description — resolution criteria AND a public data source (how it resolves)
3. category — exactly one of: Crypto | Culture | AI | Sports | Macro
4. endDate — an explicit future date the user confirms (ISO preferred, e.g. 2026-12-31)

Conversation rules:
- Ask for missing fields. Prefer 1–2 short questions at a time.
- Do NOT invent or guess description, category, or endDate.
- Do NOT call generateMarketCard until the user has supplied (or clearly confirmed) every field above.
- When all four are present in the conversation, call generateMarketCard once with those exact values.
- After the tool runs, do not narrate the card — the UI renders it.
- Keep replies concise and pitch-friendly.`;

function missingMarketFields(input: {
  title: string;
  description: string;
  category: string;
  endDate: string;
}): string[] {
  const missing: string[] = [];
  const placeholder =
    /^(tbd|n\/?a|unknown|todo|none|null|undefined|\.+|-+)$/i;

  const title = input.title.trim();
  const description = input.description.trim();
  const endDate = input.endDate.trim();

  if (title.length < 8 || placeholder.test(title)) {
    missing.push("title (a clear YES/NO question)");
  }
  if (description.length < 24 || placeholder.test(description)) {
    missing.push("description (resolution criteria + data source)");
  }
  if (
    !CATEGORIES.includes(input.category as (typeof CATEGORIES)[number])
  ) {
    missing.push("category (Crypto, Culture, AI, Sports, or Macro)");
  }
  if (!endDate || placeholder.test(endDate) || Number.isNaN(Date.parse(endDate))) {
    missing.push("endDate (a future date, e.g. 2026-12-31)");
  }

  return missing;
}

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
    toolChoice: "auto",
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
          "Call ONLY after the user has provided title, description, category, and endDate. Never invent missing fields.",
        inputSchema: z.object({
          title: z
            .string()
            .min(8)
            .describe("Short YES/NO market question confirmed by the user"),
          description: z
            .string()
            .min(24)
            .describe(
              "Resolution criteria and public data source confirmed by the user",
            ),
          category: z
            .enum(CATEGORIES)
            .describe("Market category confirmed by the user"),
          endDate: z
            .string()
            .describe(
              "Future end date confirmed by the user (ISO-8601 preferred)",
            ),
        }),
        generate: async function* ({
          title,
          description,
          category,
          endDate,
        }: {
          title: string;
          description: string;
          category: (typeof CATEGORIES)[number];
          endDate: string;
        }) {
          yield (
            <div className="animate-pulse rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-[var(--muted)]">
              Checking market details…
            </div>
          );

          const missing = missingMarketFields({
            title,
            description,
            category,
            endDate,
          });

          if (missing.length > 0) {
            const ask = `I still need: ${missing.join("; ")}. Please reply with those details and I’ll generate the deploy card.`;
            history.done([
              ...(history.get() as ServerMessage[]),
              { role: "assistant", content: ask },
            ]);
            log.info({ missing }, "Blocked incomplete generateMarketCard call");
            return (
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {ask}
              </div>
            );
          }

          const normalizedEnd = normalizeMarketEndDate(endDate);

          history.done([
            ...(history.get() as ServerMessage[]),
            {
              role: "assistant",
              content: `Generated market card: ${title}`,
            },
          ]);

          log.info(
            { title, category, endDate: normalizedEnd, rawEndDate: endDate },
            "Streaming MarketPreviewCard via generateMarketCard tool",
          );

          return (
            <div className="w-full min-w-0" data-testid="generative-market-card">
              <MarketPreviewCard
                title={title.trim()}
                description={description.trim()}
                category={category}
                endDate={normalizedEnd}
              />
            </div>
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
