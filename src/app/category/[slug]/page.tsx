import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgentGrid } from "@/components/agents/agent-grid";
import { categoryLabel } from "@/lib/format";
import {
  CATEGORIES,
  getAgentsByCategory,
} from "@/lib/mock-data";
import type { AgentCategory } from "@/lib/types";

export function generateStaticParams() {
  return CATEGORIES.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: categoryLabel(slug),
    description: `Browse ${categoryLabel(slug)} AI agents on Sam AI Market.`,
  };
}

export default async function CategoryPage({
  params,
}: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const category = CATEGORIES.find((cat) => cat.slug === slug);
  if (!category) notFound();

  const agents = getAgentsByCategory(slug as AgentCategory);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-10 max-w-2xl animate-rise">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          Category
        </p>
        <h1 className="mt-2 font-display text-5xl tracking-tight text-foreground">
          {category.label}
        </h1>
        <p className="mt-3 text-base text-[var(--accent)]">
          {category.description}
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {agents.length} agent{agents.length === 1 ? "" : "s"} available
        </p>
      </div>
      <AgentGrid agents={agents} title="All agents" />
    </div>
  );
}
