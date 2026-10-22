import { Dataset, PlotSpec } from "../types";
import { PlotlyFigure, AxisBreak } from "./types";
import {
  lineColor,
  markerStyle,
  lineStyle,
  groupValues,
} from "./plotlyMathHelpers";

export function transformAxisValue(value: any, scale: PlotSpec["xScale"] | undefined): any {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  if (scale === "log2") return n > 0 ? Math.log2(n) : null;
  if (scale === "ln") return n > 0 ? Math.log(n) : null;
  if (scale === "reciprocal") return n !== 0 ? 1 / n : null;
  return value;
}

export function axisBreaksFromSpec(spec: PlotSpec, axis: "x" | "y", scale: PlotSpec["xScale"] | undefined): AxisBreak[] {
  if (scale === "log10" || scale === "probability") return [];
  const pairs = axis === "x"
    ? [
        [spec.xAxisBreak1Start, spec.xAxisBreak1End],
        [spec.xAxisBreak2Start, spec.xAxisBreak2End],
      ]
    : [
        [spec.yAxisBreak1Start, spec.yAxisBreak1End],
        [spec.yAxisBreak2Start, spec.yAxisBreak2End],
      ];
  return pairs.flatMap(([rawStart, rawEnd]) => {
    if (!rawStart || !rawEnd) return [];
    const start = Number(transformAxisValue(rawStart, scale));
    const end = Number(transformAxisValue(rawEnd, scale));
    if (!Number.isFinite(start) || !Number.isFinite(end) || start === end) return [];
    return [[Math.min(start, end), Math.max(start, end)] as AxisBreak];
  }).sort((a, b) => a[0] - b[0]);
}

export function compressAxisNumber(value: number, breaks: AxisBreak[], ratio: number): number | null {
  let next = value;
  const keep = Math.max(0.01, Math.min(0.25, 0.04 + ratio * 0.08));
  for (const [start, end] of breaks) {
    if (value > start && value < end) return null;
    if (value >= end) next -= (end - start) * (1 - keep);
  }
  return next;
}

export function transformAxisArray(values: any, scale: PlotSpec["xScale"] | undefined, breaks: AxisBreak[] = [], ratio = 0.5): any {
  if (!Array.isArray(values)) return values;
  return values.map((v) => {
    const transformed = !scale || scale === "linear" || scale === "log10" || scale === "probability" ? v : transformAxisValue(v, scale);
    const n = Number(transformed);
    if (!breaks.length || !Number.isFinite(n)) return transformed;
    return compressAxisNumber(n, breaks, ratio);
  });
}

