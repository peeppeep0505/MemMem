import { Platform } from "react-native";

export type ThemeMode = "light" | "dark";

export type AppThemeColors = {
  text: string;
  background: string;
  surface: string;
  sidebar: string;
  border: string;

  primary: string;
  primaryStrong: string;
  primarySoft: string;
  primarySoft2: string;
  hover: string;

  mutedText: string;

  logout: string;
  logoutSoft: string;
  logoutBorder: string;
  logoutIconBg: string;

  // ✦ Diary-specific extras
  accent: string;        // warm blush accent
  accentSoft: string;    // very light blush for card bg
  paperBg: string;       // soft parchment / journal paper
  inkText: string;       // deep ink color for headings
  ruledLine: string;     // faint ruled lines / dividers
  tagPill: string;       // pill badge background
  moodSelected: string;  // selected mood ring
  coverPlaceholder: string; // cover photo placeholder bg
  onlineBanner: string;  // online banner background
  offlineBanner: string; // offline banner background
};

export const Colors: Record<ThemeMode, AppThemeColors> = {
  light: {
    text: "#2d1b2e",
    background: "#fff8f9",
    surface: "#ffffff",
    sidebar: "#fff4f6",
    border: "#f9d0dd",

    primary: "#e8739a",
    primaryStrong: "#d4547e",
    primarySoft: "#fdf0f4",
    primarySoft2: "#fce4ec",
    hover: "#fff0f4",

    mutedText: "#a07080",

    logout: "#e05c7a",
    logoutSoft: "#fff0f3",
    logoutBorder: "#f8c4d0",
    logoutIconBg: "#ffd6e0",

    // diary extras
    accent: "#f4a0bb",
    accentSoft: "#fff5f8",
    paperBg: "#fffaf9",
    inkText: "#1e0f18",
    ruledLine: "#f3dde5",
    tagPill: "#fde4ef",
    moodSelected: "#e8739a",
    coverPlaceholder: "#fdf1f5",

    //shop
    onlineBanner: "#fffec7",
    offlineBanner: "#e6b6b6",
  },

  dark: {
    text: "#f8e8ee",
    background: "#1a0f14",
    surface: "#241218",
    sidebar: "#1e0f15",
    border: "#4a2535",

    primary: "#f48db0",
    primaryStrong: "#f9b8ce",
    primarySoft: "#2e1220",
    primarySoft2: "#3a1828",
    hover: "#2a1520",

    mutedText: "#c4899e",

    logout: "#f87191",
    logoutSoft: "#3b1424",
    logoutBorder: "#7c2540",
    logoutIconBg: "#4e1830",

    // diary extras
    accent: "#c9607e",
    accentSoft: "#2a1018",
    paperBg: "#1f1015",
    inkText: "#f8e8ee",
    ruledLine: "#3e2030",
    tagPill: "#3d1a28",
    moodSelected: "#f48db0",
    coverPlaceholder: "#281018",

    //shop
    onlineBanner: "#5c4b38",
    offlineBanner: "#7c1919",
  },
};

// ✦ Decorative glyphs — use freely throughout the app
export const Glyphs = {
  sparkle: "✦",
  heart: "♡",
  floral: "❁",
  star: "⋆",
  note: "𝄞",
  moon: "⟡",
  sakura: "ৎ",
  clover: "☘︎",
  leaf: "✿",
  soft: "‧₊˚",
};

export const Fonts = Platform.select({
  ios: {
    sans: "System",
    rounded: "System",
    mono: "Courier",
    serif: "Georgia",
  },
  android: {
    sans: "sans-serif",
    rounded: "sans-serif",
    mono: "monospace",
    serif: "serif",
  },
  default: {
    sans: "sans-serif",
    rounded: "sans-serif",
    mono: "monospace",
    serif: "serif",
  },
  web: {
    sans: "'DM Sans', 'Nunito', system-ui, sans-serif",
    rounded: "'Nunito', 'Quicksand', 'SF Pro Rounded', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    serif: "'Playfair Display', Georgia, 'Times New Roman', serif",
    display: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
    add: "'Betania Patmos Guideline'",
  },
});