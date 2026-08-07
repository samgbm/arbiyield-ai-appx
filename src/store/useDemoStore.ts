"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MockMarket } from "@/data/mockMarkets";

/**
 * Global Demo Mode fail-safe (Zustand + localStorage persistence).
 * Propagates across Yield, Prediction Markets, and El Niño modules.
 * Also holds locally "deployed" AI-created markets for pitch demos.
 */
export interface DemoStore {
  isDemoMode: boolean;
  /** Markets added via AI Market Creator deploy (demo fallback). */
  createdMarkets: MockMarket[];
  toggleDemoMode: () => void;
  setDemoMode: (value: boolean) => void;
  addCreatedMarket: (market: MockMarket) => void;
}

export const useDemoStore = create<DemoStore>()(
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
