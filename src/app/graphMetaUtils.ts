import { Dataset, GRAPH_CATEGORIES, PlotSpec } from "../types";
import { GraphLibrary, GraphState, AssetControlKind, AssetControl, DashboardFilter } from "./types";
export { friendlyRenderIssue, friendlyRenderAlert } from "./renderErrorUtils";

export function graphTypeLabel(type: PlotSpec["graphType"]): string {
  return GRAPH_CATEGORIES.flatMap((group) => group.types).find((graph) => graph.id === type)?.label ?? type;
}

export function graphLibraryLabel(library: GraphLibrary): string {
  switch (library) {
    case "ggplot2":
      return "ggplot2";
    case "matplotlib":
      return "matplotlib";
    case "seaborn":
      return "seaborn";
    case "altair":
      return "Altair";
    case "plotly":
    default:
      return "Plotly";
  }
}

export function projectAssetBackendForGraph(graph: GraphState | undefined): string {
  if (!graph) return "Figures";
  return graph.scriptBacked || graph.pythonCodeDirty || graph.rCodeDirty || !!graph.loadedPythonScriptName || !!graph.loadedRScriptName
    ? "Code figures"
    : "Visual figures";
}

export function projectGraphMeta(graph: GraphState | undefined): string {
  if (!graph) return "Figure";
  const library = graphLibraryLabel(graph.graphLibrary);
  const type = graphTypeLabel(graph.spec.graphType);
  const codeBacked =
    graph.scriptBacked || graph.pythonCodeDirty || graph.rCodeDirty || !!graph.loadedPythonScriptName || !!graph.loadedRScriptName;
  if (!codeBacked) return `${type} · ${library} · visual controls`;
  const source = graph.loadedPythonScriptName || graph.loadedRScriptName || "edited script";
  return `${type} · ${library} code · ${source} · broad style overrides`;
}

export function graphTypeCompatibility(type: PlotSpec["graphType"], ds: Dataset): { ok: boolean; reason: string } {
  const numeric = ds.columns.filter((col) => ds.types[col] === "numeric").length;
  const categorical = ds.columns.filter((col) => ds.types[col] === "categorical").length;
  const rows = ds.rows.length;
  if (rows === 0 || ds.columns.length === 0) return { ok: type === "table", reason: "Needs data first." };

  const needsNumeric = (count: number) => (numeric >= count ? null : `Needs at least ${count} numeric field${count === 1 ? "" : "s"}.`);
  const needsCategorical = (count: number) => (categorical >= count ? null : `Needs at least ${count} categorical field${count === 1 ? "" : "s"}.`);
  const needsEither = () => (numeric || categorical ? null : "Needs at least one field.");

  let reason: string | null = null;
  switch (type) {
    case "scatter":
    case "bubble":
    case "connected":
    case "smooth":
    case "volcano":
    case "blandAltman":
    case "line":
    case "step":
    case "timeSeries":
    case "slope":
    case "errorBar":
    case "area":
    case "stackedArea":
    case "stream":
    case "heatmap":
    case "density2d":
    case "hexbin":
    case "correlogram":
    case "parallel":
    case "radar":
    case "pca":
    case "umap":
    case "tsne":
    case "dendrogram":
      reason = needsNumeric(2);
      break;
    case "histogram":
    case "density":
    case "ecdf":
    case "rug":
    case "box":
    case "violin":
    case "beeswarm":
    case "strip":
    case "lollipop":
    case "dotPlot":
    case "forest":
    case "manhattan":
    case "qq":
      reason = needsNumeric(1);
      break;
    case "bar":
    case "pie":
    case "donut":
    case "treemap":
    case "waffle":
    case "circularBar":
      reason = needsEither();
      break;
    case "sankey":
    case "alluvial":
    case "chord":
    case "upset":
      reason = needsCategorical(2);
      break;
    case "kaplanMeier":
    case "survivalCurve":
    case "roc":
    case "pr":
    case "ridgeline":
    case "facet":
      reason = needsNumeric(1) ?? needsCategorical(1);
      break;
    case "table":
      reason = null;
      break;
  }
  return reason ? { ok: false, reason } : { ok: true, reason: "Compatible with this dataset." };
}

