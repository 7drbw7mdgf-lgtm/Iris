import { Dataset, PlotSpec } from "../types";
import {
  pystr,
  textPositionLines,
  layoutLines,
  plotlyLineShape,
  plotlyLineDash,
} from "./pgenHelpers";

export function handlePlotlyPart1(
  spec: PlotSpec,
  _ds: Dataset,
  lines: string[],
  ctx: { x: string; y: string; color: string; title: string; text: string; palette: string; grp: string; horizontal: boolean }
): boolean {
  const { x, y, color, title, text, palette, grp, horizontal } = ctx;
  switch (spec.graphType) {
    case "volcano":
      lines.push(`df["_neg_log10_p"] = -np.log10(np.maximum(pd.to_numeric(df[${y}], errors="coerce"), np.finfo(float).tiny))`);
      lines.push(`fig = px.scatter(df, x=${x}, y="_neg_log10_p"${color}${text}${palette}${title})`);
      lines.push('fig.add_vline(x=-1, line_dash="dash", line_color="gray")');
      lines.push('fig.add_vline(x=1, line_dash="dash", line_color="gray")');
      lines.push('fig.add_hline(y=-np.log10(0.05), line_dash="dash", line_color="gray")');
      lines.push(...textPositionLines(spec));
      lines.push(...layoutLines(spec, `-log10(${spec.yLabel || spec.yVar})`));
      break;

    case "bubble":
      lines.push(`fig = px.scatter(df, x=${x}, y=${y}${color}${spec.sizeVar ? `, size=${pystr(spec.sizeVar)}` : ""}${text}${palette}${title})`);
      lines.push(...textPositionLines(spec));
      lines.push(...layoutLines(spec));
      break;

    case "line":
    case "timeSeries":
    case "connected":
      lines.push(`fig = px.line(df, x=${x}, y=${y}${color}${text}${palette}${title})`);
      lines.push(`fig.update_traces(line_shape=${pystr(plotlyLineShape(spec))}, line_dash=${pystr(plotlyLineDash(spec))}, line_width=${spec.lineWidth})`);
      if (spec.showPoints || spec.graphType === "connected") lines.push(`fig.add_scatter(x=df[${x}], y=df[${y}], mode="markers", showlegend=False)`);
      if (spec.showDirectionalArrows) lines.push(`fig.add_scatter(x=[df[${x}].iloc[-1]], y=[df[${y}].iloc[-1]], mode="markers", marker_symbol="triangle-right", marker_size=${spec.pointSize + 4}, showlegend=False)`);
      lines.push(...textPositionLines(spec));
      lines.push(...layoutLines(spec));
      break;

    case "step":
      lines.push(`fig = px.line(df, x=${x}, y=${y}${color}${text}${palette}${title})`);
      lines.push(`fig.update_traces(line_shape=${pystr(plotlyLineShape(spec))}, line_dash=${pystr(plotlyLineDash(spec))}, line_width=${spec.lineWidth})`);
      if (spec.showPoints) lines.push(`fig.add_scatter(x=df[${x}], y=df[${y}], mode="markers", showlegend=False)`);
      if (spec.showDirectionalArrows) lines.push(`fig.add_scatter(x=[df[${x}].iloc[-1]], y=[df[${y}].iloc[-1]], mode="markers", marker_symbol="triangle-right", marker_size=${spec.pointSize + 4}, showlegend=False)`);
      lines.push(...layoutLines(spec));
      break;

    case "area":
    case "stackedArea":
    case "stream":
      lines.push(`fig = px.area(df, x=${x}, y=${y}${color}${palette}${title})`);
      if (spec.graphType === "area" && !spec.stacked) lines.push('fig.update_layout(barmode="overlay")');
      lines.push(...layoutLines(spec));
      break;

    case "histogram":
      lines.push(`fig = px.histogram(df, x=${x}${color}, nbins=${spec.histBins}${palette}${title})`);
      lines.push(...layoutLines(spec, "count"));
      break;

    case "density":
      lines.push(`# Plotly does not have ggplot2's geom_density directly; this uses a density-normalized histogram.`);
      lines.push(`fig = px.histogram(df, x=${x}${color}, nbins=${spec.histBins}, histnorm="probability density"${palette}${title})`);
      lines.push(...layoutLines(spec, "density"));
      break;

    case "ecdf":
      lines.push(`fig = px.ecdf(df, x=${x}${color}${palette}${title})`);
      lines.push(...layoutLines(spec, "cumulative probability"));
      break;

    case "rug":
      lines.push(`fig = px.scatter(df, x=${x}, y=[0] * len(df)${color}${palette}${title})`);
      lines.push('fig.update_traces(marker_symbol="line-ns", marker_size=14)');
      lines.push(...layoutLines(spec, ""));
      break;

    case "box":
      lines.push(`fig = px.box(df, ${horizontal ? `x=${y}, y=${pystr(grp || spec.xVar)}, orientation="h"` : `x=${pystr(grp || spec.xVar)}, y=${y}`}${grp ? `, color=${pystr(grp)}` : ""}${palette}${title}, points=${spec.showPoints ? '"all"' : 'False'})`);
      lines.push(...layoutLines(spec));
      break;

    case "violin":
      lines.push(`fig = px.violin(df, ${horizontal ? `x=${y}, y=${pystr(grp || spec.xVar)}, orientation="h"` : `x=${pystr(grp || spec.xVar)}, y=${y}`}${grp ? `, color=${pystr(grp)}` : ""}${palette}${title}, box=True, points=${spec.showPoints ? '"all"' : 'False'})`);
      lines.push(...layoutLines(spec));
      break;

    case "beeswarm":
    case "strip":
      lines.push(`fig = px.strip(df, ${horizontal ? `x=${y}, y=${pystr(grp || spec.xVar)}, orientation="h"` : `x=${pystr(grp || spec.xVar)}, y=${y}`}${grp ? `, color=${pystr(grp)}` : ""}${palette}${title})`);
      lines.push(...layoutLines(spec));
      break;

    default:
      return false;
  }
  return true;
}
