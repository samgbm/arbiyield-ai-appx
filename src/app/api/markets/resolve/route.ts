import { generateObject, generateText, stepCountIs } from "ai";
import { tavilySearch } from "@tavily/ai-sdk";
import { z } from "zod";
import { openai } from "@/lib/ai";
import { OracleVerdictSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";

/** Oracle research + structured verdict can exceed default serverless limits. */
export const maxDuration = 60;

const ResolveBodySchema = z.object({
  title: z.string().min(1, "title is required"),
  description: z.string().min(1, "description is required"),
});

const ORACLE_SYSTEM = `You are an impartial decentralized oracle. Given the following market title and description, determine if the event has occurred or the condition is met. Return YES, NO, or UNDECIDED if there is not enough public information. Provide a brief reasoning and sources.`;

const RESEARCH_SYSTEM = `You are a research agent for a prediction-market oracle.
Your training data may be outdated for time-sensitive facts (prices, release dates, election results, sports scores, attendance counts).
ALWAYS use the tavilySearch tool with an optimized, specific search query before concluding.
Prefer primary sources (official announcements, reputable news, on-chain explorers) and cite URLs.
Summarize the strongest evidence for and against the market condition being met.`;

type SourceLink = { title: string; url: string };

function collectSourcesFromSteps(
  steps: ReadonlyArray<{
    toolResults?: ReadonlyArray<{
      output?: unknown;
      result?: unknown;
    }>;
  }>,
): SourceLink[] {
  const seen = new Set<string>();
  const sources: SourceLink[] = [];

  for (const step of steps) {
    for (const tr of step.toolResults ?? []) {
      const payload = (tr.output ?? tr.result) as
        | {
            results?: Array<{ title?: string; url?: string }>;
          }
        | undefined;

      for (const hit of payload?.results ?? []) {
        if (!hit.url || seen.has(hit.url)) continue;
        seen.add(hit.url);
        sources.push({
          title: hit.title?.trim() || hit.url,
          url: hit.url,
        });
      }
    }
  }

  return sources;
}

/**
 * @swagger
 * /api/markets/resolve:
 *   post:
 *     tags:
 *       - AI
 *     summary: AI Oracle market resolution
 *     description: >
 *       Researches a prediction market with Tavily web search, then returns a
 *       structured YES / NO / UNDECIDED verdict with reasoning and source URLs.
 *       Does not submit an on-chain resolve — creators must sign separately.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Will GTA 6 release in 2025?
 *               description:
 *                 type: string
 *                 example: Resolves YES if Rockstar ships GTA 6 on any platform in 2025.
 *     responses:
 *       200:
 *         description: Structured oracle verdict
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [verdict, reasoning, sources]
 *               properties:
 *                 verdict:
 *                   type: string
 *                   enum: [YES, NO, UNDECIDED]
 *                 reasoning:
 *                   type: string
 *                 sources:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       url:
 *                         type: string
 *                         format: uri
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Oracle generation failed
 */
export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const log = logger.child({ requestId, route: "/api/markets/resolve" });

  try {
    const json: unknown = await req.json();
    const parsed = ResolveBodySchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid request body",
          details: parsed.error.flatten().fieldErrors,
          requestId,
        },
        { status: 400 },
      );
    }

    const { title, description } = parsed.data;
    const tavilyKey = process.env.TAVILY_API_KEY;
    if (!tavilyKey) {
      log.error("TAVILY_API_KEY missing");
      return Response.json(
        { error: "TAVILY_API_KEY is not configured", requestId },
        { status: 500 },
      );
    }

    log.info({ title }, "AI Oracle resolve requested");

    // Step 1 — agentic research: model recognizes stale knowledge and calls Tavily.
    const research = await generateText({
      model: openai("gpt-4o"),
      system: RESEARCH_SYSTEM,
      prompt: `Market title: ${title}\nMarket description: ${description}\n\nSearch the public web for evidence that the market condition has or has not been met. Use a precise tavilySearch query.`,
      tools: {
        tavilySearch: tavilySearch({
          apiKey: tavilyKey,
          searchDepth: "advanced",
          includeAnswer: true,
          maxResults: 5,
        }),
      },
      stopWhen: stepCountIs(4),
    });

    const researchSources = collectSourcesFromSteps(research.steps ?? []);

    // Step 2 — structured impartial verdict (generateObject + Zod schema).
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: OracleVerdictSchema,
      system: ORACLE_SYSTEM,
      prompt: `Market title: ${title}

Market description: ${description}

Research findings:
${research.text || "(no research text)"}

Candidate source URLs:
${
  researchSources.length > 0
    ? researchSources.map((s) => `- ${s.title}: ${s.url}`).join("\n")
    : "(none extracted — prefer UNDECIDED unless the market condition is clearly timeless)"
}

Return YES, NO, or UNDECIDED with brief reasoning. Include the most relevant source links you relied on.`,
    });

    const sources =
      object.sources.length > 0 ? object.sources : researchSources;

    const payload = {
      verdict: object.verdict,
      reasoning: object.reasoning,
      sources,
    };

    log.info(
      { verdict: payload.verdict, sourceCount: sources.length },
      "AI Oracle verdict ready",
    );

    return Response.json(payload);
  } catch (error) {
    log.error({ err: error }, "API /api/markets/resolve Error");
    return Response.json(
      { error: "Failed to resolve market with AI Oracle", requestId },
      { status: 500 },
    );
  }
}
