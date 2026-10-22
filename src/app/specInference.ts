import { Dataset, PlotSpec } from "../types";
import { GraphLibrary } from "./types";

export function codeValueForKey(code: string, key: string): string {
  const patterns = [
    new RegExp(`${key}\\s*=\\s*["']([^"']+)["']`, "i"),
    new RegExp(`${key}\\s*=\\s*([A-Za-z0-9_.]+)`, "i"),
  ];
  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

export function firstExistingColumn(ds: Dataset, candidates: string[]): string {
  return candidates.find((candidate) => ds.columns.includes(candidate)) || "";
}

export function graphTypeFromPanelMetadata(value: string): PlotSpec["graphType"] | null {
  const normalized = value.toLowerCase().replace(/[\s_-]+/g, "");
  const aliases: Partial<Record<string, PlotSpec["graphType"]>> = {
    scatter: "scatter",
    point: "scatter",
    line: "line",
    trajectory: "line",
    timeseries: "line",
    bar: "bar",
    histogram: "histogram",
    hist: "histogram",
    density: "density",
    box: "box",
    boxplot: "box",
    violin: "violin",
    heatmap: "heatmap",
    facet: "facet",
    composite: "facet",
    smooth: "smooth",
    regression: "smooth",
    area: "area",
    step: "step",
    errorbar: "errorBar",
  };
  return aliases[normalized] ?? null;
}

export function inferPythonLibraryFromCode(code: string): Exclude<GraphLibrary, "ggplot2"> {
  const lower = code.toLowerCase();
  if (/\baltair\b|\balt\./.test(lower)) return "altair";
  if (/\bseaborn\b|\bsns\./.test(lower)) return "seaborn";
  if (/\bmatplotlib\b|\bplt\./.test(lower)) return "matplotlib";
  return "plotly";
}

export function inferPythonGraphTitle(code: string, fallback: string): string {
  const titlePatterns = [
    /(?:plt\.title|set_title)\s*\(\s*["']([^"']+)/,
    /title\s*=\s*["']([^"']+)/,
    /update_layout\s*\([^)]*title\s*=\s*["']([^"']+)/s,
    /properties\s*\([^)]*title\s*=\s*["']([^"']+)/s,
  ];
  for (const pattern of titlePatterns) {
    const match = code.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return fallback;
}

export function inferGraphTypeFromCode(code: string): PlotSpec["graphType"] | null {
  const lower = code.toLowerCase();
  const matchers: { type: PlotSpec["graphType"]; patterns: RegExp[] }[] = [
    { type: "facet", patterns: [/\bfacet_(?:wrap|grid)\s*\(/, /\bplt\.subplots\s*\(\s*[2-9]\s*,/, /\bplt\.subplots\s*\([^)]*,\s*[2-9]\s*\)/, /\bgridspec\b/, /\bmake_subplots\s*\(/] },
    { type: "qq", patterns: [/\bqqplot\s*\(/, /\bprobplot\s*\(/, /\bgeom_qq\b/, /\bstat_qq\b/] },
    { type: "volcano", patterns: [/\bvolcano\b/, /-log10\s*\(/, /neg_log10/, /logfc|log2fc/] },
    { type: "heatmap", patterns: [/\bheatmap\s*\(/, /\bsns\.heatmap\s*\(/, /\bpx\.imshow\s*\(/, /\bgeom_tile\s*\(/, /\bgeom_raster\s*\(/] },
    { type: "density2d", patterns: [/\bdensity_contour\s*\(/, /\bgeom_density_2d\b/, /\bstat_density_2d\b/] },
    { type: "hexbin", patterns: [/\bhexbin\s*\(/, /\bgeom_hex\b/] },
    { type: "box", patterns: [/\bboxplot\s*\(/, /\bsns\.boxplot\s*\(/, /\bpx\.box\s*\(/, /\bgeom_boxplot\b/] },
    { type: "violin", patterns: [/\bviolinplot\s*\(/, /\bsns\.violinplot\s*\(/, /\bpx\.violin\s*\(/, /\bgeom_violin\b/] },
    { type: "beeswarm", patterns: [/\bswarmplot\s*\(/, /\bbeeswarm\s*\(/, /\bgeom_beeswarm\b/] },
    { type: "strip", patterns: [/\bstripplot\s*\(/, /\bgeom_jitter\b/, /\bgeom_dotplot\b/] },
    { type: "histogram", patterns: [/\bhist\s*\(/, /\bhistplot\s*\(/, /\bpx\.histogram\s*\(/, /\bgeom_histogram\b/] },
    { type: "density", patterns: [/\bkdeplot\s*\(/, /\bdensity\s*\(/, /\bgeom_density\b/] },
    { type: "bar", patterns: [/\bbarh?\s*\(/, /\bbarplot\s*\(/, /\bpx\.bar\s*\(/, /\bgeom_(?:bar|col)\b/, /\.mark_bar\s*\(/] },
    { type: "errorBar", patterns: [/\berrorbar\s*\(/, /\bgeom_errorbar\b/, /\bstat_summary\b/] },
    { type: "lollipop", patterns: [/\bstem\s*\(/, /\bgeom_segment\b.*\bgeom_point\b/s] },
    { type: "pie", patterns: [/\bpie\s*\(/, /\bpx\.pie\s*\(/, /\.mark_arc\s*\(/] },
    { type: "donut", patterns: [/\bdonut\b/, /\bhole\s*=/] },
    { type: "treemap", patterns: [/\btreemap\b/, /\bpx\.treemap\s*\(/] },
    { type: "sankey", patterns: [/\bsankey\b/, /\bgo\.sankey\s*\(/] },
    { type: "alluvial", patterns: [/\balluvial\b/, /\bgeom_alluvium\b/] },
    { type: "dendrogram", patterns: [/\bdendrogram\b/, /\bhclust\s*\(/, /\blinkage\s*\(/] },
    { type: "manhattan", patterns: [/\bmanhattan\b/, /\bchromosome\b.*\bpvalue\b/s] },
    { type: "roc", patterns: [/\broc_curve\b/, /\bgeom_roc\b/, /\bauc\b/] },
    { type: "pr", patterns: [/\bprecision_recall\b/, /\bpr_curve\b/] },
    { type: "smooth", patterns: [/\bregplot\s*\(/, /\blmplot\s*\(/, /\bgeom_smooth\b/] },
    { type: "area", patterns: [/\bfill_between\s*\(/, /\bpx\.area\s*\(/, /\bgeom_area\b/, /\.mark_area\s*\(/] },
    { type: "step", patterns: [/\bstep\s*\(/, /\bgeom_step\b/] },
    { type: "line", patterns: [/\b(?:plt|ax\w*|axs\w*(?:\[[^\]]+\])?)\.plot\s*\(/, /\blineplot\s*\(/, /\bpx\.line\s*\(/, /\bgeom_line\b/, /\.mark_line\s*\(/] },
    { type: "bubble", patterns: [/\bpx\.scatter\s*\([^)]*size\s*=/s, /\bscatter\s*\([^)]*s\s*=/s] },
    { type: "scatter", patterns: [/\bscatter\s*\(/, /\bscatterplot\s*\(/, /\bpx\.scatter\s*\(/, /\bgeom_point\b/, /\.mark_(?:point|circle)\s*\(/] },
  ];
  return matchers.find((matcher) => matcher.patterns.some((pattern) => pattern.test(lower)))?.type ?? null;
}

export function inferSpecFromCode(code: string, ds: Dataset): Partial<PlotSpec> {
  const inferred: Partial<PlotSpec> = {};
  const graphType = inferGraphTypeFromCode(code);
  if (graphType) inferred.graphType = graphType;

  const aesMatch = code.match(/aes\s*\(([^)]*)\)/is);
  const aesBody = aesMatch?.[1] || "";
  const xCandidates = [codeValueForKey(code, "x"), codeValueForKey(aesBody, "x")];
  const yCandidates = [codeValueForKey(code, "y"), codeValueForKey(aesBody, "y")];
  const groupCandidates = [
    codeValueForKey(code, "color"),
    codeValueForKey(code, "colour"),
    codeValueForKey(code, "hue"),
    codeValueForKey(code, "fill"),
    codeValueForKey(code, "c"),
    codeValueForKey(aesBody, "color"),
    codeValueForKey(aesBody, "colour"),
    codeValueForKey(aesBody, "hue"),
    codeValueForKey(aesBody, "fill"),
  ];
  const sizeCandidates = [codeValueForKey(code, "size"), codeValueForKey(aesBody, "size")];
  const titleMatch =
    code.match(/(?:title|labs\s*\([^)]*title)\s*=\s*["']([^"']+)["']/i) ||
    code.match(/ggtitle\s*\(\s*["']([^"']+)["']/i);

  const xVar = firstExistingColumn(ds, xCandidates);
  const yVar = firstExistingColumn(ds, yCandidates);
  const groupVar = firstExistingColumn(ds, groupCandidates);
  const colorVar = firstExistingColumn(ds, groupCandidates);
  const sizeVar = firstExistingColumn(ds, sizeCandidates);
  if (xVar) inferred.xVar = xVar;
  if (yVar) inferred.yVar = yVar;
  if (groupVar && ds.types[groupVar] === "categorical") inferred.groupVar = groupVar;
  if (colorVar && ds.types[colorVar] === "numeric") {
    inferred.colorVar = colorVar;
    inferred.groupVar = "";
  }
  if (sizeVar && ds.types[sizeVar] === "numeric") inferred.sizeVar = sizeVar;
  if (/\b(?:geom_smooth|regplot|lmplot|trendline\s*=\s*["']ols["']|method\s*=\s*["']lm["'])\b/i.test(code))
    inferred.stat = "regression";
  if (/\b(?:axhline|geom_hline|add_hline)\b/i.test(code) && /\b(?:mean|average|avg)\b/i.test(code))
    inferred.stat = "average";
  if (titleMatch?.[1]) inferred.title = titleMatch[1];
  return inferred;
}
