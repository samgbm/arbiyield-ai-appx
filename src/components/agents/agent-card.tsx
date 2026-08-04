import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { formatPrice, formatUsers } from "@/lib/format";
import type { Agent } from "@/lib/types";

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Link
      href={`/agents/${agent.id}`}
      className="group surface flex h-full flex-col overflow-hidden rounded-2xl transition hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--primary)_35%,var(--border))]"
    >
      <div
        className="agent-art relative h-36 overflow-hidden"
        style={{ ["--agent-hue" as string]: agent.imageHue }}
      >
        <div className="absolute inset-0 opacity-30 mix-blend-overlay grid-fade" />
        <div className="absolute inset-0 flex items-end justify-between p-4">
          <div className="flex flex-wrap gap-1.5">
            {agent.bestseller && <Badge tone="accent">Bestseller</Badge>}
            {agent.newRelease && <Badge tone="success">New</Badge>}
            {agent.featured && !agent.bestseller && (
              <Badge tone="warning">Featured</Badge>
            )}
          </div>
          <span className="rounded-lg bg-black/35 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {formatUsers(agent.monthlyUsers)} users
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-base font-bold tracking-tight text-foreground group-hover:text-primary">
            {agent.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-snug text-[var(--accent)]">
            {agent.tagline}
          </p>
        </div>

        <Rating value={agent.rating} count={agent.reviewCount} />

        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          <div>
            <p className="text-lg font-bold tracking-tight text-foreground">
              {formatPrice(agent.price, agent.pricingModel)}
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-[var(--accent)]">
              {agent.seller}
              {agent.sellerVerified && (
                <BadgeCheck className="size-3.5 text-primary" />
              )}
            </p>
          </div>
          <span className="rounded-lg border border-border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--accent)]">
            {agent.category}
          </span>
        </div>
      </div>
    </Link>
  );
}
