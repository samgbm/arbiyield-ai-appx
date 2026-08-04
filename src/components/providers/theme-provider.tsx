import { ThemeProvider as WrkszThemeProvider } from "@wrksz/themes/next";
import type { ReactNode } from "react";
import { THEMES } from "@/lib/themes";

export async function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <WrkszThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={[...THEMES]}
      disableTransitionOnChange
      storageKey="arbiyield-theme"
    >
      {children}
    </WrkszThemeProvider>
  );
}
