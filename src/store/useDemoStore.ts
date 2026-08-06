"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Global Demo Mode fail-safe (Zustand + localStorage persistence).
 * When enabled, AI/Web3 hooks return mock data so live pitches never
 * die on RPC outages or OpenAI rate limits.
 */
type DemoState = {
  isDemoMode: boolean;
  /** Flip Demo Mode on/off. */
  toggleDemoMode: () => void;
  /** Explicit setter (useful for tests and deep-links). */
  setDemoMode: (value: boolean) => void;
};

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      isDemoMode: false,
      toggleDemoMode: () =>
        set((state) => ({ isDemoMode: !state.isDemoMode })),
      setDemoMode: (value) => set({ isDemoMode: value }),
    }),
    {
      name: "arbiyield-demo-storage",
      // Only persist the flag — never functions.
      partialize: (state) => ({ isDemoMode: state.isDemoMode }),
    },
  ),
);
