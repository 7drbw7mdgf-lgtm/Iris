import { Dataset, PALETTES, PlotSpec } from "../types";

export function pystr(s: string): string {
  return JSON.stringify(s);
}

export function csvField(v: string | number | null): string {
  if (v === null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function embedData(ds: Dataset): string {
  if (ds.columns.length === 0) return "df = pd.DataFrame()";
  const header = ds.columns.map(csvField).join(",");
  const lines = ds.rows.map((r) => ds.columns.map((c) => csvField(r[c])).join(","));
  const csv = [header, ...lines].join("\n").replace(/"""/g, '\\"\\"\\"');
  return `df = pd.read_csv(StringIO("""${csv}"""))`;
}

export function colorArg(spec: PlotSpec): string {
  return spec.colorVar ? `, color=${pystr(spec.colorVar)}` : spec.groupVar ? `, color=${pystr(spec.groupVar)}` : "";
}

export function titleArg(spec: PlotSpec): string {
  return spec.title ? `, title=${pystr(spec.title)}` : "";
}

export function textArg(spec: PlotSpec): string {
  return spec.labelVar ? `, text=${pystr(spec.labelVar)}` : "";
}

export function textPositionLines(spec: PlotSpec): string[] {
  return spec.labelVar ? ['fig.update_traces(textposition="top center")'] : [];
}

export function isHorizontal(spec: PlotSpec): boolean {
  return spec.orientation === "horizontal" && ["bar", "lollipop", "errorBar", "dotPlot", "box", "violin", "beeswarm", "strip"].includes(spec.graphType);
}

export function plotlyLineShape(spec: PlotSpec): string {
  if (spec.graphType === "step" || spec.lineConnection === "staircase") return "hv";
  if (spec.lineConnection === "spline") return "spline";
  return "linear";
}

export function plotlyLineDash(spec: PlotSpec): string {
  return spec.linePattern === "dash" || spec.linePattern === "dot" || spec.linePattern === "dashdot" ? spec.linePattern : "solid";
}

export function axisScale(scale: PlotSpec["xScale"] | undefined, legacyLog = false): string {
  if (scale === "log10" || legacyLog) return "log";
  return "linear";
}

export function tickValuesExpr(custom: string): string {
  return `[${custom.split(",").map((v) => v.trim()).filter(Boolean).join(", ")}]`;
}

export function mplLineStyle(spec: PlotSpec): string {
  switch (spec.linePattern) {
    case "dash": return "--";
    case "dot": return ":";
    case "dashdot": return "-.";
    case "solid":
    default: return "-";
  }
}

export function layoutLines(spec: PlotSpec, yLabel?: string): string[] {
  const horizontal = isHorizontal(spec);
  const showAxisLabels = spec.showAxisLabels !== false;
  const xAxisTitle = showAxisLabels ? (horizontal ? (spec.yLabel || spec.yVar) : (spec.xLabel || spec.xVar)) : "";
  const yAxisTitle = showAxisLabels ? (horizontal ? (spec.xLabel || spec.xVar) : (yLabel ?? (spec.yLabel || spec.yVar))) : "";
  const lines = [
    "fig.update_layout(",
    "    template=\"plotly_white\",",
    `    xaxis_title=${pystr(xAxisTitle)},`,
    `    yaxis_title=${pystr(yAxisTitle)},`,
    `    font=dict(family=${pystr(spec.fontFamily)}, size=${spec.baseFontSize}),`,
    `    showlegend=${spec.legendPos === "none" ? "False" : "True"},`,
    ")",
  ];
  if (spec.subtitle) {
    lines.splice(1, 0, `    title=dict(text=${pystr((spec.title ? spec.title + "<br><sup>" : "<sup>") + spec.subtitle + "</sup>")}),`);
  }
  lines.push(`fig.update_xaxes(showticklabels=${spec.showXTicks ? "True" : "False"}, tickangle=${spec.xTickAngle}${spec.xTickStep !== "" ? `, dtick=${spec.xTickStep}` : ""})`);
  lines.push(`fig.update_yaxes(showticklabels=${spec.showYTicks ? "True" : "False"}, tickangle=${spec.yTickAngle}${spec.yTickStep !== "" ? `, dtick=${spec.yTickStep}` : ""})`);
  lines.push(`fig.update_xaxes(type=${pystr(axisScale(spec.xScale))}, ticks=${pystr(spec.xTickDirection === "inside" ? "inside" : "outside")})`);
  lines.push(`fig.update_yaxes(type=${pystr(axisScale(spec.yScale, spec.logY))}, ticks=${pystr(spec.yTickDirection === "inside" ? "inside" : "outside")})`);
  if (spec.xMin !== "" && spec.xMax !== "") lines.push(`fig.update_xaxes(range=[${spec.xReverse ? `${spec.xMax}, ${spec.xMin}` : `${spec.xMin}, ${spec.xMax}`}])`);
  else if (spec.xReverse) lines.push('fig.update_xaxes(autorange="reversed")');
  if (spec.yMin !== "" && spec.yMax !== "") lines.push(`fig.update_yaxes(range=[${spec.yReverse ? `${spec.yMax}, ${spec.yMin}` : `${spec.yMin}, ${spec.yMax}`}])`);
  else if (spec.yReverse) lines.push('fig.update_yaxes(autorange="reversed")');
  if (spec.xCustomTicks.trim()) lines.push(`fig.update_xaxes(tickmode="array", tickvals=${tickValuesExpr(spec.xCustomTicks)})`);
  if (spec.yCustomTicks.trim()) lines.push(`fig.update_yaxes(tickmode="array", tickvals=${tickValuesExpr(spec.yCustomTicks)})`);
  if (spec.xPrefix || spec.xSuffix || spec.xNumberFormat === "scientific") lines.push(`fig.update_xaxes(tickprefix=${pystr(spec.xPrefix)}, ticksuffix=${pystr(spec.xSuffix)}, exponentformat=${pystr(spec.xNumberFormat === "scientific" ? "e" : "none")})`);
  if (spec.yPrefix || spec.ySuffix || spec.yNumberFormat === "scientific") lines.push(`fig.update_yaxes(tickprefix=${pystr(spec.yPrefix)}, ticksuffix=${pystr(spec.ySuffix)}, exponentformat=${pystr(spec.yNumberFormat === "scientific" ? "e" : "none")})`);
  if (!spec.showGrid) lines.push("fig.update_xaxes(showgrid=False)\nfig.update_yaxes(showgrid=False)");
  if (spec.backgroundColor) lines.push(`fig.update_layout(paper_bgcolor=${pystr(spec.backgroundColor)}, plot_bgcolor=${pystr(spec.backgroundColor)})`);
  if (spec.showRightYAxis) lines.push(`fig.update_layout(yaxis2=dict(title=${pystr(spec.rightYLabel || spec.rightYUnits || spec.rightYVar || "Right Y")}, overlaying="y", side="right", showgrid=False))`);
  return lines;
}

export function paletteArg(spec: PlotSpec): string {
  const colors = PALETTES[spec.palette] ?? PALETTES.prism;
  if (spec.colorVar) return `, color_continuous_scale=${pystr(spec.contColorScale)}`;
  return `, color_discrete_sequence=${JSON.stringify(colors)}`;
}

export function mplMarker(spec: PlotSpec): string {
  switch (spec.pointSymbol) {
    case "square": return "s";
    case "diamond": return "D";
    case "triangle-up": return "^";
    case "cross": return "+";
    case "x": return "x";
    case "circle":
    default: return "o";
  }
}

export function aggregateCode(spec: PlotSpec, ds: Dataset, method = "mean"): string {
  if (ds.types[spec.yVar] === "numeric") {
    return `agg = df.groupby(${pystr(spec.xVar)}, as_index=False)[${pystr(spec.yVar)}].${method}()`;
  }
  return `agg = df.groupby(${pystr(spec.xVar)}, as_index=False).size().rename(columns={"size": "count"})`;
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

