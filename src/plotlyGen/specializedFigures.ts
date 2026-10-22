import { Dataset, PlotSpec } from "../types";
import { PlotlyFigure } from "./types";
import {
  markColor,
  lineColor,
  rowNumericMatrix,
  hexToRgba,
} from "./plotlyMathHelpers";
import { baseLayout } from "./layoutAxes";

export function circularChordFigure(spec: PlotSpec, ds: Dataset): PlotlyFigure {
  const sourceCol = spec.xVar;
  const targetCol = spec.groupVar || spec.labelVar || ds.columns.find((c) => c !== sourceCol && ds.types[c] === "categorical") || sourceCol;
  const valueCol = ds.types[spec.yVar] === "numeric" ? spec.yVar : "";
  const labels = Array.from(new Set(ds.rows.flatMap((r) => [String(r[sourceCol] ?? ""), String(r[targetCol] ?? "")]))).filter(Boolean).slice(0, 16);
  const n = labels.length;
  if (n === 0) return { data: [], layout: baseLayout(spec, { noAxes: true }) };

  const angles = new Map(labels.map((l, i) => [l, (2 * Math.PI * i) / n]));
  const radius = 1.0;

  const nodeX = labels.map((l) => radius * Math.cos(angles.get(l)!));
  const nodeY = labels.map((l) => radius * Math.sin(angles.get(l)!));

  const links = new Map<string, number>();
  ds.rows.forEach((r) => {
    const s = String(r[sourceCol] ?? "");
    const t = String(r[targetCol] ?? "");
    if (!s || !t || s === t || !angles.has(s) || !angles.has(t)) return;
    const key = `${s}\u0000${t}`;
    links.set(key, (links.get(key) ?? 0) + (valueCol ? Number(r[valueCol]) || 1 : 1));
  });

  const chordX: (number | null)[] = [];
  const chordY: (number | null)[] = [];
  Array.from(links.entries()).forEach(([key]) => {
    const [s, t] = key.split("\u0000");
    const a1 = angles.get(s)!;
    const a2 = angles.get(t)!;
    const x0 = radius * Math.cos(a1);
    const y0 = radius * Math.sin(a1);
    const x2 = radius * Math.cos(a2);
    const y2 = radius * Math.sin(a2);

    for (let step = 0; step <= 20; step++) {
      const tNorm = step / 20;
      const b0 = (1 - tNorm) * (1 - tNorm);
      const b1 = 2 * (1 - tNorm) * tNorm;
      const b2 = tNorm * tNorm;
      chordX.push(b0 * x0 + b1 * 0 + b2 * x2);
      chordY.push(b0 * y0 + b1 * 0 + b2 * y2);
    }
    chordX.push(null);
    chordY.push(null);
  });

  const traces: any[] = [
    {
      type: "scatter",
      mode: "lines",
      x: chordX,
      y: chordY,
      line: { color: hexToRgba(markColor(spec, 0), 0.45), width: Math.max(1.5, spec.lineWidth) },
      hoverinfo: "none",
      showlegend: false,
    },
    {
      type: "scatter",
      mode: "markers+text",
      x: nodeX,
      y: nodeY,
      text: labels,
      textposition: labels.map((l) => {
        const a = angles.get(l)!;
        return Math.cos(a) >= 0 ? (Math.sin(a) >= 0 ? "top right" : "bottom right") : (Math.sin(a) >= 0 ? "top left" : "bottom left");
      }),
      marker: {
        size: 14,
        color: labels.map((_, i) => markColor(spec, i)),
        line: { color: "#ffffff", width: 2 },
      },
      textfont: { size: spec.baseFontSize || 11, family: spec.fontFamily },
      showlegend: false,
    },
  ];

  const layout = {
    ...baseLayout(spec, { noAxes: true }),
    xaxis: { visible: false, range: [-1.45, 1.45] },
    yaxis: { visible: false, range: [-1.45, 1.45], scaleanchor: "x" },
  };

  return { data: traces, layout };
}

