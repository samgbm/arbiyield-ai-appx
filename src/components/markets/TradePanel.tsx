"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { Info, Shield } from "lucide-react";

export type TradeSide = "Yes" | "No";

/** Mock Minimum Return Floor multiplier (PMM anti-dilution guarantee). */
export const MIN_RETURN_FLOOR_MULTIPLIER = 1.8;

export function calculateMinReturnFloor(betAmountEth: number): number {
  if (!Number.isFinite(betAmountEth) || betAmountEth <= 0) return 0;
  return betAmountEth * MIN_RETURN_FLOOR_MULTIPLIER;
}

type TradePanelProps = {
  marketTitle?: string;
  onSubmit?: (payload: { side: TradeSide; amount: number }) => void;
};

/**
 * Trade entry panel — bet amount + Yes/No side selection with
 * Expected Payout & Floor preview (mock math until Stylus PMM wiring).
 */
export function TradePanel({ marketTitle, onSubmit }: TradePanelProps) {
  const tipId = useId();
  const [amount, setAmount] = useState("");
  const [side, setSide] = useState<TradeSide>("Yes");
  const [tipOpen, setTipOpen] = useState(false);

  const parsedAmount = useMemo(() => {
    const value = Number.parseFloat(amount);
    return Number.isFinite(value) ? value : 0;
  }, [amount]);

  const minFloor = calculateMinReturnFloor(parsedAmount);
  const showFloor = parsedAmount > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (parsedAmount <= 0) return;
    onSubmit?.({ side, amount: parsedAmount });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="surface flex flex-col gap-5 p-4 sm:p-5"
      aria-label="Trade panel"
    >
      <div>
        <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Place trade
        </p>
        {marketTitle && (
          <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">
            {marketTitle}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="bet-amount"
          className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]"
        >
          Bet Amount (ETH)
        </label>
        <input
          id="bet-amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="0.05"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="min-h-12 w-full rounded-xl border border-border bg-background px-3.5 text-base font-semibold text-foreground outline-none ring-primary/40 placeholder:text-[var(--muted)] focus:ring-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-pressed={side === "Yes"}
          onClick={() => setSide("Yes")}
          className={`min-h-14 rounded-xl text-base font-extrabold transition ${
            side === "Yes"
              ? "bg-[var(--success)] text-white shadow-[0_0_18px_color-mix(in_oklab,var(--success)_45%,transparent)]"
              : "bg-background text-[var(--success)] ring-1 ring-border hover:ring-[var(--success)]/50"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          aria-pressed={side === "No"}
          onClick={() => setSide("No")}
          className={`min-h-14 rounded-xl text-base font-extrabold transition ${
            side === "No"
              ? "bg-[var(--danger)] text-white shadow-[0_0_18px_color-mix(in_oklab,var(--danger)_45%,transparent)]"
              : "bg-background text-[var(--danger)] ring-1 ring-border hover:ring-[var(--danger)]/50"
          }`}
        >
          No
        </button>
      </div>

      <div className="rounded-xl border border-border bg-background/70 p-3.5">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-primary" aria-hidden />
          <h3 className="text-sm font-bold text-foreground">
            Expected Payout &amp; Floor
          </h3>
          <button
            type="button"
            className="ml-auto inline-flex size-8 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-secondary hover:text-foreground"
            aria-describedby={tipId}
            aria-expanded={tipOpen}
            onClick={() => setTipOpen((open) => !open)}
            title="About Minimum Return Floor"
          >
            <Info className="size-4" aria-hidden />
            <span className="sr-only">Floor explanation</span>
          </button>
        </div>

        {tipOpen && (
          <p
            id={tipId}
            role="tooltip"
            className="mt-2 rounded-lg bg-secondary px-3 py-2 text-xs leading-relaxed text-[var(--accent)] ring-1 ring-border"
          >
            This floor is mathematically guaranteed by the PMM and cannot be
            diluted by late capital.
          </p>
        )}

        {showFloor ? (
          <div className="mt-3 space-y-1.5" data-testid="floor-preview">
            <p className="text-xs text-[var(--muted)]">
              Side: <span className="font-semibold text-foreground">{side}</span>
            </p>
            <p className="text-xs text-[var(--muted)]">
              Stake:{" "}
              <span className="font-semibold text-foreground">
                {parsedAmount.toFixed(4)} ETH
              </span>
            </p>
            <p className="text-lg font-bold tracking-tight text-primary">
              Min return floor: {minFloor.toFixed(4)} ETH
            </p>
            <p className="text-[11px] text-[var(--muted)]">
              Mock formula: bet × {MIN_RETURN_FLOOR_MULTIPLIER}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Enter a bet amount to preview your Minimum Return Floor.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={parsedAmount <= 0}
        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Buy {side} shares
      </button>
    </form>
  );
}
