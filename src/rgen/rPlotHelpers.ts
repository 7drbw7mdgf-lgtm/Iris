import { PlotSpec } from "../types";
import { rstr, paletteVec } from "./rEmbedder";

export function lineType(spec: PlotSpec): string {
  switch (spec.linePattern) {
    case "dash": return "dashed";
    case "dot": return "dotted";
    case "dashdot": return "dotdash";
    case "solid":
    default: return "solid";
  }
}

export function errorExpr(spec: PlotSpec): string {
  switch (spec.errorMetric) {
    case "sd": return "sd(x)";
    case "ci95": return "1.96 * sd(x)/sqrt(length(x))";
    case "range": return "(max(x, na.rm = TRUE) - min(x, na.rm = TRUE)) / 2";
    case "sem":
    default: return "sd(x)/sqrt(length(x))";
  }
}

export function errorFun(spec: PlotSpec): string {
  const e = errorExpr(spec);
  if (spec.errorDirection === "up") return `function(x) mean(x), fun.max = function(x) mean(x) + ${e}`;
  if (spec.errorDirection === "down") return `function(x) mean(x) - ${e}, fun.max = function(x) mean(x)`;
  return `function(x) mean(x) - ${e}, fun.max = function(x) mean(x) + ${e}`;
}

export function paletteScales(spec: PlotSpec, levels = 0): string {
  if (spec.palette === "viridis") {
    return `  scale_colour_viridis_d() +\n  scale_fill_viridis_d() +\n`;
  }
  const vec = paletteVec(spec, levels);
  return `  scale_colour_manual(values = ${vec}) +\n  scale_fill_manual(values = ${vec}) +\n`;
}

export function contFillScale(spec: PlotSpec, name: string): string {
  const nm = name ? `name = ${rstr(name)}, ` : "";
  switch (spec.contColorScale) {
    case "Cividis": return `  scale_fill_viridis_c(${nm}option = "cividis") +\n`;
    case "Plasma": return `  scale_fill_viridis_c(${nm}option = "plasma") +\n`;
    case "YlGnBu": return `  scale_fill_distiller(${nm}palette = "YlGnBu", direction = 1) +\n`;
    case "RdBu": return `  scale_fill_distiller(${nm}palette = "RdBu") +\n`;
    case "Viridis":
    default: return `  scale_fill_viridis_c(${nm}option = "viridis") +\n`;
  }
}

export function contColourScale(spec: PlotSpec, name: string): string {
  const nm = name ? `name = ${rstr(name)}, ` : "";
  switch (spec.contColorScale) {
    case "Cividis": return `  scale_colour_viridis_c(${nm}option = "cividis") +\n  scale_fill_viridis_c(${nm}option = "cividis") +\n`;
    case "Plasma": return `  scale_colour_viridis_c(${nm}option = "plasma") +\n  scale_fill_viridis_c(${nm}option = "plasma") +\n`;
    case "YlGnBu": return `  scale_colour_distiller(${nm}palette = "YlGnBu", direction = 1) +\n  scale_fill_distiller(${nm}palette = "YlGnBu", direction = 1) +\n`;
    case "RdBu": return `  scale_colour_distiller(${nm}palette = "RdBu") +\n  scale_fill_distiller(${nm}palette = "RdBu") +\n`;
    case "Viridis":
    default: return `  scale_colour_viridis_c(${nm}option = "viridis") +\n  scale_fill_viridis_c(${nm}option = "viridis") +\n`;
  }
}

export function themeCall(spec: PlotSpec): string {
  const base = `base_size = ${spec.baseFontSize}, base_family = ${rstr(spec.fontFamily)}`;
  let t: string;
  switch (spec.theme) {
    case "classic": t = `theme_classic(${base})`; break;
    case "minimal": t = `theme_minimal(${base})`; break;
    case "bw": t = `theme_bw(${base})`; break;
    case "dark": t = `theme_dark(${base})`; break;
    case "prism":
    default: t = `theme_classic(${base})`; break;
  }
  let legendPos: string;
  if (spec.legendPos === "none") {
    legendPos = '"none"';
  } else if (spec.legendX != null && spec.legendY != null) {
    const cx = Math.max(0, Math.min(1, spec.legendX)).toFixed(2);
    const cy = Math.max(0, Math.min(1, spec.legendY)).toFixed(2);
    legendPos = `c(${cx}, ${cy})`;
  } else {
    legendPos = `"${spec.legendPos}"`;
  }
  let extra = `theme(\n    legend.position = ${legendPos},\n    plot.title = element_text(face = "bold")`;
  if (spec.theme === "prism") {
    extra +=
      ',\n    axis.line = element_line(linewidth = 0.8, colour = "black"),\n    axis.ticks = element_line(linewidth = 0.8, colour = "black"),\n    axis.ticks.length = unit(4, "pt")';
  }
  if (!spec.showGrid) extra += ",\n    panel.grid = element_blank()";
  if (spec.backgroundColor) extra += `,\n    panel.background = element_rect(fill = ${rstr(spec.backgroundColor)}, colour = NA),\n    plot.background = element_rect(fill = ${rstr(spec.backgroundColor)}, colour = NA)`;
  extra += spec.showXTicks
    ? `,\n    axis.text.x = element_text(angle = ${spec.xTickAngle}, hjust = ${spec.xTickAngle === 0 ? 0.5 : 1})`
    : ",\n    axis.text.x = element_blank(),\n    axis.ticks.x = element_blank()";
  extra += spec.showYTicks
    ? `,\n    axis.text.y = element_text(angle = ${spec.yTickAngle})`
    : ",\n    axis.text.y = element_blank(),\n    axis.ticks.y = element_blank()";
  extra += "\n  )";
  return `  ${t} +\n  ${extra}`;
}

export function labsLine(spec: PlotSpec, opts: { yLabel?: string } = {}): string {
  const labs: string[] = [];
  if (spec.showAxisLabels === false) {
    labs.push("x = NULL");
  } else {
    labs.push(`x = ${rstr(spec.xLabel || spec.xVar)}`);
  }
  const histY = spec.histNorm === "density" ? "density" : spec.histNorm === "percent" ? "percent" : "count";
  const yl = opts.yLabel ?? (spec.graphType === "histogram" ? histY : spec.graphType === "density" ? "density" : spec.graphType === "ridgeline" ? spec.groupVar || "density" : spec.graphType === "ecdf" ? "cumulative probability" : spec.graphType === "rug" ? "" : spec.graphType === "volcano" ? `-log10(${spec.yLabel || spec.yVar})` : spec.yLabel || spec.yVar);
  labs.push(spec.showAxisLabels === false ? "y = NULL" : `y = ${rstr(yl)}`);
  if (spec.title) labs.push(`title = ${rstr(spec.title)}`);
  if (spec.subtitle) labs.push(`subtitle = ${rstr(spec.subtitle)}`);
  return `  labs(${labs.join(", ")}) +\n`;
}
