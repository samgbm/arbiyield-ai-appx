import { ElNinoPageShell } from "@/components/el-nino/ElNinoPageShell";

/**
 * Walkthrough 2 shell — Pre-El Niño farmer batch onboarding.
 */
export default function ElNinoOnboardingPage() {
  return (
    <ElNinoPageShell
      testId="el-nino-onboarding-page"
      eyebrow="El Niño · Walkthrough 2"
      title="Farmer Onboarding"
      description="Register cooperative members in a single Stylus batch transaction — prepare parametric insurance policies before the rains arrive."
    />
  );
}
