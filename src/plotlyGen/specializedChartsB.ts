import { Dataset, PlotSpec } from "../types";
import { PlotlyFigure } from "./types";
import {
  markColor,
  lineColor,
  numericCol,
  uniqueStrings,
  groupValues,
  aggregateByCategory,
  corr,
  mean,
  markerStyle,
} from "./plotlyMathHelpers";
import { baseLayout } from "./layoutAxes";

export function buildSpecializedChartB(spec: PlotSpec, ds: Dataset): PlotlyFigure | null {
  if (spec.graphType === "manhattan") {
    const pCol = spec.yVar;
    const posCol = spec.xVar;
    const chrCol = spec.groupVar || ds.columns.find((c) => ds.types[c] === "categorical" && c !== posCol) || "";
    const chrs = chrCol ? uniqueStrings(ds, chrCol) : ["1", "2", "3", "4", "5"];
    const rows = ds.rows
      .map((r, i) => {
        const p = Math.max(Number(r[pCol]), Number.MIN_VALUE);
        const y = -Math.log10(p);
        const x = Number(r[posCol]);
        const chr = chrCol ? String(r[chrCol] ?? "1") : String((i % 5) + 1);
        return {
          i,
          x: Number.isFinite(x) ? x : i + 1,
          y: Number.isFinite(y) ? y : 0,
          chr,
          label: spec.labelVar ? String(r[spec.labelVar] ?? "") : "",
        };
      })
      .filter((r) => Number.isFinite(r.y));

    let cumX = 0;
    const chrCenters: { chr: string; center: number }[] = [];
    const plottedPoints: any[] = [];
    chrs.forEach((chr, ci) => {
      const chrPts = rows.filter((r) => r.chr === chr);
      if (!chrPts.length) return;
      const minX = Math.min(...chrPts.map((p) => p.x));
      const maxX = Math.max(...chrPts.map((p) => p.x));
      const span = Math.max(1, maxX - minX);
      const start = cumX;
      chrPts.forEach((p) => {
        const adjustedX = start + (p.x - minX);
        plottedPoints.push({ ...p, adjX: adjustedX, colorIdx: ci % 2 });
      });
      chrCenters.push({ chr, center: start + span / 2 });
      cumX += span + 5;
    });

    const chrPalette = [markColor(spec, 0), markColor(spec, 1) || "#0284c7"];
    const traces: any[] = [];
    [0, 1].forEach((colorIdx) => {
      const sub = plottedPoints.filter((p) => p.colorIdx === colorIdx && p.y < 7.3);
      if (sub.length) {
        traces.push({
          type: "scatter",
          mode: "markers",
          x: sub.map((p) => p.adjX),
          y: sub.map((p) => p.y),
          marker: { size: spec.pointSize, color: chrPalette[colorIdx], opacity: spec.opacity },
          showlegend: false,
          hovertext: sub.map((p) => `${p.chr}:${p.x} (-log10p=${p.y.toFixed(2)}) ${p.label}`),
        });
      }
    });

    const sigHits = plottedPoints.filter((p) => p.y >= 7.3);
    if (sigHits.length) {
      traces.push({
        type: "scatter",
        mode: "markers",
        x: sigHits.map((p) => p.adjX),
        y: sigHits.map((p) => p.y),
        marker: { size: spec.pointSize + 2, color: "#dc2626", symbol: "circle" },
        name: "Significant (p < 5e-8)",
        hovertext: sigHits.map((p) => `${p.chr}:${p.x} (-log10p=${p.y.toFixed(2)}) ${p.label}`),
      });
    }

    const layout = baseLayout({ ...spec, xLabel: spec.xLabel || "Chromosome", yLabel: spec.yLabel || "-log10(p-value)" }, {});
    if (chrCenters.length > 1) {
      layout.xaxis = {
        ...layout.xaxis,
        tickmode: "array",
        tickvals: chrCenters.map((c) => c.center),
        ticktext: chrCenters.map((c) => c.chr),
      };
    }
    layout.shapes = [
      { type: "line", xref: "paper", x0: 0, x1: 1, y0: 7.3, y1: 7.3, line: { color: "#dc2626", dash: "dash", width: 1.5 } },
      { type: "line", xref: "paper", x0: 0, x1: 1, y0: 5.0, y1: 5.0, line: { color: "#2563eb", dash: "dot", width: 1.2 } },
    ];
    layout.annotations = [
      { xref: "paper", x: 1, y: 7.3, text: "5e-8", showarrow: false, xanchor: "right", yanchor: "bottom", font: { size: 10, color: "#dc2626" } },
      { xref: "paper", x: 1, y: 5.0, text: "1e-5", showarrow: false, xanchor: "right", yanchor: "bottom", font: { size: 10, color: "#2563eb" } },
    ];
    return { data: traces.length ? traces : [{ type: "scatter", mode: "markers", x: [1], y: [1] }], layout };
  }

  if (spec.graphType === "upset") {
    const setCols = ds.columns.filter((c) => ds.types[c] === "categorical").slice(0, 5);
    const combos = new Map<string, number>();
    ds.rows.forEach((r) => {
      const activeSets = setCols.filter((c) => String(r[c] ?? "").toLowerCase() === "true" || String(r[c] ?? "").toLowerCase() === "1" || String(r[c] ?? "") !== "");
      const key = activeSets.length ? activeSets.join(" ∩ ") : "None";
      combos.set(key, (combos.get(key) ?? 0) + 1);
    });
    const entries = Array.from(combos.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12);
    return {
      data: [{
        type: "bar",
        x: entries.map((e) => e[0]),
        y: entries.map((e) => e[1]),
        text: entries.map((e) => String(e[1])),
        textposition: "outside",
        marker: { color: entries.map((_, i) => markColor(spec, i)) },
        name: "Intersection Size",
      }],
      layout: baseLayout({ ...spec, xLabel: "Intersections", yLabel: "Intersection Size" }, {}),
    };
  }

  if (spec.graphType === "facet" || (spec.facetVar && spec.facetVar.trim() !== "")) {
    const facetCol = spec.facetVar || spec.groupVar || ds.columns.find((c) => ds.types[c] === "categorical") || "";
    const facets = facetCol ? uniqueStrings(ds, facetCol).slice(0, 12) : ["All"];
    const cols = Math.min(facets.length > 9 ? 4 : 3, facets.length || 1);
    const rowsN = Math.ceil(facets.length / cols);
    const traces = facets.map((f, i) => {
      const fRows = facetCol ? ds.rows.filter((r) => String(r[facetCol] ?? "") === f) : ds.rows;
      const axisId = i === 0 ? "" : i + 1;
      const isLine = spec.graphType === "line" || spec.graphType === "step";
      return {
        type: "scatter",
        mode: isLine ? "lines+markers" : "markers",
        x: fRows.map((r) => r[spec.xVar]),
        y: fRows.map((r) => r[spec.yVar]),
        marker: markerStyle(spec, markColor(spec, i)),
        name: f,
        xaxis: `x${axisId}`,
        yaxis: `y${axisId}`,
      };
    });
    const layout = baseLayout(spec, {});
    facets.forEach((_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const xKey = `xaxis${i === 0 ? "" : i + 1}`;
      const yKey = `yaxis${i === 0 ? "" : i + 1}`;
      layout[xKey] = { ...layout.xaxis, domain: [col / cols + 0.03, (col + 1) / cols - 0.03], anchor: `y${i === 0 ? "" : i + 1}` };
      layout[yKey] = { ...layout.yaxis, domain: [1 - (row + 1) / rowsN + 0.05, 1 - row / rowsN - 0.05], anchor: `x${i === 0 ? "" : i + 1}` };
    });
    layout.grid = { rows: rowsN, columns: cols, pattern: "independent" };
    // Per-panel strip labels (small-multiples titles).
    layout.annotations = facets.map((f, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        text: String(f),
        showarrow: false,
        x: (col + 0.5) / cols,
        xref: "paper",
        y: 1 - row / rowsN - 0.008,
        yref: "paper",
        xanchor: "center",
        yanchor: "bottom",
        font: { size: spec.baseFontSize, family: spec.fontFamily, color: spec.theme === "dark" ? "#f2f2f2" : "#333" },
      };
    });
    return { data: traces, layout };
  }

  if (spec.graphType === "pie" || spec.graphType === "donut") {
    const cats = uniqueStrings(ds, spec.xVar);
    const totals: Record<string, number> = {};
    cats.forEach((c) => (totals[c] = 0));
    ds.rows.forEach((r) => {
      const c = String(r[spec.xVar] ?? "");
      const v = Number(r[spec.yVar]);
      totals[c] += isNaN(v) ? 1 : v; // sum the value, or count if non-numeric
    });
    return {
      data: [
        {
          type: "pie",
          labels: cats,
          values: cats.map((c) => totals[c]),
          hole: spec.graphType === "donut" ? spec.donutHole : 0,
          pull: spec.pieExplode > 0 ? spec.pieExplode : 0,
          marker: { colors: cats.map((_, i) => markColor(spec, i)), line: { color: "#fff", width: 1 } },
          textinfo: spec.pieLabel,
          opacity: spec.opacity,
        },
      ],
      layout: baseLayout(spec, { noAxes: true }),
    };
  }

  if (spec.graphType === "heatmap") {
    const yCol = spec.groupVar || spec.yVar;
    const xs = uniqueStrings(ds, spec.xVar);
    const ys = uniqueStrings(ds, yCol);
    const z = ys.map((yv) =>
      xs.map((xv) => {
        const vals = numericCol(
          ds.rows.filter((r) => String(r[spec.xVar] ?? "") === xv && String(r[yCol] ?? "") === yv),
          spec.yVar
        );
        return vals.length ? mean(vals) : null;
      })
    );
    return {
      data: [{ type: "heatmap", x: xs, y: ys, z, colorscale: spec.contColorScale, hoverongaps: false, colorbar: { title: spec.yVar } }],
      layout: baseLayout(spec, { yTitle: yCol }),
    };
  }

  if (spec.graphType === "density2d") {
    return {
      data: [
        {
          type: "histogram2dcontour",
          x: ds.rows.map((r) => r[spec.xVar]),
          y: ds.rows.map((r) => r[spec.yVar]),
          colorscale: spec.contColorScale,
          ncontours: 14,
          showscale: true,
        },
      ],
      layout: baseLayout(spec, {}),
    };
  }

  if (spec.graphType === "hexbin") {
    return {
      data: [
        {
          type: "histogram2d",
          x: ds.rows.map((r) => r[spec.xVar]),
          y: ds.rows.map((r) => r[spec.yVar]),
          colorscale: spec.contColorScale,
          nbinsx: spec.histBins,
          nbinsy: Math.max(5, Math.round(spec.histBins * 0.7)),
          showscale: true,
          colorbar: { title: "count" },
        },
      ],
      layout: baseLayout(spec, {}),
    };
  }

  if (spec.graphType === "table") {
    return {
      data: [{ type: "table", header: { values: ds.columns, fill: { color: "#eef3ff" }, align: "left" }, cells: { values: ds.columns.map((c) => ds.rows.slice(0, 25).map((r) => String(r[c] ?? ""))), align: "left" } }],
      layout: baseLayout(spec, { noAxes: true }),
    };
  }

  if (spec.graphType === "correlogram") {
    const cols = ds.columns.filter((c) => ds.types[c] === "numeric").slice(0, 15);
    const z = cols.map((a) => cols.map((b) => Number(corr(numericCol(ds.rows, a), numericCol(ds.rows, b)).toFixed(2))));
    const text = z.map((row) => row.map((v) => v.toFixed(2)));
    return {
      data: [{
        type: "heatmap",
        x: cols,
        y: cols,
        z,
        text,
        texttemplate: "%{text}",
        textfont: { size: Math.max(9, Math.min(13, 160 / (cols.length || 1))) },
        zmin: -1,
        zmax: 1,
        colorscale: "RdBu",
        reversescale: true,
        colorbar: { title: "r" },
      }],
      layout: baseLayout(spec, { noAxes: true }),
    };
  }

  if (spec.graphType === "radar") {
    const cols = ds.columns.filter((c) => ds.types[c] === "numeric");
    const radarGroups = spec.groupVar ? groupValues(ds, spec.groupVar) : ["Mean"];
    const traces = radarGroups.map((g, gi) => {
      const rows = spec.groupVar ? ds.rows.filter((r) => String(r[spec.groupVar] ?? "") === g) : ds.rows;
      const vals = cols.map((c) => mean(numericCol(rows, c)));
      return { type: "scatterpolar", r: [...vals, vals[0]], theta: [...cols, cols[0]], fill: "toself", name: g, line: { color: lineColor(spec, gi) }, opacity: spec.opacity };
    });
    return { data: traces, layout: { ...baseLayout(spec, { noAxes: true }), polar: { radialaxis: { visible: true } } } };
  }

  if (spec.graphType === "parallel") {
    const cols = ds.columns.filter((c) => ds.types[c] === "numeric");
    return {
      data: [{ type: "parcoords", dimensions: cols.map((c) => ({ label: c, values: numericCol(ds.rows, c) })), line: { color: "#1f77b4" } }],
      layout: baseLayout(spec, { noAxes: true }),
    };
  }

  if (spec.graphType === "treemap") {
    const agg = aggregateByCategory(ds, spec.xVar, spec.yVar);
    return { data: [{ type: "treemap", labels: agg.labels, parents: agg.labels.map(() => ""), values: agg.values, marker: { colors: agg.labels.map((_, i) => markColor(spec, i)) } }], layout: baseLayout(spec, { noAxes: true }) };
  }

  if (spec.graphType === "waffle") {
    const agg = aggregateByCategory(ds, spec.xVar, spec.yVar);
    const total = agg.values.reduce((a, b) => a + b, 0) || 1;
    const cellCounts = agg.labels.map((_, li) => Math.max(1, Math.round((agg.values[li] / total) * 100)));
    const traces: any[] = [];
    let curIdx = 0;
    agg.labels.forEach((label, li) => {
      const count = cellCounts[li];
      const xs: number[] = [];
      const ys: number[] = [];
      for (let k = 0; k < count && curIdx < 100; k++, curIdx++) {
        xs.push(curIdx % 10);
        ys.push(9 - Math.floor(curIdx / 10));
      }
      if (xs.length) {
        traces.push({
          type: "scatter",
          mode: "markers",
          name: `${label} (${Math.round((agg.values[li] / total) * 100)}%)`,
          x: xs,
          y: ys,
          marker: {
            symbol: "square",
            size: 20,
            color: markColor(spec, li),
            line: { color: "#ffffff", width: 2 },
          },
        });
      }
    });
    return {
      data: traces,
      layout: {
        ...baseLayout(spec, { noAxes: true }),
        xaxis: { visible: false, range: [-1, 10] },
        yaxis: { visible: false, range: [-1, 10], scaleanchor: "x" },
        showlegend: true,
      },
    };
  }

  if (spec.graphType === "circularBar") {
    const agg = aggregateByCategory(ds, spec.xVar, spec.yVar);
    return {
      data: [{
        type: "barpolar",
        theta: agg.labels,
        r: agg.values,
        marker: { color: agg.labels.map((_, i) => markColor(spec, i)), opacity: spec.opacity },
      }],
      layout: {
        ...baseLayout(spec, { noAxes: true }),
        polar: {
          hole: 0.18,
          radialaxis: { visible: true, showticklabels: true },
          angularaxis: { direction: "clockwise" },
        },
        showlegend: false,
      },
    };
  }

  return null;
}
