/** Theme class names applied via next-themes `attribute="class"`. */
export const THEMES = [
  "light",
  "dim",
  "dark",
  "quantum",
  "ethlima",
  "arbiscan",
  "midnight",
  "ocean",
  "forest",
  "slate",
  "sand",
  "ember",
  "aurora",
  "graphite",
  "ivory",
] as const;

export type ThemeName = (typeof THEMES)[number];

/** Includes Auto (system) for the picker UI. */
export type ThemeOption = ThemeName | "system";

export const THEME_OPTIONS: ThemeOption[] = ["system", ...THEMES];

export const THEME_META: Record<
  ThemeOption,
  { label: string; swatch: string; description: string }
> = {
  system: {
    label: "Auto (System)",
    swatch: "linear-gradient(135deg,#f8f9fa 50%,#12161c 50%)",
    description: "Follow OS light / dark preference",
  },
  light: {
    label: "Light",
    swatch: "#ffffff",
    description: "Etherscan / Arbiscan daylight",
  },
  dim: {
    label: "Dim",
    swatch: "#1c2333",
    description: "Explorer dim mode",
  },
  dark: {
    label: "Dark",
    swatch: "#0b0e11",
    description: "Explorer night mode",
  },
  quantum: {
    label: "Quantum3",
    swatch: "#020202",
    description: "quantum3labs.com — black + indigo",
  },
  ethlima: {
    label: "ETH Lima",
    swatch: "#131313",
    description: "hackathon.ethlima.org sponsors",
  },
  arbiscan: {
    label: "Arbiscan",
    swatch: "#1e2022",
    description: "Sepolia Arbiscan chrome",
  },
  midnight: {
    label: "Midnight",
    swatch: "#0b1426",
    description: "Deep navy marketplace",
  },
  ocean: {
    label: "Ocean",
    swatch: "#071a22",
    description: "Teal coastal tones",
  },
  forest: {
    label: "Forest",
    swatch: "#0f1a14",
    description: "Moss and pine calm",
  },
  slate: {
    label: "Slate",
    swatch: "#151a22",
    description: "Cool industrial gray",
  },
  sand: {
    label: "Sand",
    swatch: "#f3eee6",
    description: "Warm stone surfaces",
  },
  ember: {
    label: "Ember",
    swatch: "#1a0f0d",
    description: "Charred warmth",
  },
  aurora: {
    label: "Aurora",
    swatch: "#0b1618",
    description: "Cool northern glow",
  },
  graphite: {
    label: "Graphite",
    swatch: "#121212",
    description: "Monochrome precision",
  },
  ivory: {
    label: "Ivory",
    swatch: "#fbfaf6",
    description: "Soft paper and ink",
  },
};
