"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/providers/cart-provider";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { detailed, subtotal, setQuantity, removeItem, clear, count } =
    useCart();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 animate-rise">
        <h1 className="font-display text-5xl tracking-tight text-foreground">
          Cart
        </h1>
        <p className="mt-2 text-sm text-[var(--accent)]">
          {count === 0
            ? "Your cart is empty."
            : `${count} item${count === 1 ? "" : "s"} ready to license.`}
        </p>
      </div>

      {detailed.length === 0 ? (
        <div className="surface rounded-3xl p-10 text-center">
          <p className="text-lg font-semibold text-foreground">
            Nothing here yet
          </p>
          <p className="mt-2 text-sm text-[var(--accent)]">
            Browse the marketplace and add agents to get started.
          </p>
          <Link href="/search" className="mt-6 inline-block">
            <Button>Browse agents</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-3">
            {detailed.map(({ agent, quantity, lineTotal }) => (
              <article
                key={agent.id}
                className="surface flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center"
              >
                <div
                  className="agent-art h-24 w-full shrink-0 rounded-xl sm:h-20 sm:w-28"
                  style={{ ["--agent-hue" as string]: agent.imageHue }}
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/agents/${agent.id}`}
                    className="font-bold text-foreground hover:text-primary"
                  >
                    {agent.name}
                  </Link>
                  <p className="mt-1 text-sm text-[var(--accent)]">
                    {formatPrice(agent.price, agent.pricingModel)} ·{" "}
                    {agent.seller}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="grid size-8 place-items-center rounded-lg border border-border"
                    onClick={() => setQuantity(agent.id, quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="grid size-8 place-items-center rounded-lg border border-border"
                    onClick={() => setQuantity(agent.id, quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <p className="min-w-20 text-right text-base font-bold text-foreground">
                  ${lineTotal.toFixed(2)}
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(agent.id)}
                  className="inline-flex size-9 items-center justify-center rounded-lg text-[var(--accent)] hover:bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] hover:text-[var(--danger)]"
                  aria-label={`Remove ${agent.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </article>
            ))}
            <button
              type="button"
              onClick={clear}
              className="text-sm font-semibold text-[var(--accent)] hover:text-foreground"
            >
              Clear cart
            </button>
          </div>

          <aside className="surface h-fit rounded-3xl p-6 lg:sticky lg:top-28">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Order summary
            </h2>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-[var(--accent)]">Subtotal</span>
              <span className="font-bold text-foreground">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-[var(--accent)]">Tax</span>
              <span className="font-bold text-foreground">$0.00</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-2xl font-extrabold text-foreground">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <Button className="mt-6 w-full" size="lg">
              Checkout (demo)
            </Button>
            <p className="mt-3 text-center text-xs text-[var(--muted)]">
              Mock checkout — no payment is processed.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