export function getChartMetadata(id: string | null): { desc: string; inputs: string } {
  const map: Record<string, { desc: string; inputs: string }> = {
    scatter: { desc: "Bivariate scatter plot displaying correlation, variance, or clustering between continuous metrics.", inputs: "X: Numeric, Y: Numeric, Color (opt)" },
    volcano: { desc: "Differential expression plot highlighting fold-change against statistical significance.", inputs: "X: Log2 Fold Change, Y: -Log10 P-value" },
    histogram: { desc: "Continuous frequency distribution partitioned into discrete value bins.", inputs: "X: Numeric, Color (opt)" },
    density: { desc: "Smoothed kernel density estimation showing probability distribution shape.", inputs: "X: Numeric, Group (opt)" },
    box: { desc: "Tukey five-number summary displaying median, quartiles, whiskers, and outlier points.", inputs: "X: Categorical, Y: Numeric" },
    violin: { desc: "Kernel density estimate mirrored on both sides to show multi-modal distributions.", inputs: "X: Categorical, Y: Numeric" },
    beeswarm: { desc: "Point-swarm layout avoiding point overlap to reveal true distribution density.", inputs: "X: Categorical, Y: Numeric" },
    bar: { desc: "Discrete comparisons across categories with optional error bars or stacking.", inputs: "X: Categorical, Y: Numeric" },
    line: { desc: "Sequential or chronological trends connecting observation values.", inputs: "X: Numeric / Date, Y: Numeric" },
    heatmap: { desc: "2D matrix visualization encoding values into continuous color gradients.", inputs: "X: Category, Y: Category, Value: Numeric" },
    pca: { desc: "Principal Component Analysis ordination projecting high-dimensional variance.", inputs: "PC1: Numeric, PC2: Numeric, Group (opt)" },
    umap: { desc: "Uniform Manifold Approximation and Projection preserving manifold structure.", inputs: "UMAP1: Numeric, UMAP2: Numeric, Cluster (opt)" },
    tsne: { desc: "t-Distributed Stochastic Neighbor Embedding for nonlinear cluster exploration.", inputs: "tSNE1: Numeric, tSNE2: Numeric, Cluster (opt)" },
    kaplanMeier: { desc: "Stepwise survival probability analysis over time with risk table integration.", inputs: "Time: Numeric, Event / Status: Binary" },
    survivalCurve: { desc: "Survival and progression curves across longitudinal treatment cohorts.", inputs: "Time: Numeric, Status: Binary, Group: Category" },
    manhattan: { desc: "Genome-wide association study (GWAS) p-values mapped across chromosomes.", inputs: "Chromosome: Category, Position: Numeric, P-value: Numeric" },
    forest: { desc: "Meta-analysis effect sizes and confidence intervals across experimental cohorts.", inputs: "Study: Category, Effect: Numeric, Error: Numeric" },
    ridgeline: { desc: "Staggered mountain ridge density profiles across multiple groups or time points.", inputs: "X: Numeric, Group: Categorical" },
    ecdf: { desc: "Empirical cumulative distribution function showing percentile distributions.", inputs: "X: Numeric, Group (opt)" },
    rug: { desc: "Tick marks along the coordinate axis indicating 1D observation density.", inputs: "X: Numeric" },
    qq: { desc: "Quantile-quantile comparison testing dataset adherence to theoretical normal distribution.", inputs: "Sample: Numeric" },
    blandAltman: { desc: "Method comparison plot showing difference vs average between two measurement techniques.", inputs: "Method A: Numeric, Method B: Numeric" },
    roc: { desc: "Receiver Operating Characteristic curve displaying True Positive vs False Positive rates.", inputs: "FPR: Numeric, TPR: Numeric" },
    pr: { desc: "Precision-Recall curve for evaluating classification performance on imbalanced data.", inputs: "Recall: Numeric, Precision: Numeric" },
    dotPlot: { desc: "Cleveland dot plot comparing discrete metrics with minimal ink-to-data ratio.", inputs: "X: Numeric, Y: Categorical" },
    lollipop: { desc: "Slender stem and marker emphasis for ranked quantitative comparisons.", inputs: "X: Numeric, Y: Categorical" },
    strip: { desc: "Jittered 1D strip plot showing individual observations across experimental conditions.", inputs: "X: Categorical, Y: Numeric" },
    treemap: { desc: "Nested rectangular layout encoding hierarchical and part-to-whole proportions.", inputs: "Category: Categorical, Value: Numeric" },
    waffle: { desc: "Square-grid pictographic chart visualizing percentages and proportions.", inputs: "Category: Categorical, Value: Numeric" },
    donut: { desc: "Circular composition chart with central callout hole for KPI metrics.", inputs: "Category: Categorical, Value: Numeric" },
    pie: { desc: "Classic proportional pie slice chart for relative compositional parts.", inputs: "Category: Categorical, Value: Numeric" },
    sankey: { desc: "Flow diagram depicting multi-stage transfers and proportional bandwidths.", inputs: "Source: Text, Target: Text, Value: Numeric" },
    alluvial: { desc: "Categorical flow diagram illustrating change in group membership over steps.", inputs: "Stage A: Category, Stage B: Category, Weight: Numeric" },
    chord: { desc: "Circular inter-relationship chart showing bidirectional flux between entities.", inputs: "Entity A: Category, Entity B: Category, Flux: Numeric" },
    dendrogram: { desc: "Hierarchical clustering tree illustrating taxonomy and distance relationships.", inputs: "Features: Numeric matrix / Distances" },
    upset: { desc: "Scalable alternative to Venn diagrams for complex multi-set intersections.", inputs: "Sets: Multi-column binary / presence matrix" },
    radar: { desc: "Equiangular polygon web comparing multiple quantitative attributes.", inputs: "Attributes: Multiple Numeric columns" },
    parallel: { desc: "Multivariate coordinate axes with polylines revealing high-dimensional patterns.", inputs: "Dimensions: Multiple Numeric columns" },
    table: { desc: "Tabular raw observation viewer with sorting and pagination.", inputs: "Any columns" },
  };
  return (
    map[id || ""] || {
      desc: "Publication-grade scientific visualization with customizable themes, scales, and styling.",
      inputs: "Compatible fields configured via axis shelves.",
    }
  );
}

