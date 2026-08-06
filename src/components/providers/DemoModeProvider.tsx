"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type DemoModeContextValue = {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
};

export const DemoModeContext = createContext<DemoModeContextValue | null>(
  null,
);

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error("useDemoMode must be used within a DemoModeProvider");
  }
  return context;
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);

  function toggleDemoMode() {
    setIsDemoMode((prev) => !prev);
  }

  return (
    <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
}
