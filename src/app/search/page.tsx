import type { Metadata } from "next";
import { AgentGrid } from "@/components/agents/agent-grid";
import { searchAgents } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the Sam AI Market agent catalog.",
};

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const resolved = await searchParams;
  const q = typeof resolved.q === "string" ? resolved.q : "";
  const agents = searchAgents(q);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-10 max-w-2xl animate-rise">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          Search
        </p>
        <h1 className="mt-2 font-display text-5xl tracking-tight text-foreground">
          {q ? `Results for “${q}”` : "All agents"}
        </h1>
        <p className="mt-3 text-sm text-[var(--accent)]">
          {agents.length} agent{agents.length === 1 ? "" : "s"} found
        </p>
      </div>
      {agents.length === 0 ? (
        <div className="surface rounded-3xl p-10 text-center">
          <p className="text-lg font-semibold text-foreground">No agents matched</p>
          <p className="mt-2 text-sm text-[var(--accent)]">
            Try a broader term like “coding”, “support”, or a seller name.
          </p>
        </div>
      ) : (
        <AgentGrid agents={agents} title="Catalog" />
      )}
    </div>
  );
}
