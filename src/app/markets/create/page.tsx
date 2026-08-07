"use client";

import { useActions, useUIState } from "@ai-sdk/rsc";
import { LoaderCircle, SendHorizontal, Sparkles } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { AI } from "@/app/actions";

const SUGGESTIONS = [
  "I want a market about who will win the next World Cup",
  "Will ETH hit $10k before 2027?",
  'Demo market ending in 30 seconds — title "Will this resolve YES?"',
] as const;

/**
 * Full-height AI Market Creator chat — streams text + MarketPreviewCard via RSC.
 * Route: /markets/create
 */
export default function CreateMarketPage() {
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions<typeof AI>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isPending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isPending) return;

    setInput("");
    setIsPending(true);

    // Optimistically show the user bubble.
    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        role: "user",
        display: (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {text}
          </div>
        ),
      },
    ]);

    try {
      const response = await submitUserMessage(text);
      setMessages((current) => [...current, response]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          display: (
            <p className="text-sm text-[var(--danger)]">
              {error instanceof Error
                ? error.message
                : "Market creator failed. Check OPENAI_API_KEY or enable Demo Mode later."}
            </p>
          ),
        },
      ]);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col bg-background sm:h-[calc(100dvh-4rem)]">
      <header className="border-b border-border px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden />
          <div>
            <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              AI Market Creator
            </p>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              Describe a prediction market
            </h1>
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-6"
      >
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="font-display text-3xl tracking-tight text-foreground">
              What should the world bet on?
            </p>
            <p className="max-w-md text-sm text-[var(--accent)]">
              Prompt an idea. The strategist will ask for title, resolution
              criteria, category, and end date (or “in 30 seconds”) — then stream a Generative UI
              deploy card.
            </p>
            <div className="mt-2 grid w-full gap-2 sm:grid-cols-1">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInput(suggestion)}
                  className="rounded-xl border border-border bg-secondary px-3 py-2.5 text-left text-sm text-foreground transition hover:border-primary/40"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`rounded-2xl px-3.5 py-2.5 ${
                message.role === "user"
                  ? "max-w-[92%] rounded-br-md bg-primary text-primary-foreground sm:max-w-[85%]"
                  : "w-full max-w-full rounded-bl-md bg-secondary text-foreground ring-1 ring-border"
              }`}
            >
              <p className="mb-1 font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
                {message.role === "user" ? "You" : "Creator"}
              </p>
              {message.display}
            </div>
          </div>
        ))}

        {isPending && (
          <div className="inline-flex items-center gap-2 self-start rounded-2xl rounded-bl-md bg-secondary px-3.5 py-2.5 text-sm text-[var(--accent)] ring-1 ring-border">
            <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden />
            Thinking…
          </div>
        )}
      </div>

      <div className="border-t border-border bg-secondary/90 px-4 py-3 backdrop-blur-sm sm:px-6">
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="mx-auto flex max-w-3xl items-center gap-2"
        >
          <label htmlFor="market-creator-input" className="sr-only">
            Market idea
          </label>
          <input
            id="market-creator-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isPending}
            placeholder="e.g. Who will win the next World Cup?"
            className="min-h-12 flex-1 rounded-xl border border-border bg-background px-3.5 text-[15px] text-foreground outline-none ring-primary/40 placeholder:text-[var(--muted)] focus:ring-2 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isPending || !input.trim()}
            className="inline-flex min-h-12 min-w-12 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 text-sm font-bold text-primary-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <SendHorizontal className="size-4" aria-hidden />
            )}
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
