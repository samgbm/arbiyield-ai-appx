import Link from "next/link";
import { AgentCard } from "@/components/agents/agent-card";
import type { Agent } from "@/lib/types";

export function AgentGrid({
  agents,
  title,
  subtitle,
  href,
}: {
  agents: Agent[];
  title: string;
  subtitle?: string;
  href?: string;
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 max-w-2xl text-sm text-[var(--accent)]">
              {subtitle}
            </p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="shrink-0 text-sm font-semibold text-primary hover:underline"
          >
            See all
          </Link>
        )}
      </div>
      <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </section>
  );
}
