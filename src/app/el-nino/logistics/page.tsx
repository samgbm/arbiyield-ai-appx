import { ElNinoPageShell } from "@/components/el-nino/ElNinoPageShell";

/**
 * Walkthrough 1 shell — Aid logistics provenance tracker.
 */
export default function ElNinoLogisticsPage() {
  return (
    <ElNinoPageShell
      testId="el-nino-logistics-page"
      eyebrow="El Niño · Walkthrough 1"
      title="Logistics Tracker"
      description="Immutable aid-route provenance: scan checkpoints, verify SHA-256 hashes on Stylus, and audit the supply chain from warehouse to cooperative."
    />
  );
}
