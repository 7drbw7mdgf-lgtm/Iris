import { Dataset } from "../types";

export const IRIS_R_SYNC_START = "# --- Iris synced graph: start ---";
export const IRIS_R_SYNC_END = "# --- Iris synced graph: end ---";

export function inferRLibrariesFromCode(code: string): string {
  const libs = Array.from(code.matchAll(/\b(?:library|require)\s*\(\s*["']?([A-Za-z0-9_.]+)["']?\s*\)/g))
    .map((match) => match[1])
    .filter((lib) => lib.toLowerCase() !== "ggplot2");
  return Array.from(new Set(libs)).join(", ");
}

export function codeMentionsDatasetColumns(code: string, ds: Dataset): boolean {
  return ds.columns.some((col) => {
    const escaped = col.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`["'\`]${escaped}["'\`]|\\b${escaped}\\b`).test(code);
  });
}

export function rScriptOwnsDataOrStyle(code: string, ds: Dataset): boolean {
  const lower = code.toLowerCase();
  return (
    /\b(?:read\.csv|read_csv|read\.table|read_excel|data\.frame|tibble|tribble)\s*\(/.test(lower) ||
    /\b(?:theme|scale_|coord_|facet_|guides|labs|xlab|ylab|ggtitle)\w*\s*\(/.test(lower) ||
    /\b(?:par|plot|points|lines|legend|axis|box)\s*\(/.test(lower) ||
    !codeMentionsDatasetColumns(code, ds)
  );
}

export function stripIrisSyncedBlock(code: string): string {
  const start = code.indexOf(IRIS_R_SYNC_START);
  const end = code.indexOf(IRIS_R_SYNC_END);
  if (start >= 0 && end >= start) {
    return `${code.slice(0, start)}${code.slice(end + IRIS_R_SYNC_END.length)}`.trim();
  }
  return code;
}

export function rScriptPreamble(code: string): string {
  const withoutSyncedBlock = stripIrisSyncedBlock(code);
  const lines = withoutSyncedBlock.split(/\r?\n/);
  const firstPlotLine = lines.findIndex((line) => {
    const trimmed = line.trim();
    return (
      /\bggplot\s*\(/.test(trimmed) ||
      /^p\s*<-/.test(trimmed) ||
      /^plot\s*\(/.test(trimmed) ||
      /^ggsave\s*\(/.test(trimmed)
    );
  });
  const preambleLines = firstPlotLine >= 0 ? lines.slice(0, firstPlotLine) : lines;
  return preambleLines.join("\n").trim();
}

export function syncRScriptWithVisualCode(currentCode: string, generatedCode: string, name: string | null): string {
  const preamble = rScriptPreamble(currentCode);
  const header = name
    ? `# Opened from ${name}. Setup above is preserved; Iris rewrites the graph block below from the visual controls.`
    : "# Iris rewrites the graph block below from the visual controls.";
  return (
    [preamble, preamble ? "" : "", header, IRIS_R_SYNC_START, generatedCode.trim(), IRIS_R_SYNC_END]
      .filter((part, index) => part || index === 1)
      .join("\n")
      .trim() + "\n"
  );
}
