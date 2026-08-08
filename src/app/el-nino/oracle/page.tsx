import { ClimateRelayTrigger } from "@/components/elnino/ClimateRelayTrigger";
import { PayoutFeed } from "@/components/elnino/PayoutFeed";
import { NINO_CONTRACT_ADDRESS } from "@/lib/elninoContract";

/**
 * Walkthrough 3 — Climate Data Relay + live zero-click payout feed.
 */
export default function ElNinoOraclePage() {
  return (
    <div className="hero-wash" data-testid="el-nino-oracle-page">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-8 space-y-3">
          <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
            El Niño · Walkthrough 3
          </p>
          <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            Climate Data Relay Dashboard — Live Network Execution
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--accent)] sm:text-base">
            Push regional rainfall into the Stylus Climate Relayer. When the
            flood threshold clears, active policies at that location receive
            zero-click disbursements — watch them land in the live feed with
            Arbiscan verification links.
          </p>
          <a
            href={`https://sepolia.arbiscan.io/address/${NINO_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-xs font-semibold text-sky-700 hover:underline dark:text-sky-300"
          >
            Contract {NINO_CONTRACT_ADDRESS.slice(0, 10)}… on Arbiscan
          </a>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
          <ClimateRelayTrigger />
          <PayoutFeed />
        </div>
      </div>
    </div>
  );
}
