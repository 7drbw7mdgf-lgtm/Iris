import type { ThemeName, PaletteName, StatTest } from "./graphTypes";

export interface UserSettings {
  shellTheme: "light" | "dark" | "system";
  accentColor: string;
  paperCanvas: boolean;
  uiDensity: "comfortable" | "compact";
  defaultDpi: number;
  defaultExportFormat: "svg" | "png" | "pdf";
  defaultWidth: number;
  defaultHeight: number;
  paperCanvasTone: "white" | "warm" | "cool" | "dark";
  canvasShadow: "soft" | "crisp" | "none";
  defaultPublicationTheme: ThemeName;
  defaultPalette: PaletteName;
  inspectorScrollMemory: boolean;
  autoRenderOnFieldDrop: boolean;
  decimalPrecision: number;
  defaultStatTest: StatTest;
}

export const DEFAULT_SETTINGS: UserSettings = {
  shellTheme: "light",
  accentColor: "#a24bcf",
  paperCanvas: true,
  uiDensity: "comfortable",
  defaultDpi: 300,
  defaultExportFormat: "svg",
  defaultWidth: 7,
  defaultHeight: 5,
  paperCanvasTone: "white",
  canvasShadow: "soft",
  defaultPublicationTheme: "classic",
  defaultPalette: "prism",
  inspectorScrollMemory: true,
  autoRenderOnFieldDrop: true,
  decimalPrecision: 2,
  defaultStatTest: "none",
};

export const ACCENT_PRESETS: { id: string; label: string; color: string }[] = [
  { id: "iris", label: "Iris Purple", color: "#a24bcf" },
  { id: "sapphire", label: "Sapphire Blue", color: "#2f6df0" },
  { id: "emerald", label: "Emerald Teal", color: "#059669" },
  { id: "crimson", label: "Crimson Rose", color: "#e11d48" },
  { id: "amber", label: "Amber Sunset", color: "#d97706" },
  { id: "cyan", label: "Cyan Nordic", color: "#0891b2" },
  { id: "violet", label: "Electric Violet", color: "#7c3aed" },
  { id: "slate", label: "Graphite Slate", color: "#475569" },
];

export interface FriendlyRenderIssue {
  engine: "Python" | "R" | "Renderer";
  kind: string;
  summary: string;
  fix: string;
  raw: string;
}
