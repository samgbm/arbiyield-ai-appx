import type { ReactNode } from "react";
import { AI } from "@/app/actions";

/**
 * Provides AI SDK RSC context (useUIState / useActions) for the Market Creator.
 */
export default function CreateMarketLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AI>{children}</AI>;
}
