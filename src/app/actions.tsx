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
import {
  isEndDateInFuture,
  isRelativeEndDate,
  normalizeMarketEndDate,
} from "@/utils/marketDates";
import { logger } from "@/utils/logger";

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
4. endDate — a FUTURE end time the user confirms. Accept either:
   - absolute ISO/date (e.g. 2026-12-31), OR
   - relative demo offsets exactly as typed: "in 20 seconds", "in 30 seconds", "+45s", "5m"
   Reject past absolute dates. For relative offsets, pass the relative string through unchanged (do not convert to ISO yourself).

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
  if (!endDate || placeholder.test(endDate)) {
    missing.push(
      'endDate (future date or relative like "in 30 seconds")',
    );
  } else {
    try {
      if (!isRelativeEndDate(endDate)) {
        normalizeMarketEndDate(endDate);
      }
      if (!isEndDateInFuture(endDate)) {
        missing.push(
          'endDate (must be in the future, e.g. 2026-12-31 or "in 30 seconds")',
        );
      }
    } catch {
      missing.push(
        'endDate (future date or relative like "in 30 seconds")',
      );
    }
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
  logger.info({ prompt: content }, "Initiating AI market generation");
  log.info({ contentPreview: content.slice(0, 120) }, "Market creator turn");

  const history = getMutableAIState();

  // Optimistic AI-state update with the latest user turn.
  history.update([
    ...(history.get() as ServerMessage[]),
    { role: "user", content },
  ]);

  try {
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
                'Future end: ISO date OR relative string like "in 20 seconds" / "in 30 seconds" (pass relative strings unchanged)',
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

            // Keep relative offsets raw so Deploy evaluates them at click time.
            const cardEndDate = isRelativeEndDate(endDate)
              ? endDate.trim()
              : normalizeMarketEndDate(endDate);

            history.done([
              ...(history.get() as ServerMessage[]),
              {
                role: "assistant",
                content: `Generated market card: ${title}`,
              },
            ]);

            log.info(
              { title, category, endDate: cardEndDate, rawEndDate: endDate },
              "Streaming MarketPreviewCard via generateMarketCard tool",
            );

            return (
              <div className="w-full min-w-0" data-testid="generative-market-card">
                <MarketPreviewCard
                  title={title.trim()}
                  description={description.trim()}
                  category={category}
                  endDate={cardEndDate}
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
  } catch (error) {
    logger.error({ error }, "AI generation failed");
    const message =
      error instanceof Error
        ? error.message
        : "AI generation failed. Please try again.";
    history.done([
      ...(history.get() as ServerMessage[]),
      { role: "assistant", content: message },
    ]);
    return {
      id: Date.now(),
      role: "assistant",
      display: (
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--danger)]">
          {message}
        </div>
      ),
    };
  }
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