export function transformRange(min: string | undefined, max: string | undefined, reverse: boolean | undefined, scale: PlotSpec["xScale"] | undefined, breaks: AxisBreak[] = [], ratio = 0.5): any {
  const hasMin = min != null && min !== "";
  const hasMax = max != null && max !== "";
  if (!hasMin || !hasMax) return reverse ? "reversed" : undefined;
  let lo = Number(min);
  let hi = Number(max);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return reverse ? "reversed" : undefined;
  if (scale === "log10") {
    if (lo <= 0 || hi <= 0) return reverse ? "reversed" : undefined;
    lo = Math.log10(lo);
    hi = Math.log10(hi);
  } else if (scale === "log2" || scale === "ln" || scale === "reciprocal") {
    lo = Number(transformAxisValue(lo, scale));
    hi = Number(transformAxisValue(hi, scale));
  }
  if (breaks.length) {
    const compressedLo = compressAxisNumber(lo, breaks, ratio);
    const compressedHi = compressAxisNumber(hi, breaks, ratio);
    if (compressedLo == null || compressedHi == null) return reverse ? "reversed" : undefined;
    lo = compressedLo;
    hi = compressedHi;
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return reverse ? "reversed" : undefined;
  return reverse ? [hi, lo] : [lo, hi];
}

export function fixedTickFormat(format: PlotSpec["xNumberFormat"] | undefined): string | undefined {
  return format === "fixed" ? ".2f" : undefined;
}

export function scaleTitle(title: any, scale: PlotSpec["xScale"] | undefined): any {
  if (!title || typeof title !== "object") return title;
  const text = String(title.text ?? "");
  if (!text) return title;
  const prefix = scale === "log2" ? "log2" : scale === "ln" ? "ln" : scale === "reciprocal" ? "1/" : "";
  const bold = /^<b>.*<\/b>$/.test(text);
  const raw = bold ? text.replace(/^<b>(.*)<\/b>$/, "$1") : text;
  const nextText = prefix ? `${prefix}(${raw})` : raw;
  return { ...title, text: bold ? `<b>${nextText}</b>` : nextText };
}

export function axisTitleText(text: string, spec: PlotSpec): string {
  return spec.axisTitleWeight === "bold" ? `<b>${text}</b>` : text;
}

export function makeRightYAxisTraces(spec: PlotSpec, ds: Dataset): any[] {
  if (!spec.showRightYAxis || !spec.rightYVar || !spec.xVar) return [];
  const groups = groupValues(ds, spec.groupVar);
  const subset = (g: string) => spec.groupVar ? ds.rows.filter((r) => String(r[spec.groupVar] ?? "") === g) : ds.rows;
  return groups.map((g, i) => {
    const rows = subset(g);
    return {
      type: "scatter",
      mode: "lines+markers",
      x: rows.map((r) => r[spec.xVar]),
      y: rows.map((r) => r[spec.rightYVar]),
      name: `${g || spec.rightYVar} · right Y`,
      yaxis: "y2",
      marker: markerStyle(spec, lineColor(spec, i + groups.length), { size: Math.max(5, spec.pointSize - 1) }),
      line: lineStyle(spec, lineColor(spec, i + groups.length), { dash: "dash" }),
      opacity: spec.opacity,
    };
  });
}

export function applyAxisControls(fig: PlotlyFigure, spec: PlotSpec, ds: Dataset): PlotlyFigure {
  const layout = { ...fig.layout };
  const axisShapes: any[] = Array.isArray(layout.shapes) ? [...layout.shapes] : [];
  const yScale = spec.yScale === "linear" && spec.logY ? "log10" : spec.yScale;
  const breakRatio = spec.axisBreakSplitRatio ?? 0.5;
  const xBreaks = axisBreaksFromSpec(spec, "x", spec.xScale);
  const yBreaks = axisBreaksFromSpec(spec, "y", yScale);
  const customOriginX = spec.originMode === "custom" ? Number(spec.originX) : NaN;
  const customOriginY = spec.originMode === "custom" ? Number(spec.originY) : NaN;
  if (Number.isFinite(customOriginX)) {
    const x0 = compressAxisNumber(Number(transformAxisValue(customOriginX, spec.xScale)), xBreaks, breakRatio);
    if (x0 != null) axisShapes.push({ type: "line", x0, x1: x0, xref: "x", y0: 0, y1: 1, yref: "paper", line: { color: "#777", width: 1, dash: "dot" } });
  }
  if (Number.isFinite(customOriginY)) {
    const y0 = compressAxisNumber(Number(transformAxisValue(customOriginY, yScale)), yBreaks, breakRatio);
    if (y0 != null) axisShapes.push({ type: "line", x0: 0, x1: 1, xref: "paper", y0, y1: y0, yref: "y", line: { color: "#777", width: 1, dash: "dot" } });
  }
  const data = [...fig.data, ...makeRightYAxisTraces(spec, ds)].map((trace) => {
    const next = { ...trace };
    const xAxis = next.xaxis ?? "x";
    const yAxis = next.yaxis ?? "y";
    if (xAxis === "x") next.x = transformAxisArray(next.x, spec.xScale, xBreaks, breakRatio);
    if (yAxis === "y") next.y = transformAxisArray(next.y, yScale, yBreaks, breakRatio);
    if (yAxis === "y2") next.y = transformAxisArray(next.y, spec.rightYScale, [], breakRatio);
    return next;
  });

  if (layout.xaxis) {
    layout.xaxis = {
      ...layout.xaxis,
      title: scaleTitle(layout.xaxis.title, spec.xScale),
      type: spec.xScale === "log10" ? "log" : "linear",
      range: transformRange(spec.xMin, spec.xMax, spec.xReverse, spec.xScale, xBreaks, breakRatio),
      tickvals: transformAxisArray(layout.xaxis.tickvals, spec.xScale, xBreaks, breakRatio),
      tickformat: fixedTickFormat(spec.xNumberFormat),
      ticklabelstandoff: spec.axisLabelOffset ?? 0,
    };
  }
  if (layout.yaxis) {
    layout.yaxis = {
      ...layout.yaxis,
      title: scaleTitle(layout.yaxis.title, yScale),
      type: yScale === "log10" ? "log" : "linear",
      range: transformRange(spec.yMin, spec.yMax, spec.yReverse, yScale, yBreaks, breakRatio),
      tickvals: transformAxisArray(layout.yaxis.tickvals, yScale, yBreaks, breakRatio),
      tickformat: fixedTickFormat(spec.yNumberFormat),
      ticklabelstandoff: spec.axisLabelOffset ?? 0,
    };
  }
  if (layout.yaxis2) {
    layout.yaxis2 = {
      ...layout.yaxis2,
      title: scaleTitle(layout.yaxis2.title, spec.rightYScale),
      type: spec.rightYScale === "log10" ? "log" : "linear",
      range: transformRange(spec.rightYMin, spec.rightYMax, false, spec.rightYScale, [], breakRatio),
    };
    layout.showlegend = true;
    layout.margin = { ...(layout.margin ?? {}), r: Math.max(76, layout.margin?.r ?? 0) };
  }
  if (axisShapes.length) layout.shapes = axisShapes;
  return { data, layout };
}

// Dashed fold-change (vertical) and p-value (horizontal) threshold guides.
export function volcanoShapes(spec: PlotSpec): any[] {
  const pCut = -Math.log10(Math.max(spec.volcanoPCut, Number.MIN_VALUE));
  const fc = spec.volcanoFcCut;
  return [
    { type: "line", x0: -fc, x1: -fc, y0: 0, y1: 1, yref: "paper", line: { color: "#999", width: 1, dash: "dash" } },
    { type: "line", x0: fc, x1: fc, y0: 0, y1: 1, yref: "paper", line: { color: "#999", width: 1, dash: "dash" } },
    { type: "line", x0: 0, x1: 1, xref: "paper", y0: pCut, y1: pCut, line: { color: "#999", width: 1, dash: "dash" } },
  ];
}

export function baseLayout(spec: PlotSpec, opts: { noAxes?: boolean; yTitle?: string }): any {
  const isDark = spec.theme === "dark";
  const axisLine = isDark ? "#bbb" : "#222";
  const fg = isDark ? "#e8e8e8" : "#1a1a1a";
  const bg = spec.backgroundColor || (isDark ? "#1e1e22" : "#ffffff");
  const showGrid = spec.showGrid && spec.theme !== "prism" && spec.theme !== "classic";
  const axisScale = (scale: string | undefined, legacyLog = false) => (scale === "log10" || legacyLog ? "log" : scale === "probability" ? "linear" : "linear");
  const tickMode = (custom: string | undefined) => custom?.trim() ? "array" : "auto";
  const tickValues = (custom: string | undefined) => {
    const values = (custom ?? "").split(",").map((v) => Number(v.trim())).filter((v) => Number.isFinite(v));
    return values.length ? values : undefined;
  };
  const exponentFormat = (format: string | undefined) => format === "scientific" ? "e" : "none";
  const rangeWithReverse = (min: string, max: string, reverse: boolean | undefined, logAxis = false) => {
    const hasMin = min !== "";
    const hasMax = max !== "";
    const range = hasMin && hasMax && !logAxis ? [Number(min), Number(max)] : undefined;
    if (range && reverse) return [range[1], range[0]];
    if (range) return range;
    return reverse ? "reversed" : undefined;
  };
  const tickSide = (direction: string | undefined, visible: boolean) => {
    if (!visible) return "";
    if (direction === "inside") return "inside";
    return "outside";
  };
  const mirror = spec.frameStyle === "fullBox" ? true : spec.frameStyle === "openBox" ? "ticks" : false;
  const zeroLine = spec.originMode === "zero" || spec.originMode === "custom";
  const axisTitleFont = {
    size: spec.axisTitleFontSize ?? spec.baseFontSize,
    color: spec.axisTitleColor || fg,
    family: spec.fontFamily,
    weight: spec.axisTitleWeight === "bold" ? 700 : 400,
  };
  const tickFont = {
    size: spec.axisTickFontSize ?? Math.max(8, spec.baseFontSize - 2),
    color: spec.axisTickColor || fg,
    family: spec.fontFamily,
  };

  const layout: any = {
    title: spec.title ? { text: spec.title + (spec.subtitle ? `<br><sub>${spec.subtitle}</sub>` : ""), font: { size: spec.baseFontSize + 4 } } : "",
    font: { family: spec.fontFamily, size: spec.baseFontSize, color: fg },
    paper_bgcolor: bg, plot_bgcolor: bg,
    showlegend: spec.legendPos !== "none" && (!!spec.groupVar || spec.graphType === "bar" || spec.graphType === "pie" || spec.graphType === "donut"),
    legend: legendLayout(spec),
    autosize: true,
    margin: { l: 58, r: 12, t: spec.title ? 48 : 38, b: 52 },
    barmode: spec.stacked ? "stack" : "group",
    boxmode: "group", violinmode: "group",
  };
  if (opts.noAxes) return layout;

  const histTitle = spec.histNorm === "density" ? "density" : spec.histNorm === "percent" ? "percent" : "count";
  const horizontal = spec.orientation === "horizontal" && ["bar", "lollipop", "errorBar", "dotPlot", "box", "violin", "beeswarm", "strip"].includes(spec.graphType);
  const valueTitle = spec.yLabel || spec.yVar;
  const categoryTitle = spec.xLabel || spec.xVar;
  const yTitle = opts.yTitle ?? (spec.graphType === "histogram" ? histTitle : spec.graphType === "density" ? "density" : spec.graphType === "ecdf" ? "cumulative probability" : spec.graphType === "rug" ? "" : spec.graphType === "volcano" ? `-log10(${spec.yLabel || spec.yVar})` : spec.yLabel || spec.yVar);
  const showAxisLabels = spec.showAxisLabels !== false;
  layout.xaxis = {
    title: showAxisLabels ? { text: axisTitleText(horizontal ? valueTitle : categoryTitle, spec), font: axisTitleFont, standoff: Math.max(0, spec.axisTitleOffset ?? 0) } : { text: "" }, showgrid: showGrid, gridcolor: isDark ? "#3a3a40" : "#e6e6e6",
    zeroline: zeroLine, zerolinecolor: axisLine, linecolor: axisLine, linewidth: spec.theme === "minimal" ? 0 : 1.5,
    ticks: tickSide(spec.xTickDirection, spec.showXTicks), ticklen: spec.xTickDirection === "center" ? 10 : 5, showticklabels: spec.showXTicks, tickcolor: axisLine, tickangle: spec.xTickAngle,
    tickfont: tickFont,
    dtick: spec.xTickStep !== "" ? Number(spec.xTickStep) : undefined,
    minor: spec.xMinorTickStep ? { dtick: Number(spec.xMinorTickStep), ticks: tickSide(spec.xTickDirection, spec.showXTicks) } : undefined,
    tickmode: tickMode(spec.xCustomTicks),
    tickvals: tickValues(spec.xCustomTicks),
    exponentformat: exponentFormat(spec.xNumberFormat),
    tickformat: fixedTickFormat(spec.xNumberFormat),
    tickprefix: spec.xPrefix || undefined,
    ticksuffix: spec.xSuffix || undefined,
    ticklabelstandoff: spec.axisLabelOffset ?? 0,
    type: axisScale(spec.xScale),
    range: rangeWithReverse(spec.xMin, spec.xMax, spec.xReverse, spec.xScale === "log10"),
    mirror,
  };
  layout.yaxis = {
    title: showAxisLabels ? { text: axisTitleText(horizontal ? categoryTitle : yTitle, spec), font: axisTitleFont, standoff: Math.max(0, spec.axisTitleOffset ?? 0) } : { text: "" }, showgrid: showGrid, gridcolor: isDark ? "#3a3a40" : "#e6e6e6",
    zeroline: zeroLine, zerolinecolor: axisLine, linecolor: axisLine, linewidth: spec.theme === "minimal" ? 0 : 1.5,
    ticks: tickSide(spec.yTickDirection, spec.showYTicks), ticklen: spec.yTickDirection === "center" ? 10 : 5, showticklabels: spec.showYTicks, tickcolor: axisLine, tickangle: spec.yTickAngle,
    tickfont: tickFont,
    dtick: spec.yTickStep !== "" ? Number(spec.yTickStep) : undefined,
    minor: spec.yMinorTickStep ? { dtick: Number(spec.yMinorTickStep), ticks: tickSide(spec.yTickDirection, spec.showYTicks) } : undefined,
    tickmode: tickMode(spec.yCustomTicks),
    tickvals: tickValues(spec.yCustomTicks),
    exponentformat: exponentFormat(spec.yNumberFormat),
    tickformat: fixedTickFormat(spec.yNumberFormat),
    tickprefix: spec.yPrefix || undefined,
    ticksuffix: spec.ySuffix || undefined,
    ticklabelstandoff: spec.axisLabelOffset ?? 0,
    type: axisScale(spec.yScale, spec.logY),
    range: rangeWithReverse(spec.yMin, spec.yMax, spec.yReverse, spec.yScale === "log10" || spec.logY),
    mirror,
  };
  if (spec.showRightYAxis) {
    layout.yaxis2 = {
      title: showAxisLabels ? { text: axisTitleText(spec.rightYLabel || spec.rightYUnits || spec.rightYVar || "Right Y", spec), font: axisTitleFont } : { text: "" },
      overlaying: "y",
      side: "right",
      showgrid: false,
      linecolor: axisLine,
      tickfont: tickFont,
      type: axisScale(spec.rightYScale),
      range: rangeWithReverse(spec.rightYMin ?? "", spec.rightYMax ?? "", false, spec.rightYScale === "log10"),
    };
    layout.margin.r = 58;
  }
  return layout;
}

export function legendLayout(spec: PlotSpec): any {
  // A legend dragged on the plot wins over the named position.
  if (spec.legendX != null && spec.legendY != null) {
    return { x: spec.legendX, y: spec.legendY, xanchor: "left", yanchor: "top" };
  }
  switch (spec.legendPos) {
    case "top": return { orientation: "h", y: 1.1, x: 0.5, xanchor: "center" };
    case "bottom": return { orientation: "h", y: -0.2, x: 0.5, xanchor: "center" };
    case "left": return { x: -0.25, y: 1 };
    default: return { x: 0.98, y: 0.98, xanchor: "right", yanchor: "top", bgcolor: "rgba(255,255,255,0.72)" };
  }
}


