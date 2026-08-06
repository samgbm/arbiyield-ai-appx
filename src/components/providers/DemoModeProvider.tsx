"use client";

import type { ReactNode } from "react";
import { useDemoStore } from "@/store/useDemoStore";

/**
 * Compatibility shim: existing hooks call `useDemoMode()`.
 * State now lives in the persisted Zustand store (`useDemoStore`).
 */
export function useDemoMode() {
  const isDemoMode = useDemoStore((s) => s.isDemoMode);
  const toggleDemoMode = useDemoStore((s) => s.toggleDemoMode);
  return { isDemoMode, toggleDemoMode };
}

/** No-op provider kept so older tests/layouts that wrap children still compile. */
export function DemoModeProvider({ children }: { children: ReactNode }) {
  return children;
}
