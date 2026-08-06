"use client";

import { useState } from "react";
import { CalendarClock, Rocket, Tag } from "lucide-react";
import type { MockMarket } from "@/data/mockMarkets";
import { useDemoStore } from "@/store/useDemoStore";

export type MarketPreviewProps = {
  title: string;
  description: string;
  category: MockMarket["category"] | string;
  endDate: string;
  /** Optional override for unit tests (avoids store side-effects). */
  onDeploy?: () => void;
};

function toCategory(value: string): MockMarket["category"] {
  const allowed: MockMarket["category"][] = [
    "Crypto",
    "Culture",
    "AI",
    "Sports",
    "Macro",
  ];
  return (allowed.includes(value as MockMarket["category"])
    ? value
    : "Culture") as MockMarket["category"];
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

/**
 * Generative UI summary card streamed by the AI Market Creator.
 * Deploy currently mocks Stylus deployment and seeds Demo Mode state.
 */
export function MarketPreviewCard({
  title,
  description,
  category,
  endDate,
  onDeploy,
}: MarketPreviewProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [deployed, setDeployed] = useState(false);
  const setDemoMode = useDemoStore((s) => s.setDemoMode);
  const addCreatedMarket = useDemoStore((s) => s.addCreatedMarket);

  function handleDeploy() {
    if (onDeploy) {
      onDeploy();
      setToast("Market Deployment Initiated");
      setDeployed(true);
      return;
    }

    // Fail-safe: force Demo Mode and append a local market for the hub grid.
    setDemoMode(true);

    const market: MockMarket = {
      id: `${slugify(title) || "ai-market"}-${Date.now().toString(36)}`,
      title,
      description,
      category: toCategory(category),
      liquidityPool: 1,
      endDate,
      options: [
        { label: "Yes", poolAmount: 0.5 },
        { label: "No", poolAmount: 0.5 },
      ],
      status: "active",
    };

    addCreatedMarket(market);
    setToast("Market Deployment Initiated");
    setDeployed(true);
  }

  return (
    <article
      data-testid="market-preview-card"
      className="overflow-hidden rounded-[var(--radius-panel)] border border-primary/35 bg-secondary shadow-[0_0_28px_color-mix(in_oklab,var(--primary)_18%,transparent)]"
    >
      <div className="border-b border-border bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_16%,transparent),transparent)] px-4 py-3 sm:px-5">
        <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          Generative market preview
        </p>
        <h3 className="mt-1 text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {title}
        </h3>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <p className="text-sm leading-relaxed text-[var(--accent)]">
          {description}
        </p>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1 text-xs font-semibold text-foreground ring-1 ring-border">
            <Tag className="size-3.5 text-primary" aria-hidden />
            {category}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1 text-xs font-semibold text-foreground ring-1 ring-border">
            <CalendarClock className="size-3.5 text-primary" aria-hidden />
            <time dateTime={endDate}>{endDate}</time>
          </span>
        </div>

        <button
          type="button"
          onClick={handleDeploy}
          disabled={deployed}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Rocket className="size-4" aria-hidden />
          {deployed ? "Deployment Initiated" : "Deploy to Arbitrum Stylus"}
        </button>

        {toast && (
          <p
            role="status"
            data-testid="deploy-toast"
            className="rounded-lg bg-primary/12 px-3 py-2 text-center text-sm font-semibold text-primary ring-1 ring-primary/30"
          >
            {toast}
          </p>
        )}
      </div>
    </article>
  );
}
