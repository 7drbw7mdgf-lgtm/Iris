export type ColType = "numeric" | "categorical";

export interface Dataset {
  name: string;
  columns: string[];
  types: Record<string, ColType>;
  rows: Record<string, string | number | null>[];
}

export type GraphType =
  | "scatter"
  | "volcano"
  | "line"
  | "bar"
  | "box"
  | "violin"
  | "histogram"
  | "area"
  | "density"
  | "ecdf"
  | "rug"
  | "ridgeline"
  | "beeswarm"
  | "bubble"
  | "heatmap"
  | "density2d"
  | "hexbin"
  | "smooth"
  | "correlogram"
  | "connected"
  | "lollipop"
  | "strip"
  | "radar"
  | "parallel"
  | "circularBar"
  | "table"
  | "pie"
  | "treemap"
  | "waffle"
  | "step"
  | "stackedArea"
  | "stream"
  | "timeSeries"
  | "donut"
  | "errorBar"
  | "dotPlot"
  | "slope"
  | "forest"
  | "blandAltman"
  | "kaplanMeier"
  | "survivalCurve"
  | "pca"
  | "umap"
  | "tsne"
  | "alluvial"
  | "sankey"
  | "chord"
  | "dendrogram"
  | "upset"
  | "manhattan"
  | "qq"
  | "roc"
  | "pr"
  | "facet";

export const GRAPH_CATEGORIES: { category: string; types: { id: GraphType; label: string; icon: string }[] }[] = [
  {
    category: "Distribution",
    types: [
      { id: "histogram", label: "Histogram", icon: "▥" },
      { id: "density", label: "Density", icon: "⌒" },
      { id: "ecdf", label: "ECDF", icon: "╭" },
      { id: "rug", label: "Rug", icon: "▔" },
      { id: "ridgeline", label: "Ridgeline", icon: "≋" },
      { id: "box", label: "Box", icon: "▣" },
      { id: "violin", label: "Violin", icon: "◈" },
      { id: "beeswarm", label: "Beeswarm", icon: "⋮" },
      { id: "qq", label: "QQ plot", icon: "↗" },
    ],
  },
  {
    category: "Correlation",
    types: [
      { id: "scatter", label: "Scatter", icon: "⠿" },
      { id: "volcano", label: "Volcano", icon: "▲" },
      { id: "connected", label: "Connected", icon: "⌁" },
      { id: "bubble", label: "Bubble", icon: "◯" },
      { id: "heatmap", label: "Heatmap", icon: "▦" },
      { id: "density2d", label: "2D density", icon: "◎" },
      { id: "correlogram", label: "Correlogram", icon: "▧" },
      { id: "hexbin", label: "Hexbin", icon: "⬢" },
      { id: "smooth", label: "Smooth", icon: "〰" },
      { id: "blandAltman", label: "Bland-Altman", icon: "±" },
      { id: "pca", label: "PCA", icon: "PC" },
      { id: "umap", label: "UMAP", icon: "U" },
      { id: "tsne", label: "t-SNE", icon: "tS" },
      { id: "roc", label: "ROC", icon: "ROC" },
      { id: "pr", label: "PR curve", icon: "PR" },
    ],
  },
  {
    category: "Ranking",
    types: [
      { id: "bar", label: "Bar", icon: "▮" },
      { id: "lollipop", label: "Lollipop", icon: "ⵙ" },
      { id: "strip", label: "Strip", icon: "⁝" },
      { id: "radar", label: "Radar", icon: "✦" },
      { id: "parallel", label: "Parallel", icon: "▥" },
      { id: "circularBar", label: "Circular bar", icon: "◷" },
      { id: "table", label: "Table", icon: "▤" },
      { id: "errorBar", label: "Error bars", icon: "Ⅰ" },
      { id: "dotPlot", label: "Dot plot", icon: "•" },
      { id: "forest", label: "Forest", icon: "╞" },
      { id: "manhattan", label: "Manhattan", icon: "▆" },
      { id: "upset", label: "UpSet", icon: "⊙" },
    ],
  },
  {
    category: "Part of a whole",
    types: [
      { id: "pie", label: "Pie", icon: "◐" },
      { id: "donut", label: "Doughnut", icon: "◌" },
      { id: "treemap", label: "Treemap", icon: "▣" },
      { id: "waffle", label: "Waffle", icon: "▦" },
      { id: "sankey", label: "Sankey", icon: "⇄" },
      { id: "alluvial", label: "Alluvial", icon: "≈" },
      { id: "chord", label: "Chord", icon: "○" },
    ],
  },
  {
    category: "Evolution",
    types: [
      { id: "line", label: "Line", icon: "╱" },
      { id: "step", label: "Step", icon: "┐" },
      { id: "area", label: "Area", icon: "◣" },
      { id: "stackedArea", label: "Stacked area", icon: "▰" },
      { id: "stream", label: "Stream", icon: "≋" },
      { id: "timeSeries", label: "Time series", icon: "⌁" },
      { id: "slope", label: "Slope", icon: "⟍" },
      { id: "kaplanMeier", label: "Kaplan-Meier", icon: "KM" },
      { id: "survivalCurve", label: "Survival", icon: "S" },
      { id: "dendrogram", label: "Dendrogram", icon: "┬" },
      { id: "facet", label: "Small multiples", icon: "▦" },
    ],
  },
];

export type ThemeName = "prism" | "classic" | "minimal" | "bw" | "dark";

export type PaletteName =
  | "prism"
  | "set1"
  | "viridis"
  | "pastel"
  | "grayscale";

export type PointSymbol =
  | "circle"
  | "square"
  | "diamond"
  | "triangle-up"
  | "cross"
  | "x";

export type StatTest = "none" | "ttest" | "anova" | "regression" | "correlation" | "average";
export type LegendPos = "right" | "left" | "top" | "bottom" | "none";
export type AxisScale = "linear" | "log10" | "log2" | "ln" | "probability" | "reciprocal";
export type TickDirection = "outside" | "inside" | "center";
export type NumberFormat = "auto" | "scientific" | "fixed";
export type AxisFrameStyle = "plain" | "offset" | "fullBox" | "openBox" | "scaleBars";
export type LineConnection = "straight" | "pointToPoint" | "staircase" | "spline";
export type LinePattern = "solid" | "dash" | "dot" | "dashdot";
export type ErrorMetric = "sd" | "sem" | "ci95" | "range";
export type ErrorDirection = "both" | "up" | "down";
export type FillPattern = "solid" | "gradient" | "hatch";
