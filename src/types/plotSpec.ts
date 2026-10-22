import type {
  Dataset,
  GraphType,
  ThemeName,
  PaletteName,
  PointSymbol,
  StatTest,
  LegendPos,
  AxisScale,
  TickDirection,
  NumberFormat,
  AxisFrameStyle,
  LineConnection,
  LinePattern,
  ErrorMetric,
  ErrorDirection,
  FillPattern,
} from "./graphTypes";

export interface PlotSpec {
  graphType: GraphType;
  xVar: string;
  yVar: string;
  groupVar: string;
  colorVar: string;
  sizeVar: string;
  labelVar: string;
  facetVar: string;
  stacked: boolean;
  orientation: "vertical" | "horizontal";

  title: string;
  subtitle: string;
  xLabel: string;
  yLabel: string;

  theme: ThemeName;
  palette: PaletteName;
  markColor: string;
  lineColor: string;
  backgroundColor: string;

  xMin: string;
  xMax: string;
  yMin: string;
  yMax: string;
  showGrid: boolean;
  logY: boolean;
  showAxisLabels: boolean;
  showXTicks: boolean;
  showYTicks: boolean;
  xTickAngle: number;
  yTickAngle: number;
  xTickStep: string;
  yTickStep: string;
  xScale: AxisScale;
  yScale: AxisScale;
  xReverse: boolean;
  yReverse: boolean;
  xMinorTickStep: string;
  yMinorTickStep: string;
  xTickDirection: TickDirection;
  yTickDirection: TickDirection;
  xCustomTicks: string;
  yCustomTicks: string;
  xNumberFormat: NumberFormat;
  yNumberFormat: NumberFormat;
  xPrefix: string;
  xSuffix: string;
  yPrefix: string;
  ySuffix: string;
  originMode: "auto" | "zero" | "custom";
  originX: string;
  originY: string;
  frameStyle: AxisFrameStyle;
  xAxisBreak1Start: string;
  xAxisBreak1End: string;
  xAxisBreak2Start: string;
  xAxisBreak2End: string;
  yAxisBreak1Start: string;
  yAxisBreak1End: string;
  yAxisBreak2Start: string;
  yAxisBreak2End: string;
  axisBreakSplitRatio: number;
  showRightYAxis: boolean;
  rightYVar: string;
  rightYLabel: string;
  rightYMin: string;
  rightYMax: string;
  rightYScale: AxisScale;
  rightYUnits: string;
  axisTitleOffset: number;
  axisLabelOffset: number;
  axisTitleFontSize: number;
  axisTickFontSize: number;
  axisTitleColor: string;
  axisTickColor: string;
  axisTitleWeight: "regular" | "bold";

  pointSymbol: PointSymbol;
  pointSize: number;
  pointStroke: number;
  lineWidth: number;
  labelSize: number;
  showPoints: boolean;
  barError: "none" | "sem" | "sd";
  histBins: number;
  opacity: number;
  lineConnection: LineConnection;
  linePattern: LinePattern;
  showDirectionalArrows: boolean;
  errorMetric: ErrorMetric;
  errorDirection: ErrorDirection;
  errorCapThickness: number;
  showErrorEnvelope: boolean;
  barWidth: number;
  barBorderWidth: number;
  fillPattern: FillPattern;
  showDropSpikes: boolean;

  fontFamily: string;
  baseFontSize: number;

  legendPos: LegendPos;
  legendX?: number;
  legendY?: number;

  stat: StatTest;

  pieExplode: number;
  donutHole: number;
  pieLabel: "label+percent" | "label+value" | "percent" | "none";

  volcanoColorBySig: boolean;
  volcanoFcCut: number;
  volcanoPCut: number;
  volcanoLabelSig: boolean;

  histNorm: "count" | "density" | "percent";
  contColorScale: "Viridis" | "Cividis" | "Plasma" | "YlGnBu" | "RdBu";
}

export const CONT_SCALES: { id: PlotSpec["contColorScale"]; label: string }[] = [
  { id: "Viridis", label: "Viridis" },
  { id: "Cividis", label: "Cividis" },
  { id: "Plasma", label: "Plasma" },
  { id: "YlGnBu", label: "Yellow-Green-Blue" },
  { id: "RdBu", label: "Red-Blue (diverging)" },
];

