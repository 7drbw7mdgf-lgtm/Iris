import {
  AxisFrameStyle,
  AxisScale,
  ErrorDirection,
  ErrorMetric,
  FillPattern,
  GraphType,
  LineConnection,
  LinePattern,
  NumberFormat,
  PointSymbol,
  TickDirection,
} from "../../types";

export interface GraphComponentSelection {
  key: string;
  label: string;
  kind: "point" | "trace";
  traceName: string;
}

export type InspectorPanel = "style" | "axes" | "legend";
export type ComponentEditScope = "series" | "point" | "graph";

export interface ChartCapabilities {
  hasCartesianAxes: boolean;
  hasPoints: boolean;
  hasLines: boolean;
  hasBars: boolean;
  hasDistMarks: boolean;
  hasHistogram: boolean;
  hasMatrix: boolean;
  hasComposition: boolean;
  hasFlow: boolean;
  hasErrorBars: boolean;
  canStack: boolean;
  canOrient: boolean;
  hasStatOverlay: boolean;
  isVolcano: boolean;
}

export function getChartCapabilities(t: GraphType): ChartCapabilities {
  const nonCartesian: GraphType[] = ["pie", "donut", "treemap", "waffle", "sankey", "alluvial", "chord", "radar"];
  const pointTypes: GraphType[] = [
    "scatter",
    "bubble",
    "volcano",
    "blandAltman",
    "pca",
    "umap",
    "tsne",
    "qq",
    "strip",
    "dotPlot",
    "forest",
    "manhattan",
    "connected",
    "roc",
    "pr",
  ];
  const lineTypes: GraphType[] = [
    "line",
    "step",
    "timeSeries",
    "slope",
    "connected",
    "smooth",
    "kaplanMeier",
    "survivalCurve",
    "parallel",
    "roc",
    "pr",
  ];
  const barTypes: GraphType[] = ["bar", "lollipop", "errorBar", "circularBar", "upset"];
  const distTypes: GraphType[] = ["box", "violin", "beeswarm", "strip", "ridgeline"];
  const histTypes: GraphType[] = ["histogram", "density", "ecdf", "rug"];
  const matrixTypes: GraphType[] = ["heatmap", "density2d", "hexbin", "correlogram"];
  const compTypes: GraphType[] = ["pie", "donut", "treemap", "waffle"];
  const flowTypes: GraphType[] = ["sankey", "alluvial", "chord", "dendrogram"];

  return {
    hasCartesianAxes: !nonCartesian.includes(t),
    hasPoints: pointTypes.includes(t),
    hasLines: lineTypes.includes(t),
    hasBars: barTypes.includes(t),
    hasDistMarks: distTypes.includes(t),
    hasHistogram: histTypes.includes(t),
    hasMatrix: matrixTypes.includes(t),
    hasComposition: compTypes.includes(t),
    hasFlow: flowTypes.includes(t),
    hasErrorBars: ["bar", "errorBar", "forest", "line", "dotPlot"].includes(t),
    canStack: ["bar", "area", "stackedArea", "stream"].includes(t),
    canOrient: ["bar", "lollipop", "errorBar", "dotPlot", "box", "violin", "beeswarm", "strip"].includes(t),
    hasStatOverlay: ["scatter", "volcano", "smooth", "line", "bubble", "blandAltman"].includes(t),
    isVolcano: t === "volcano",
  };
}

export type GraphLibrary = "plotly" | "ggplot2" | "matplotlib" | "seaborn" | "altair";

