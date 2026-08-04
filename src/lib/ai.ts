import { createOpenAI } from "@ai-sdk/openai";

/**
 * Central OpenAI provider for ArbiYield AI.
 * Swap models, temperature defaults, or baseURL (e.g. Grok-compatible) here.
 */
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // For an OpenAI-compatible endpoint later (e.g. Grok):
  // baseURL: process.env.OPENAI_BASE_URL,
});

/** Default chat/completions model reused across API routes. */
export const DEFAULT_MODEL = openai("gpt-4o-mini");
