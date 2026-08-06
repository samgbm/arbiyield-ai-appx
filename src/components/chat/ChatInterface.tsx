"use client";

import { experimental_useObject } from "@ai-sdk/react";
import { Eraser, LoaderCircle, SendHorizontal, Sparkles } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useDemoMode } from "@/components/providers/DemoModeProvider";
import { StrategySchema, type Strategy } from "@/lib/schemas";
import { StrategyCard } from "./StrategyCard";
import { StrategySkeleton } from "./StrategySkeleton";

const PRESET_PROMPTS = [
  "Find me a low-risk USDC strategy",
  "Best ETH liquid staking yield on Arbitrum",
  "Conservative lending market for stables",
  "Compare two low-risk Arbitrum yield options",
] as const;

const DEMO_STRATEGY: Partial<Strategy> = {
  strategyName: "Demo USDC Vault Autocompounder",
  expectedYield: 15,
  riskLevel: "low",
  description:
    "This is a lightning-fast mock strategy used for live presentations to ensure flawless execution.",
  steps: [
    "Supply USDC to Aave",
    "Borrow ARB",
    "Provide liquidity to Uniswap V3",
  ],
};

export function ChatInterface() {
  const { isDemoMode } = useDemoMode();
  const [prompt, setPrompt] = useState("");
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);
  const [mockStrategy, setMockStrategy] = useState<Partial<Strategy> | null>(
    null,
  );
  const [isMockLoading, setIsMockLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { object, submit, isLoading, clear, error } = experimental_useObject({
    api: "/api/chat",
    schema: StrategySchema,
  });

  const busy = isLoading || isMockLoading;
  const strategy = mockStrategy ?? object;
  const hasStrategyName = Boolean(strategy?.strategyName?.trim());
  const showSkeleton = busy && !hasStrategyName;
  const showCard = hasStrategyName;
  const showResult = showSkeleton || showCard;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [strategy, busy, submittedPrompt]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = prompt.trim();
    if (!text || busy) return;

    if (isDemoMode) {
      setSubmittedPrompt(text);
      setMockStrategy(null);
      setIsMockLoading(true);
      setPrompt("");
      window.setTimeout(() => {
        setIsMockLoading(false);
        setMockStrategy(DEMO_STRATEGY);
      }, 1500);
      return;
    }

    setSubmittedPrompt(text);
    submit({
      messages: [{ role: "user", content: text }],
    });
    setPrompt("");
  }

  function handleClear() {
    clear();
    setMockStrategy(null);
    setIsMockLoading(false);
    setSubmittedPrompt(null);
    setPrompt("");
    inputRef.current?.focus();
  }

  function applyPreset(preset: string) {
    if (busy) return;
    setPrompt(preset);
    inputRef.current?.focus();
  }

  return (
    <section
      aria-label="AI strategy chat"
      className="surface flex min-h-[min(72vh,40rem)] flex-col overflow-hidden"
    >
      <header className="border-b border-border px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden />
          <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Generative strategist
          </p>
        </div>
        <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Ask ArbiYield AI
        </h2>
        <p className="mt-1 text-sm text-[var(--accent)]">
          Stream a structured Arbitrum yield strategy into a live StrategyCard.
        </p>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5"
      >
        {!submittedPrompt && !showResult && (
          <div className="flex h-full min-h-40 flex-col items-center justify-center px-4 text-center">
            <p className="font-display text-2xl tracking-tight text-foreground">
              What yield are you hunting?
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--accent)]">
              Describe risk tolerance, asset (USDC, ETH…), and horizon. Or tap a
              preset below.
            </p>
          </div>
        )}

        {submittedPrompt && (
          <article className="chat-msg flex justify-end">
            <div className="max-w-[88%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-[15px] leading-relaxed text-primary-foreground sm:max-w-[80%]">
              <p className="mb-1 font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
                You
              </p>
              <p className="whitespace-pre-wrap break-words">{submittedPrompt}</p>
            </div>
          </article>
        )}

        {showSkeleton && <StrategySkeleton />}
        {showCard && strategy && <StrategyCard strategy={strategy} />}
      </div>

      <div className="border-t border-border bg-secondary/80 px-3 py-3 backdrop-blur-sm sm:px-5">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <label htmlFor="strategy-chat-input" className="sr-only">
            Strategy prompt
          </label>
          <input
            id="strategy-chat-input"
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={busy}
            placeholder="Ask for a low-risk Arbitrum strategy…"
            autoComplete="off"
            className="min-h-11 flex-1 rounded-xl border border-border bg-background px-3.5 text-[15px] text-foreground outline-none ring-primary/40 placeholder:text-[var(--muted)] focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleClear}
            disabled={!submittedPrompt && !strategy && !prompt}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Clear strategy"
          >
            <Eraser className="size-4" aria-hidden />
            <span className="hidden sm:inline">Clear</span>
          </button>
          <button
            type="submit"
            disabled={busy || !prompt.trim()}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 text-sm font-bold text-primary-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                <span className="hidden sm:inline">Streaming</span>
              </>
            ) : (
              <>
                <SendHorizontal className="size-4" aria-hidden />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PRESET_PROMPTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => applyPreset(preset)}
              disabled={busy}
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-left text-sm leading-snug text-foreground transition hover:border-primary/45 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {preset}
            </button>
          ))}
        </div>

        {error && !isDemoMode && (
          <p className="mt-2 text-sm text-[var(--danger)]">
            {error.message ||
              "Strategy generation failed. Check your API key and try again."}
          </p>
        )}
      </div>
    </section>
  );
}