export const LIBRARIES: { id: GraphLibrary; label: string; hint: string; supports: GraphType[] | "all" }[] = [
  { id: "plotly", label: "Plotly", hint: "Interactive live preview charts with responsive GPU rendering.", supports: "all" },
  { id: "ggplot2", label: "ggplot2", hint: "Publication-grade R graphics and native PDF/SVG compilation.", supports: "all" },
  {
    id: "matplotlib",
    label: "Python: matplotlib",
    hint: "Python code output using pandas and matplotlib.",
    supports: [
      "scatter", "bubble", "line", "timeSeries", "connected", "step", "area", "stackedArea",
      "bar", "lollipop", "histogram", "density", "box", "violin", "strip", "beeswarm",
      "heatmap", "pie", "donut", "volcano", "smooth",
    ],
  },
  {
    id: "seaborn",
    label: "Python: seaborn",
    hint: "Statistical Python code output using pandas, seaborn, and matplotlib.",
    supports: [
      "scatter", "bubble", "line", "timeSeries", "connected", "step", "area", "stackedArea",
      "bar", "lollipop", "histogram", "density", "box", "violin", "strip", "beeswarm",
      "heatmap", "pie", "donut", "volcano", "smooth",
    ],
  },
  {
    id: "altair",
    label: "Python: Altair",
    hint: "Declarative Vega-Lite Python code output.",
    supports: [
      "scatter", "bubble", "line", "timeSeries", "connected", "step", "area", "stackedArea",
      "bar", "lollipop", "histogram", "density", "box", "violin", "heatmap", "pie", "donut", "volcano", "smooth",
    ],
  },
];

export const POINT_SYMBOLS: { id: PointSymbol; label: string }[] = [
  { id: "circle", label: "Circle" },
  { id: "square", label: "Square" },
  { id: "diamond", label: "Diamond" },
  { id: "triangle-up", label: "Triangle" },
  { id: "cross", label: "Cross" },
  { id: "x", label: "X" },
];

export const AXIS_SCALES: { id: AxisScale; label: string }[] = [
  { id: "linear", label: "Linear" },
  { id: "log10", label: "Log 10" },
  { id: "log2", label: "Log 2" },
  { id: "ln", label: "Natural log" },
  { id: "probability", label: "Probability" },
  { id: "reciprocal", label: "Reciprocal" },
];

export const TICK_DIRECTIONS: { id: TickDirection; label: string }[] = [
  { id: "outside", label: "Outward" },
  { id: "inside", label: "Inward" },
  { id: "center", label: "Centered" },
];

export const NUMBER_FORMATS: { id: NumberFormat; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "scientific", label: "Scientific" },
  { id: "fixed", label: "Fixed" },
];

export const FRAME_STYLES: { id: AxisFrameStyle; label: string }[] = [
  { id: "plain", label: "Plain axes" },
  { id: "offset", label: "Offset axes" },
  { id: "fullBox", label: "Full box" },
  { id: "openBox", label: "Open box" },
  { id: "scaleBars", label: "Scale bars" },
];

export const LINE_CONNECTIONS: { id: LineConnection; label: string }[] = [
  { id: "straight", label: "Straight" },
  { id: "pointToPoint", label: "Point-to-point" },
  { id: "staircase", label: "Staircase" },
  { id: "spline", label: "Spline" },
];

export const LINE_PATTERNS: { id: LinePattern; label: string }[] = [
  { id: "solid", label: "Solid" },
  { id: "dash", label: "Dashed" },
  { id: "dot", label: "Dotted" },
  { id: "dashdot", label: "Dash-dot" },
];

export const ERROR_METRICS: { id: ErrorMetric; label: string }[] = [
  { id: "sem", label: "SEM (Standard Error)" },
  { id: "sd", label: "SD (Standard Deviation)" },
  { id: "ci95", label: "95% Confidence Interval" },
  { id: "range", label: "Min - Max Range" },
];

export const ERROR_DIRECTIONS: { id: ErrorDirection; label: string }[] = [
  { id: "both", label: "Both ways (±)" },
  { id: "up", label: "Upper only (+)" },
  { id: "down", label: "Lower only (-)" },
];

export const FILL_PATTERNS: { id: FillPattern; label: string }[] = [
  { id: "solid", label: "Solid fill" },
  { id: "gradient", label: "Gradient" },
  { id: "hatch", label: "Hatching" },
];