export const PALETTES: Record<PaletteName, string[]> = {
  prism: ["#1F77B4", "#E4572E", "#17BEBB", "#FFC914", "#76B041", "#A24BCF", "#FF7AA2"],
  set1: ["#E41A1C", "#377EB8", "#4DAF4A", "#984EA3", "#FF7F00", "#FFFF33", "#A65628"],
  viridis: ["#440154", "#3B528B", "#21908C", "#5DC863", "#FDE725", "#31688E", "#35B779"],
  pastel: ["#A1C9F4", "#FFB482", "#8DE5A1", "#FF9F9B", "#D0BBFF", "#FFFEA3", "#B9F2F0"],
  grayscale: ["#222222", "#555555", "#888888", "#AAAAAA", "#CCCCCC", "#444444", "#999999"],
};

export function defaultSpec(ds: Dataset): PlotSpec {
  const numeric = ds.columns.filter((c) => ds.types[c] === "numeric");
  const categorical = ds.columns.filter((c) => ds.types[c] === "categorical");
  return {
    graphType: "scatter",
    xVar: numeric[0] ?? ds.columns[0] ?? "",
    yVar: numeric[1] ?? numeric[0] ?? ds.columns[0] ?? "",
    groupVar: categorical[0] ?? "",
    colorVar: "",
    sizeVar: numeric[2] ?? "",
    labelVar: "",
    facetVar: "",
    stacked: false,
    orientation: "vertical",
    title: "",
    subtitle: "",
    xLabel: "",
    yLabel: "",
    theme: "prism",
    palette: "prism",
    markColor: "",
    lineColor: "",
    backgroundColor: "",
    xMin: "",
    xMax: "",
    yMin: "",
    yMax: "",
    showGrid: false,
    logY: false,
    showAxisLabels: true,
    showXTicks: true,
    showYTicks: true,
    xTickAngle: 0,
    yTickAngle: 0,
    xTickStep: "",
    yTickStep: "",
    xScale: "linear",
    yScale: "linear",
    xReverse: false,
    yReverse: false,
    xMinorTickStep: "",
    yMinorTickStep: "",
    xTickDirection: "outside",
    yTickDirection: "outside",
    xCustomTicks: "",
    yCustomTicks: "",
    xNumberFormat: "auto",
    yNumberFormat: "auto",
    xPrefix: "",
    xSuffix: "",
    yPrefix: "",
    ySuffix: "",
    originMode: "auto",
    originX: "",
    originY: "",
    frameStyle: "plain",
    xAxisBreak1Start: "",
    xAxisBreak1End: "",
    xAxisBreak2Start: "",
    xAxisBreak2End: "",
    yAxisBreak1Start: "",
    yAxisBreak1End: "",
    yAxisBreak2Start: "",
    yAxisBreak2End: "",
    axisBreakSplitRatio: 0.5,
    showRightYAxis: false,
    rightYVar: "",
    rightYLabel: "",
    rightYMin: "",
    rightYMax: "",
    rightYScale: "linear",
    rightYUnits: "",
    axisTitleOffset: 0,
    axisLabelOffset: 0,
    axisTitleFontSize: 14,
    axisTickFontSize: 12,
    axisTitleColor: "",
    axisTickColor: "",
    axisTitleWeight: "regular",
    pointSymbol: "circle",
    pointSize: 7,
    pointStroke: 0.5,
    lineWidth: 2,
    labelSize: 11,
    showPoints: true,
    barError: "sem",
    histBins: 30,
    opacity: 0.9,
    lineConnection: "straight",
    linePattern: "solid",
    showDirectionalArrows: false,
    errorMetric: "sem",
    errorDirection: "both",
    errorCapThickness: 1.4,
    showErrorEnvelope: false,
    barWidth: 0.8,
    barBorderWidth: 0,
    fillPattern: "solid",
    showDropSpikes: false,
    fontFamily: "Helvetica",
    baseFontSize: 14,
    legendPos: "right",
    stat: "none",
    pieExplode: 0,
    donutHole: 0.5,
    pieLabel: "label+percent",
    volcanoColorBySig: true,
    volcanoFcCut: 1,
    volcanoPCut: 0.05,
    volcanoLabelSig: false,
    histNorm: "count",
    contColorScale: "Viridis",
  };
}
