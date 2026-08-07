import { ElNinoPageShell } from "@/components/el-nino/ElNinoPageShell";

/**
 * Walkthrough 3 shell — Zero-click rainfall oracle trigger.
 */
export default function ElNinoOraclePage() {
  return (
    <ElNinoPageShell
      testId="el-nino-oracle-page"
      eyebrow="El Niño · Walkthrough 3"
      title="Oracle Trigger"
      description="Simulate ENFEN / SENAMHI rainfall feeds, clear parametric thresholds, and watch zero-click USDC disbursements hit farmer wallets."
    />
  );
}
