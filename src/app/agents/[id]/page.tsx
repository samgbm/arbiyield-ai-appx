import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Box, Cpu, Layers } from "lucide-react";
import type { Metadata } from "next";
import { AddToCartButton } from "@/components/agents/add-to-cart-button";
import { AgentCard } from "@/components/agents/agent-card";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { categoryLabel, formatPrice, formatUsers } from "@/lib/format";
import {
  AGENTS,
  getAgentById,
  getAgentsByCategory,
  getReviewsForAgent,
} from "@/lib/mock-data";

export function generateStaticParams() {
  return AGENTS.map((agent) => ({ id: agent.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/agents/[id]">): Promise<Metadata> {
  const { id } = await params;
  const agent = getAgentById(id);
  if (!agent) return { title: "Agent not found" };
  return {
    title: agent.name,
    description: agent.tagline,
  };
}

export default async function AgentDetailPage({
  params,
}: PageProps<"/agents/[id]">) {
  const { id } = await params;
  const agent = getAgentById(id);
  if (!agent) notFound();

  const reviews = getReviewsForAgent(agent.id);
  const related = getAgentsByCategory(agent.category)
    .filter((a) => a.id !== agent.id)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <nav className="mb-6 text-sm text-[var(--accent)]">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/category/${agent.category}`}
          className="hover:text-foreground"
        >
          {categoryLabel(agent.category)}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{agent.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6 animate-rise">
          <div
            className="agent-art relative h-64 overflow-hidden rounded-3xl border border-border sm:h-80"
            style={{ ["--agent-hue" as string]: agent.imageHue }}
          >
            <div className="absolute inset-0 opacity-25 grid-fade" />
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
              {agent.bestseller && <Badge tone="accent">Bestseller</Badge>}
              {agent.featured && <Badge tone="warning">Featured</Badge>}
              {agent.newRelease && <Badge tone="success">New release</Badge>}
            </div>
          </div>

          <div className="surface rounded-3xl p-6 sm:p-8">
            <h2 className="font-display text-3xl text-foreground">About</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--accent)] sm:text-base">
              {agent.description}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-background p-4">
                <Cpu className="size-4 text-primary" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Model
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {agent.model}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4">
                <Layers className="size-4 text-primary" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Category
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {categoryLabel(agent.category)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4">
                <Box className="size-4 text-primary" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Monthly users
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatUsers(agent.monthlyUsers)}
                </p>
              </div>
            </div>

            <h3 className="mt-8 text-sm font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Capabilities
            </h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {agent.capabilities.map((cap) => (
                <li
                  key={cap}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  {cap}
                </li>
              ))}
            </ul>

            <h3 className="mt-8 text-sm font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Tags
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {agent.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-[var(--accent)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="surface rounded-3xl p-6 sm:p-8">
            <h2 className="font-display text-3xl text-foreground">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--accent)]">
                No reviews yet for this agent.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-border bg-background p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">
                        {review.author}
                      </p>
                      <Rating value={review.rating} />
                    </div>
                    <p className="mt-2 text-sm font-bold text-foreground">
                      {review.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--accent)]">
                      {review.body}
                    </p>
                    <p className="mt-3 text-xs text-[var(--muted)]">
                      {review.date}
                      {review.verified ? " · Verified purchase" : ""}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="animate-rise lg:sticky lg:top-28 lg:self-start [animation-delay:80ms]">
          <div className="surface rounded-3xl p-6">
            <h1 className="font-display text-4xl tracking-tight text-foreground">
              {agent.name}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--accent)]">
              {agent.tagline}
            </p>
            <div className="mt-4">
              <Rating value={agent.rating} count={agent.reviewCount} size="md" />
            </div>

            <p className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">
              {formatPrice(agent.price, agent.pricingModel)}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Instant digital license · Cancel anytime for subscriptions
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <AddToCartButton agentId={agent.id} />
              <Link
                href="/cart"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground transition hover:border-primary"
              >
                View cart
              </Link>
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Sold by
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {agent.seller}
                {agent.sellerVerified && (
                  <BadgeCheck className="size-4 text-primary" />
                )}
              </p>
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display mb-5 text-3xl text-foreground">
            Related in {categoryLabel(agent.category)}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <AgentCard key={item.id} agent={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
