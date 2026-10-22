import { Dataset, PlotSpec } from "../types";
import { PlotlyFigure } from "./types";
import {
  markColor,
  lineColor,
  numericCol,
  mean,
  sd,
  projection2d,
  normalQuantile,
  survivalCurve,
  binaryCurve,
  groupValues,
  textFont,
  markerStyle,
  withTextMode,
} from "./plotlyMathHelpers";
import { baseLayout, volcanoShapes } from "./layoutAxes";
import { circularChordFigure, dendrogramFigure, flowFigure } from "./specializedFigures";

export function buildSpecializedChartA(spec: PlotSpec, ds: Dataset): PlotlyFigure | null {
  if (spec.graphType === "volcano") {
    const pts = ds.rows
      .map((r) => ({
        x: Number(r[spec.xVar]),
        p: Number(r[spec.yVar]),
        label: spec.labelVar ? String(r[spec.labelVar] ?? "") : "",
      }))
      .filter((pt) => !isNaN(pt.x) && !isNaN(pt.p));
    const pCut = spec.volcanoPCut || 0.05;
    const fcCut = spec.volcanoFcCut || 1.0;
    const buckets: Record<"up" | "down" | "ns", { x: number; y: number; label: string }[]> = { up: [], down: [], ns: [] };
    pts.forEach((pt) => {
      const y = -Math.log10(Math.max(pt.p, Number.MIN_VALUE));
      const sig = pt.p <= pCut;
      const key = sig && pt.x >= fcCut ? "up" : sig && pt.x <= -fcCut ? "down" : "ns";
      buckets[key].push({ x: pt.x, y, label: pt.label });
    });
    const SIG = {
      up: { color: "#e11d48", name: `Up (FC≥${fcCut}, p≤${pCut})` },
      down: { color: "#2563eb", name: `Down (FC≤−${fcCut}, p≤${pCut})` },
      ns: { color: "#94a3b8", name: "Not significant" },
    } as const;
    const order: ("ns" | "down" | "up")[] = ["ns", "down", "up"];
    const traces = order
      .filter((k) => buckets[k].length)
      .map((k) => ({
        type: "scatter",
        mode: spec.volcanoLabelSig && k !== "ns" && spec.labelVar ? "markers+text" : "markers",
        x: buckets[k].map((d) => d.x),
        y: buckets[k].map((d) => d.y),
        text: spec.volcanoLabelSig && k !== "ns" && spec.labelVar ? buckets[k].map((d) => d.label) : undefined,
        textposition: "top center", textfont: textFont(spec),
        name: SIG[k].name,
        marker: markerStyle(spec, SIG[k].color, { size: k === "ns" ? Math.max(3, spec.pointSize - 1) : spec.pointSize + 1 }),
      }));
    const layout = baseLayout({ ...spec, xLabel: spec.xLabel || "Log2 Fold Change", yLabel: spec.yLabel || "−Log10 (p-value)" }, {});
    layout.showlegend = spec.legendPos !== "none";
    layout.shapes = volcanoShapes(spec);
    return { data: traces, layout };
  }

  // ---------- aggregate / single-trace families ----------
  if (spec.graphType === "chord") {
    return circularChordFigure(spec, ds);
  }

  if (spec.graphType === "sankey" || spec.graphType === "alluvial") {
    return flowFigure(spec, ds, false);
  }

  if (spec.graphType === "dendrogram") {
    return dendrogramFigure(spec, ds);
  }

  if (spec.graphType === "pca" || spec.graphType === "umap" || spec.graphType === "tsne") {
    const proj = projection2d(ds);
    const label = spec.graphType === "pca" ? ["PC1", "PC2"] : spec.graphType === "umap" ? ["UMAP 1", "UMAP 2"] : ["t-SNE 1", "t-SNE 2"];
    const groups = groupValues(ds, spec.groupVar);
    const traces = groups.map((g, gi) => {
      const idxs = spec.groupVar
        ? ds.rows.map((r, i) => (String(r[spec.groupVar] ?? "") === g ? i : -1)).filter((i) => i >= 0)
        : ds.rows.map((_, i) => i);
      return {
        type: "scatter",
        mode: withTextMode("markers", spec),
        x: idxs.map((i) => proj.x[i]),
        y: idxs.map((i) => proj.y[i]),
        text: spec.labelVar ? idxs.map((i) => String(ds.rows[i][spec.labelVar] ?? "")) : idxs.map((i) => proj.labels[i]),
        textposition: "top center",
        marker: markerStyle(spec, markColor(spec, gi)),
        name: spec.groupVar ? g : spec.graphType.toUpperCase(),
      };
    });
    return {
      data: traces,
      layout: baseLayout({ ...spec, xLabel: spec.xLabel || label[0], yLabel: spec.yLabel || label[1] }, {}),
    };
  }

  if (spec.graphType === "qq") {
    const raw = numericCol(ds.rows, spec.xVar).filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
    const n = raw.length;
    if (n === 0) return { data: [], layout: baseLayout(spec, {}) };
    const theoretical = raw.map((_, i) => normalQuantile((i + 0.5) / n));
    const q25Obs = raw[Math.floor(n * 0.25)];
    const q75Obs = raw[Math.floor(n * 0.75)];
    const q25Theo = normalQuantile(0.25);
    const q75Theo = normalQuantile(0.75);
    const slope = (q75Obs - q25Obs) / (q75Theo - q25Theo || 1);
    const intercept = q25Obs - slope * q25Theo;

    const minTheo = theoretical[0];
    const maxTheo = theoretical[theoretical.length - 1];
    const xGuide = [minTheo, maxTheo];
    const yGuide = [slope * minTheo + intercept, slope * maxTheo + intercept];

    return {
      data: [
        {
          type: "scatter",
          mode: "markers",
          x: theoretical,
          y: raw,
          marker: markerStyle(spec, markColor(spec, 0)),
          name: "Sample quantiles",
        },
        {
          type: "scatter",
          mode: "lines",
          x: xGuide,
          y: yGuide,
          line: { color: lineColor(spec, 0) || "#dc2626", dash: "dash", width: spec.lineWidth || 1.8 },
          name: "Normal reference",
        },
      ],
      layout: baseLayout({ ...spec, xLabel: spec.xLabel || "Theoretical Quantiles", yLabel: spec.yLabel || spec.xVar }, {}),
    };
  }

  if (spec.graphType === "blandAltman") {
    const pairs = ds.rows
      .map((r) => ({ a: Number(r[spec.xVar]), b: Number(r[spec.yVar]) }))
      .filter((p) => Number.isFinite(p.a) && Number.isFinite(p.b));
    const xs = pairs.map((p) => (p.a + p.b) / 2);
    const diffs = pairs.map((p) => p.b - p.a);
    const md = mean(diffs) || 0;
    const lim = 1.96 * (sd(diffs) || 0.1);
    const layout = baseLayout({ ...spec, xLabel: spec.xLabel || "Mean of measures ((A + B) / 2)", yLabel: spec.yLabel || "Difference (B − A)" }, {});
    layout.shapes = [
      {
        type: "rect",
        xref: "paper",
        x0: 0,
        x1: 1,
        y0: md - lim,
        y1: md + lim,
        fillcolor: "rgba(30, 64, 175, 0.07)",
        line: { width: 0 },
        layer: "below",
      },
      { type: "line", xref: "paper", x0: 0, x1: 1, y0: md, y1: md, line: { color: "#1e293b", dash: "dash", width: 1.8 } },
      { type: "line", xref: "paper", x0: 0, x1: 1, y0: md + lim, y1: md + lim, line: { color: "#e11d48", dash: "dot", width: 1.5 } },
      { type: "line", xref: "paper", x0: 0, x1: 1, y0: md - lim, y1: md - lim, line: { color: "#e11d48", dash: "dot", width: 1.5 } },
    ];
    layout.annotations = [
      { xref: "paper", x: 1, y: md, text: `Mean: ${md.toFixed(2)}`, showarrow: false, xanchor: "right", yanchor: "bottom", font: { size: 10, color: "#1e293b" } },
      { xref: "paper", x: 1, y: md + lim, text: `+1.96 SD: ${(md + lim).toFixed(2)}`, showarrow: false, xanchor: "right", yanchor: "bottom", font: { size: 10, color: "#e11d48" } },
      { xref: "paper", x: 1, y: md - lim, text: `-1.96 SD: ${(md - lim).toFixed(2)}`, showarrow: false, xanchor: "right", yanchor: "top", font: { size: 10, color: "#e11d48" } },
    ];
    return { data: [{ type: "scatter", mode: "markers", x: xs, y: diffs, marker: markerStyle(spec, markColor(spec, 0)), name: "Pair difference" }], layout };
  }

  if (spec.graphType === "roc" || spec.graphType === "pr") {
    const curve = binaryCurve(ds.rows, spec.xVar, spec.yVar, spec.graphType);
    return {
      data: [
        { type: "scatter", mode: "lines", x: curve.x, y: curve.y, line: { color: lineColor(spec, 0), width: spec.lineWidth }, name: spec.graphType === "roc" ? "ROC" : "Precision-recall" },
        ...(spec.graphType === "roc" ? [{ type: "scatter", mode: "lines", x: [0, 1], y: [0, 1], line: { color: "#aaa", dash: "dash" }, showlegend: false }] : []),
      ],
      layout: baseLayout({ ...spec, xLabel: spec.graphType === "roc" ? "False positive rate" : "Recall", yLabel: spec.graphType === "roc" ? "True positive rate" : "Precision" }, {}),
    };
  }

  if (spec.graphType === "kaplanMeier" || spec.graphType === "survivalCurve") {
    const survGroups = spec.groupVar ? groupValues(ds, spec.groupVar) : ["Survival"];
    const traces = survGroups.map((g, gi) => {
      const rows = spec.groupVar ? ds.rows.filter((r) => String(r[spec.groupVar] ?? "") === g) : ds.rows;
      const curve = survivalCurve(rows, spec.xVar, spec.yVar);
      return { type: "scatter", mode: "lines", x: curve.x, y: curve.y, line: { shape: "hv", color: lineColor(spec, gi), width: spec.lineWidth }, name: g };
    });
    return { data: traces, layout: baseLayout({ ...spec, xLabel: spec.xLabel || "Time", yLabel: spec.yLabel || "Survival probability" }, {}) };
  }


  return null;
}
