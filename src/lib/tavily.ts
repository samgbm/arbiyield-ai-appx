import { tool } from "ai";
import { tavily } from "@tavily/core";
import { z } from "zod";

export type TavilySearchToolOptions = {
  apiKey?: string;
  searchDepth?: "basic" | "advanced" | "fast" | "ultra-fast";
  includeAnswer?: boolean;
  maxResults?: number;
  topic?: "general" | "news" | "finance";
  timeRange?: "year" | "month" | "week" | "day" | "y" | "m" | "w" | "d";
};

/**
 * AI SDK tool wrapping `@tavily/core`.
 *
 * We implement this locally instead of `@tavily/ai-sdk` because that package
 * only peers `ai@^5 || ^6`, which breaks Vercel installs against `ai@7`.
 */
export function tavilySearch(options: TavilySearchToolOptions = {}) {
  const client = tavily({
    apiKey: options.apiKey ?? process.env.TAVILY_API_KEY,
  });

  return tool({
    description:
      "Search the web for real-time information using Tavily's AI-optimized search engine. Returns relevant sources, snippets, and optional AI-generated answers. Use for time-sensitive facts your training data may not know.",
    inputSchema: z.object({
      query: z.string().describe("The search query to look up on the web"),
      searchDepth: z
        .enum(["basic", "advanced", "fast", "ultra-fast"])
        .optional()
        .describe(
          "Search depth — basic for speed, advanced for comprehensive results",
        ),
      timeRange: z
        .enum(["year", "month", "week", "day", "y", "m", "w", "d"])
        .optional()
        .describe("Optional time window for results"),
    }),
    execute: async ({ query, searchDepth, timeRange }) => {
      return client.search(query, {
        searchDepth: searchDepth ?? options.searchDepth ?? "basic",
        includeAnswer: options.includeAnswer,
        maxResults: options.maxResults,
        topic: options.topic,
        timeRange: timeRange ?? options.timeRange,
      });
    },
  });
}