export function dendrogramFigure(spec: PlotSpec, ds: Dataset): PlotlyFigure {
  const { labels, matrix } = rowNumericMatrix(ds);
  const n = Math.min(labels.length, 25);
  if (n < 2) {
    return {
      data: [{ type: "scatter", mode: "text", x: [0], y: [0], text: ["Need at least 2 rows with numeric data"] }],
      layout: baseLayout(spec, { noAxes: true }),
    };
  }

  interface Cluster {
    id: number;
    members: number[];
    height: number;
    y: number;
  }

  let clusters: Cluster[] = Array.from({ length: n }, (_, i) => ({
    id: i,
    members: [i],
    height: 0,
    y: i,
  }));

  const dist = (c1: Cluster, c2: Cluster) => {
    let sum = 0, count = 0;
    for (const m1 of c1.members) {
      for (const m2 of c2.members) {
        let d = 0;
        for (let k = 0; k < matrix[0].length; k++) {
          const diff = matrix[m1][k] - matrix[m2][k];
          d += diff * diff;
        }
        sum += Math.sqrt(d);
        count++;
      }
    }
    return count > 0 ? sum / count : 0;
  };

  const linesX: (number | null)[] = [];
  const linesY: (number | null)[] = [];
  let nextId = n;

  while (clusters.length > 1) {
    let minDist = Infinity;
    let bestI = 0;
    let bestJ = 1;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const d = dist(clusters[i], clusters[j]);
        if (d < minDist) {
          minDist = d;
          bestI = i;
          bestJ = j;
        }
      }
    }

    const c1 = clusters[bestI];
    const c2 = clusters[bestJ];
    const mergeHeight = Math.max(minDist, Math.max(c1.height, c2.height) + 0.1);
    const mergeY = (c1.y + c2.y) / 2;

    linesX.push(c1.height, mergeHeight, mergeHeight, c2.height, null);
    linesY.push(c1.y, c1.y, c2.y, c2.y, null);

    const merged: Cluster = {
      id: nextId++,
      members: [...c1.members, ...c2.members],
      height: mergeHeight,
      y: mergeY,
    };

    clusters = clusters.filter((_, idx) => idx !== bestI && idx !== bestJ);
    clusters.push(merged);
  }

  const yLabels = Array.from({ length: n }, (_, i) => labels[i]);
  const treeColor = lineColor(spec, 0) || "#3b82f6";
  const traces = [
    {
      type: "scatter",
      mode: "lines",
      x: linesX,
      y: linesY,
      line: { color: treeColor, width: spec.lineWidth || 1.8 },
      hoverinfo: "none",
      showlegend: false,
    },
    {
      type: "scatter",
      mode: "markers",
      x: yLabels.map(() => 0),
      y: yLabels.map((_, i) => i),
      marker: { size: spec.pointSize + 2, color: markColor(spec, 0) },
      hovertext: yLabels,
      showlegend: false,
    },
  ];

  const layout = {
    ...baseLayout({ ...spec, xLabel: "Distance", yLabel: "" }, {}),
    yaxis: {
      tickmode: "array",
      tickvals: yLabels.map((_, i) => i),
      ticktext: yLabels,
      showgrid: false,
      zeroline: false,
    },
    xaxis: {
      ...baseLayout(spec, {}).xaxis,
      showgrid: true,
      title: { text: "Distance" },
    },
  };

  return { data: traces, layout };
}


export function flowFigure(spec: PlotSpec, ds: Dataset, chord = false): PlotlyFigure {
  const sourceCol = spec.xVar;
  const targetCol = spec.groupVar || spec.labelVar || ds.columns.find((c) => c !== sourceCol && ds.types[c] === "categorical") || sourceCol;
  const valueCol = ds.types[spec.yVar] === "numeric" ? spec.yVar : "";
  const labels = Array.from(new Set(ds.rows.flatMap((r) => [String(r[sourceCol] ?? ""), String(r[targetCol] ?? "")]))).filter(Boolean);
  const index = new Map(labels.map((label, i) => [label, i]));
  const links = new Map<string, number>();
  ds.rows.forEach((r) => {
    const s = String(r[sourceCol] ?? "");
    const t = String(r[targetCol] ?? "");
    if (!s || !t) return;
    const key = `${s}\u0000${t}`;
    links.set(key, (links.get(key) ?? 0) + (valueCol ? Number(r[valueCol]) || 0 : 1));
  });
  const pairs = Array.from(links.entries()).map(([key, value]) => {
    const [s, t] = key.split("\u0000");
    return { s, t, value };
  });
  return {
    data: [{
      type: "sankey",
      arrangement: chord ? "snap" : "perpendicular",
      node: { label: labels, color: labels.map((_, i) => markColor(spec, i)), pad: 14, thickness: chord ? 12 : 18 },
      link: {
        source: pairs.map((p) => index.get(p.s)),
        target: pairs.map((p) => index.get(p.t)),
        value: pairs.map((p) => p.value),
        color: pairs.map((_, i) => hexToRgba(markColor(spec, i), 0.35)),
      },
    }],
    layout: baseLayout(spec, { noAxes: true }),
  };
}


