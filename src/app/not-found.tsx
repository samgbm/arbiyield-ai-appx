import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        404
      </p>
      <h1 className="mt-3 font-display text-5xl text-foreground">
        Agent not found
      </h1>
      <p className="mt-3 text-sm text-[var(--accent)]">
        That listing may have moved. Browse the catalog instead.
      </p>
      <Link href="/" className="mt-8">
        <Button>Back to market</Button>
      </Link>
    </div>
  );
}
