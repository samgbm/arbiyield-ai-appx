"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { LoaderCircle, SendHorizontal, Sparkles } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

const PRESET_PROMPTS = [
  "Find me a low-risk USDC strategy",
  "Best ETH liquid staking yield on Arbitrum",
  "Conservative lending market for stables",
  "Compare two low-risk Arbitrum yield options",
] as const;

function messageText(parts: { type: string; text?: string }[]): string {
  return parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("");
}

export function ChatInterface() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );

  const { messages, sendMessage, status, error } = useChat({ transport });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setInput(event.target.value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    void sendMessage({ text });
    setInput("");
  }

  function applyPreset(prompt: string) {
    if (isLoading) return;
    setInput(prompt);
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
          Stream a low-risk Arbitrum yield idea. Structured strategy cards come
          next.
        </p>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5"
      >
        {messages.length === 0 && (
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

        {messages.map((message) => {
          const isUser = message.role === "user";
          const text = messageText(message.parts);

          return (
            <article
              key={message.id}
              className={`chat-msg flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed sm:max-w-[80%] ${
                  isUser
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-background text-foreground ring-1 ring-border"
                }`}
              >
                <p className="mb-1 font-mono-explorer text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
                  {isUser ? "You" : "Strategist"}
                </p>
                <p className="whitespace-pre-wrap break-words">{text}</p>
              </div>
            </article>
          );
        })}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md bg-secondary px-3.5 py-2.5 text-sm text-[var(--accent)] ring-1 ring-border">
              <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden />
              Thinking…
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border bg-secondary/80 px-3 py-3 backdrop-blur-sm sm:px-5">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <label htmlFor="strategy-chat-input" className="sr-only">
            Strategy prompt
          </label>
          <input
            id="strategy-chat-input"
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
            placeholder="Ask for a low-risk Arbitrum strategy…"
            autoComplete="off"
            className="min-h-11 flex-1 rounded-xl border border-border bg-background px-3.5 text-[15px] text-foreground outline-none ring-primary/40 placeholder:text-[var(--muted)] focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 text-sm font-bold text-primary-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
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
          {PRESET_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => applyPreset(prompt)}
              disabled={isLoading}
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-left text-sm leading-snug text-foreground transition hover:border-primary/45 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-2 text-sm text-[var(--danger)]">
            {error.message || "Chat request failed. Check your API key and try again."}
          </p>
        )}
      </div>
    </section>
  );
}
