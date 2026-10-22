import { Dataset, PlotSpec } from "../types";
import { PlotlyFigure } from "./types";
import {
  groupValues,
  markColor,
  lineColor,
  lineStyle,
  numericCol,
  mean,
  sizeDomain,
  uniqueStrings,
  linreg,
} from "./plotlyMathHelpers";
import { baseLayout } from "./layoutAxes";
import { addCartesianTrace } from "./cartesianTraces";

export function buildCartesianFigure(spec: PlotSpec, ds: Dataset): PlotlyFigure {
  const groups = groupValues(ds, spec.groupVar);
  const horizontal = spec.orientation === "horizontal";
  const subset = (g: string) =>
    spec.groupVar ? ds.rows.filter((r) => String(r[spec.groupVar] ?? "") === g) : ds.rows;

  const data: any[] = [];
  const sizeDom = spec.sizeVar ? sizeDomain(ds, spec.sizeVar) : null;

  groups.forEach((g, gi) => {
    const rows = subset(g);
    const color = markColor(spec, gi);
    const strokeColor = lineColor(spec, gi);
    const name = spec.groupVar ? g : spec.yVar;

    addCartesianTrace(spec, ds, data, groups, g, gi, rows, color, strokeColor, name, sizeDom, horizontal);
  });

  if ((spec.stat === "regression" || spec.stat === "average") && spec.graphType === "scatter") {
    groups.forEach((g, gi) => {
      const rows = subset(g);
      const xs = numericCol(rows, spec.xVar);
      const ys = numericCol(rows, spec.yVar);
      if (spec.stat === "average") {
        if (xs.length && ys.length) {
          data.push({
            type: "scatter", mode: "lines", x: [Math.min(...xs), Math.max(...xs)],
            y: [mean(ys), mean(ys)],
            name: `average ${spec.groupVar ? g : ""}`.trim(),
            line: lineStyle(spec, lineColor(spec, gi), { dash: "dot" }), showlegend: false,
          });
        }
        return;
      }
      const fit = linreg(xs, ys);
      if (fit) {
        const xMin = Math.min(...xs);
        const xMax = Math.max(...xs);
        data.push({
          type: "scatter", mode: "lines", x: [xMin, xMax],
          y: [fit.b0 + fit.b1 * xMin, fit.b0 + fit.b1 * xMax],
          name: `fit ${spec.groupVar ? g : ""}`.trim(),
          line: lineStyle(spec, lineColor(spec, gi), { dash: "dash" }), showlegend: false,
        });
      }
    });
  }

  const layout = baseLayout(spec, {});
  if (spec.graphType === "ridgeline") {
    layout.yaxis.tickmode = "array";
    layout.yaxis.tickvals = groups.map((_, i) => i);
    layout.yaxis.ticktext = groups;
    layout.yaxis.title = { text: spec.groupVar || "group" };
    layout.yaxis.range = [-0.2, groups.length - 1 + 1.2];
  }
  if (spec.graphType === "rug") {
    layout.yaxis.visible = false;
    layout.yaxis.showgrid = false;
    layout.yaxis.showticklabels = false;
    layout.yaxis.zeroline = false;
    layout.yaxis.range = [-0.3, Math.max(0.8, (groups.length - 1) * 0.25 + 0.3)];
  }
  if (spec.graphType === "forest") {
    layout.shapes = [
      ...(layout.shapes || []),
      {
        type: "line",
        x0: 0,
        x1: 0,
        y0: 0,
        y1: 1,
        yref: "paper",
        line: { color: "#94a3b8", width: 1.5, dash: "dash" },
      },
    ];
    if (!layout.xaxis.title?.text) {
      layout.xaxis.title = { text: spec.yVar ? `Effect Size (${spec.yVar})` : "Effect Size" };
    }
  }
  if (spec.graphType === "beeswarm") {
    const isCatX = ds.types[spec.xVar] === "categorical" || !spec.groupVar;
    const tickCats = isCatX ? uniqueStrings(ds, spec.xVar) : groups;
    const axisKey = horizontal ? "yaxis" : "xaxis";
    layout[axisKey] = {
      ...layout[axisKey],
      tickmode: "array",
      tickvals: tickCats.map((_, i) => i),
      ticktext: tickCats,
      range: [-0.5, tickCats.length - 0.5],
    };
  }
  return { data, layout };
}
