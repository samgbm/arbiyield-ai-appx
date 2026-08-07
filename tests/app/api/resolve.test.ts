/**
 * @jest-environment node
 */
import { POST } from "../../../src/app/api/markets/resolve/route";

const generateObject = jest.fn();
const generateText = jest.fn();

jest.mock("ai", () => ({
  generateObject: (...args: unknown[]) => generateObject(...args),
  generateText: (...args: unknown[]) => generateText(...args),
  stepCountIs: () => () => true,
}));

jest.mock("../../../src/lib/ai", () => ({
  openai: jest.fn((model: string) => model),
}));

jest.mock("../../../src/lib/tavily", () => ({
  tavilySearch: jest.fn(() => ({
    description: "mock tavily search",
    inputSchema: {},
    execute: jest.fn(),
  })),
}));

jest.mock("../../../src/lib/logger", () => ({
  logger: {
    child: () => ({
      info: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

describe("POST /api/markets/resolve", () => {
  beforeEach(() => {
    generateObject.mockReset();
    generateText.mockReset();
    process.env.TAVILY_API_KEY = "test-tavily-key";

    generateText.mockResolvedValue({
      text: "Rockstar released the trailer; no 2025 ship date confirmed.",
      steps: [
        {
          toolResults: [
            {
              output: {
                results: [
                  {
                    title: "Rockstar Newswire",
                    url: "https://www.rockstargames.com/newswire",
                  },
                ],
              },
            },
          ],
        },
      ],
    });
  });

  it("returns structured { verdict, reasoning, sources } from generateObject", async () => {
    generateObject.mockResolvedValue({
      object: {
        verdict: "NO",
        reasoning:
          "No public evidence that GTA 6 shipped in 2025; Rockstar has only confirmed a trailer.",
        sources: [
          {
            title: "Rockstar Newswire",
            url: "https://www.rockstargames.com/newswire",
          },
        ],
      },
    });

    const req = new Request("http://localhost/api/markets/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Will GTA 6 release in 2025?",
        description:
          "Resolves YES if Rockstar ships GTA 6 on any platform in calendar year 2025.",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = (await res.json()) as {
      verdict: string;
      reasoning: string;
      sources: Array<{ title: string; url: string }>;
    };

    expect(json).toEqual({
      verdict: "NO",
      reasoning:
        "No public evidence that GTA 6 shipped in 2025; Rockstar has only confirmed a trailer.",
      sources: [
        {
          title: "Rockstar Newswire",
          url: "https://www.rockstargames.com/newswire",
        },
      ],
    });

    expect(generateText).toHaveBeenCalledTimes(1);
    expect(generateObject).toHaveBeenCalledTimes(1);
    expect(generateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o",
        schema: expect.anything(),
        system: expect.stringContaining("impartial decentralized oracle"),
      }),
    );
  });

  it("rejects missing title/description with 400", async () => {
    const req = new Request("http://localhost/api/markets/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(generateObject).not.toHaveBeenCalled();
  });
});
