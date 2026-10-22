import { Dataset, PlotSpec, PALETTES } from "../types";

export function rstr(s: string): string {
  return '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
}

export const q = (name: string) => "`" + name + "`";

export function csvField(v: string | number | null): string {
  if (v === null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function embedData(ds: Dataset): string {
  if (ds.columns.length === 0) return "df <- data.frame()";
  const header = ds.columns.map(csvField).join(",");
  const lines = ds.rows.map((r) => ds.columns.map((c) => csvField(r[c])).join(","));
  const csv = [header, ...lines].join("\n");
  return `df <- read.csv(text = ${rstr(csv)}, check.names = FALSE, stringsAsFactors = TRUE)`;
}

export function paletteVec(spec: PlotSpec, levels = 0): string {
  const arr = spec.markColor
    ? Array.from({ length: 12 }, () => spec.markColor)
    : PALETTES[spec.palette] ?? PALETTES.prism;
  const vec = "c(" + arr.map((c) => `"${c}"`).join(", ") + ")";
  return levels > arr.length ? `rep_len(${vec}, ${levels})` : vec;
}

const X_FILL_TYPES: PlotSpec["graphType"][] = ["pie", "donut", "treemap", "waffle", "circularBar"];

export function discreteLevels(spec: PlotSpec, ds: Dataset): number {
  const distinct = (col: string) => (col ? new Set(ds.rows.map((r) => String(r[col] ?? ""))).size : 0);
  return Math.max(distinct(spec.groupVar), X_FILL_TYPES.includes(spec.graphType) ? distinct(spec.xVar) : 0);
}

export function lineColour(spec: PlotSpec): string {
  return spec.lineColor || spec.markColor || (PALETTES[spec.palette] ?? PALETTES.prism)[0];
}

export function pointShape(spec: PlotSpec): number {
  switch (spec.pointSymbol) {
    case "square": return 15;
    case "diamond": return 18;
    case "triangle-up": return 17;
    case "cross": return 3;
    case "x": return 4;
    case "circle":
    default: return 19;
  }
}

export function cleanLibraries(libraries: string[]): string[] {
  const seen = new Set(["ggplot2"]);
  return libraries
    .map((lib) => lib.trim().replace(/^library\((.*)\)$/i, "$1").replace(/^["']|["']$/g, ""))
    .filter((lib) => /^[A-Za-z][A-Za-z0-9._]*$/.test(lib))
    .filter((lib) => !seen.has(lib) && !!seen.add(lib));
}

export function resolvedSpec(spec: PlotSpec, ds: Dataset): PlotSpec {
  const has = (col: string) => ds.columns.includes(col);
  const numeric = ds.columns.filter((col) => ds.types[col] === "numeric");
  const categorical = ds.columns.filter((col) => ds.types[col] === "categorical");
  const first = ds.columns[0] ?? "";
  const firstNumeric = numeric[0] ?? first;
  const secondNumeric = numeric.find((col) => col !== firstNumeric) ?? firstNumeric;
  const firstCategorical = categorical[0] ?? first;

  let xVar = has(spec.xVar) ? spec.xVar : firstNumeric;
  let yVar = has(spec.yVar) ? spec.yVar : secondNumeric;

  if (["bar", "lollipop", "circularBar", "pie", "donut", "treemap", "waffle"].includes(spec.graphType)) {
    xVar = has(spec.xVar) ? spec.xVar : firstCategorical;
    yVar = has(spec.yVar) && ds.types[spec.yVar] === "numeric" ? spec.yVar : firstNumeric;
  } else if (["histogram", "density", "ecdf", "rug", "qq", "ridgeline"].includes(spec.graphType)) {
    xVar = has(spec.xVar) ? spec.xVar : firstNumeric;
    yVar = has(spec.yVar) ? spec.yVar : secondNumeric;
  } else if (["box", "violin", "strip", "beeswarm"].includes(spec.graphType)) {
    xVar = has(spec.xVar) ? spec.xVar : firstCategorical;
    yVar = has(spec.yVar) && ds.types[spec.yVar] === "numeric" ? spec.yVar : firstNumeric;
  }

  const groupVar = has(spec.groupVar) ? spec.groupVar : "";
  const colorVar = has(spec.colorVar) && ds.types[spec.colorVar] === "numeric" ? spec.colorVar : "";
  const sizeVar = has(spec.sizeVar) && ds.types[spec.sizeVar] === "numeric" ? spec.sizeVar : "";
  const labelVar = has(spec.labelVar) ? spec.labelVar : "";
  const rightYVar = has(spec.rightYVar) && ds.types[spec.rightYVar] === "numeric" ? spec.rightYVar : "";
  return { ...spec, xVar, yVar, groupVar: colorVar ? "" : groupVar, colorVar, sizeVar, labelVar, rightYVar };
}
