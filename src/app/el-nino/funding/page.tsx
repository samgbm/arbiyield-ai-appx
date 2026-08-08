import { CrowdfundingPool } from "@/components/elnino/CrowdfundingPool";
import { NINO_CONTRACT_ADDRESS } from "@/lib/elninoContract";

/**
 * Coastal El Niño disaster crowdfunding — ETH pool for zero-click flood payouts.
 */
export default function ElNinoFundingPage() {
  return (
    <div className="hero-wash" data-testid="el-nino-funding-page">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-8 space-y-3">
          <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
            El Niño · Disaster Crowdfunding
          </p>
          <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            Relief Pool for Coastal El Niño
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--accent)] sm:text-base">
            Crowdfunding for disaster relief helps communities recover fast by
            gathering small donations from a global audience. On Arbitrum, those
            gifts become a Stylus-backed ETH pool that pays farmers the moment
            the climate relay clears the flood threshold — transparent, urgent,
            and nearly fee-free.
          </p>
          <a
            href={`https://sepolia.arbiscan.io/address/${NINO_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-xs font-semibold text-sky-700 hover:underline dark:text-sky-300"
          >
            Pool contract {NINO_CONTRACT_ADDRESS.slice(0, 10)}… on Arbiscan
          </a>
        </header>

        <CrowdfundingPool />
      </div>
    </div>
  );
}
