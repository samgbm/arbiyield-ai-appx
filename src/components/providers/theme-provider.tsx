"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";
import { THEMES } from "@/lib/themes";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={[...THEMES]}
      disableTransitionOnChange
      storageKey="arbiyield-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