export function computeSparklineBins(rows: Record<string, any>[], col: string): number[] {
  if (!rows || !rows.length) return [2, 4, 8, 5, 3];
  const nums: number[] = [];
  for (let i = 0; i < Math.min(rows.length, 500); i++) {
    const v = Number(rows[i][col]);
    if (!isNaN(v) && isFinite(v)) nums.push(v);
  }
  if (!nums.length) return [2, 4, 8, 5, 3];
  let min = nums[0];
  let max = nums[0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] < min) min = nums[i];
    if (nums[i] > max) max = nums[i];
  }
  if (min === max) return [6, 6, 6, 6, 6];
  const bins = [0, 0, 0, 0, 0];
  const step = (max - min) / 5;
  for (let i = 0; i < nums.length; i++) {
    const idx = Math.min(4, Math.floor((nums[i] - min) / step));
    bins[idx]++;
  }
  const maxBin = Math.max(...bins, 1);
  return bins.map((b) => Math.max(2, Math.round((b / maxBin) * 10)));
}

export function traceComponentKey(index: number): string {
  return `trace:${index}`;
}

export function pointComponentKey(traceIndex: number, pointIndex: number): string {
  return `point:${traceIndex}:${pointIndex}`;
}

export function applyComponentColorOverrides(data: any[], componentColors: Record<string, string>): any[] {
  if (!Object.keys(componentColors).length) return data;
  return data.map((trace, traceIndex) => {
    const next = { ...trace };
    const traceColor = componentColors[traceComponentKey(traceIndex)];
    const usesColorArray = next.type === "pie" || next.type === "treemap";
    if (traceColor) {
      next.marker = { ...(next.marker ?? {}), [usesColorArray ? "colors" : "color"]: traceColor };
      next.line = { ...(next.line ?? {}), color: traceColor };
    }
    const length = Math.max(
      Array.isArray(next.x) ? next.x.length : 0,
      Array.isArray(next.y) ? next.y.length : 0,
      Array.isArray(next.labels) ? next.labels.length : 0
    );
    if (length > 0) {
      const markerColorValue = usesColorArray ? next.marker?.colors : next.marker?.color;
      const colors = Array.isArray(markerColorValue)
        ? [...markerColorValue]
        : Array.from({ length }, () => markerColorValue ?? traceColor ?? "#4C6FE0");
      let changed = false;
      for (let pointIndex = 0; pointIndex < length; pointIndex++) {
        const pointColor = componentColors[pointComponentKey(traceIndex, pointIndex)];
        if (pointColor) {
          colors[pointIndex] = pointColor;
          changed = true;
        }
      }
      if (changed) next.marker = { ...(next.marker ?? {}), [usesColorArray ? "colors" : "color"]: colors };
    }
    return next;
  });
}

