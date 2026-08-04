export const THEMES = [
  "light",
  "dark",
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

export const THEME_META: Record<
  ThemeName,
  { label: string; swatch: string; description: string }
> = {
  light: {
    label: "Light",
    swatch: "#f7f8fa",
    description: "Clean daylight storefront",
  },
  dark: {
    label: "Dark",
    swatch: "#0f1218",
    description: "High-contrast night mode",
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
