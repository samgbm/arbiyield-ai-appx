"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MockMarket } from "@/data/mockMarkets";

/**
 * Global Demo Mode fail-safe (Zustand + localStorage persistence).
 * Also holds locally "deployed" AI-created markets for pitch demos.
 */
type DemoState = {
  isDemoMode: boolean;
  /** Markets added via AI Market Creator deploy (demo fallback). */
  createdMarkets: MockMarket[];
  toggleDemoMode: () => void;
  setDemoMode: (value: boolean) => void;
  addCreatedMarket: (market: MockMarket) => void;
};

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      isDemoMode: false,
      createdMarkets: [],
      toggleDemoMode: () =>
        set((state) => ({ isDemoMode: !state.isDemoMode })),
      setDemoMode: (value) => set({ isDemoMode: value }),
      addCreatedMarket: (market) =>
        set((state) => ({
          // Newest first; skip duplicate ids.
          createdMarkets: state.createdMarkets.some((m) => m.id === market.id)
            ? state.createdMarkets
            : [market, ...state.createdMarkets],
        })),
    }),
    {
      name: "arbiyield-demo-storage",
      partialize: (state) => ({
        isDemoMode: state.isDemoMode,
        createdMarkets: state.createdMarkets,
      }),
    },
  ),
);
