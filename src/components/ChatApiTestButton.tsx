"use client";

import { useState } from "react";

/**
 * Temporary smoke-test control for POST /api/chat.
 * Remove once the real generative strategy UI ships.
 */
export function ChatApiTestButton() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setStatus(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content:
                "Suggest one low-risk Arbitrum USDC yield strategy in 3 short bullets.",
            },
          ],
        }),
      });

      const body = await response.text();
      console.log("[api/chat] status", response.status);
      console.log("[api/chat] stream body", body);

      setStatus(
        response.ok
          ? "Stream received — check the browser console"
          : `Error ${response.status} — check the browser console`,
      );
    } catch (error) {
      console.error("[api/chat] request failed", error);
      setStatus("Request failed — check the browser console");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="surface p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        Temporary AI chat test
      </p>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={busy}
        className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Streaming…" : "Test AI Chat"}
      </button>
      {status && (
        <p className="mt-2 text-sm text-[var(--accent)]">{status}</p>
      )}
    </div>
  );
}
