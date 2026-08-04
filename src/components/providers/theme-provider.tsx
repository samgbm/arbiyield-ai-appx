"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";
import { THEMES } from "@/lib/themes";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      themes={[...THEMES]}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