export function sheetInitial(title: string, fallback: string): string {
  const first = (title || fallback).trim().match(/[A-Za-z0-9Σ{}]/)?.[0] ?? fallback[0] ?? "?";
  return first.toUpperCase();
}

export function uniqueValues(ds: Dataset, col: string): string[] {
  const seen: string[] = [];
  ds.rows.forEach((row) => {
    const value = String(row[col] ?? "");
    if (value && !seen.includes(value)) seen.push(value);
  });
  return seen;
}

export function applyFilters(ds: Dataset, filters: DashboardFilter[]): Dataset {
  const active = filters.filter((filter) => filter.values.length > 0 && ds.columns.includes(filter.col));
  if (!active.length) return ds;
  return {
    ...ds,
    name: `${ds.name} (filtered)`,
    rows: ds.rows.filter((row) => active.every((filter) => filter.values.includes(String(row[filter.col] ?? "")))),
  };
}

export function numericExtent(ds: Dataset, col: string): { min: number; max: number } {
  const values = ds.rows.map((row) => Number(row[col])).filter((value) => Number.isFinite(value));
  if (!values.length) return { min: 0, max: 0 };
  return { min: Math.min(...values), max: Math.max(...values) };
}

export function makeGraphContextControl(
  ds: Dataset,
  graphId: string,
  graph: GraphState,
  kind: AssetControlKind
): AssetControl | null {
  const spec = graph.spec;
  const field =
    kind === "slider"
      ? spec.yVar && ds.types[spec.yVar] === "numeric"
        ? spec.yVar
        : ds.columns.find((col) => ds.types[col] === "numeric")
      : spec.groupVar && ds.types[spec.groupVar] === "categorical"
      ? spec.groupVar
      : spec.xVar && ds.types[spec.xVar] === "categorical"
      ? spec.xVar
      : ds.columns.find((col) => ds.types[col] === "categorical");
  if (!field) return null;
  const extent = numericExtent(ds, field);
  return {
    id: `control-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    field,
    label: kind === "slider" ? `${field} slider` : `${field} buttons`,
    sourceGraphId: graphId,
    selectedValues: [],
    min: extent.min,
    max: extent.max,
    value: extent.max,
  };
}

export function dataImportColumnProfile(preview: { dataset: Dataset }) {
  return preview.dataset.columns.map((column) => {
    const values = preview.dataset.rows.map((row) => row[column]);
    const missing = values.filter((value) => value == null || String(value).trim() === "").length;
    const sample = values.find((value) => value != null && String(value).trim() !== "");
    return {
      column,
      type: preview.dataset.types[column] || "categorical",
      missing,
      sample: sample == null ? "" : String(sample),
    };
  });
}
