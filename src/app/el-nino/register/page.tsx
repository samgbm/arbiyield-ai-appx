import { AidCheckpointRegisterForm } from "@/components/elnino/AidCheckpointRegisterForm";
import { NINO_CONTRACT_ADDRESS } from "@/lib/elninoContract";

/**
 * Register aid shipments / chained checkpoints (on-chain + off-chain).
 */
export default function ElNinoRegisterPage() {
  return (
    <div className="hero-wash" data-testid="el-nino-register-page">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-8 space-y-3">
          <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
            El Niño · Aid Registration
          </p>
          <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            Register Aid Checkpoint
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--accent)] sm:text-base">
            Create a genesis shipment or append the next stop in the hash chain.
            Each step is notarized on Stylus and stored with full logistics
            detail in Supabase — then verifiable on the Logistics Tracker.
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

        <AidCheckpointRegisterForm />
      </div>
    </div>
  );
}
