import { Dataset, PlotSpec } from "../types";
import {
  markColor,
  markerStyle,
  markerColorStyle,
  lineStyle,
  errorStyle,
  barMarker,
  numericCol,
  mean,
  errorAmount,
  errorBandAmount,
  hexToRgba,
  kde,
  scaleSize,
  ecdf,
  textFont,
  traceText,
  withTextMode,
  smoothLine,
  uniqueStrings,
  beeswarmOffsets,
} from "./plotlyMathHelpers";

export function addCartesianTrace(
  spec: PlotSpec,
  ds: Dataset,
  data: any[],
  groups: string[],
  g: string,
  gi: number,
  rows: Dataset["rows"],
  color: string,
  strokeColor: string,
  name: string,
  sizeDom: [number, number] | null,
  horizontal: boolean
): void {
    switch (spec.graphType) {
      case "scatter":
        data.push({
          type: "scatter", mode: withTextMode("markers", spec),
          x: rows.map((r) => r[spec.xVar]), y: rows.map((r) => r[spec.yVar]), name,
          text: traceText(spec, rows), textposition: "top center", textfont: textFont(spec),
          marker: markerColorStyle(spec, rows, color, gi === 0),
        });
        if (spec.showDropSpikes) {
          const sx: (string | number | null)[] = [];
          const sy: (number | null)[] = [];
          rows.forEach((r) => {
            const x = r[spec.xVar] as string | number;
            const y = Number(r[spec.yVar]);
            if (Number.isFinite(y)) {
              sx.push(x, x, null);
              sy.push(0, y, null);
            }
          });
          data.push({ type: "scatter", mode: "lines", x: sx, y: sy, line: lineStyle(spec, strokeColor, { width: Math.max(0.5, spec.lineWidth * 0.45) }), showlegend: false, hoverinfo: "skip", opacity: Math.min(spec.opacity, 0.5) });
        }
        break;
      case "connected":
        data.push({
          type: "scatter", mode: withTextMode("lines+markers", spec),
          x: rows.map((r) => r[spec.xVar]), y: rows.map((r) => r[spec.yVar]), name,
          text: traceText(spec, rows), textposition: "top center", textfont: textFont(spec),
          line: lineStyle(spec, strokeColor), marker: markerColorStyle(spec, rows, color, gi === 0),
        });
        if (spec.showDirectionalArrows && rows.length) {
          const last = rows[rows.length - 1];
          data.push({ type: "scatter", mode: "markers", x: [last[spec.xVar]], y: [last[spec.yVar]], marker: markerStyle(spec, strokeColor, { symbol: "triangle-right", size: spec.pointSize + 4 }), showlegend: false, hoverinfo: "skip" });
        }
        break;
      case "bubble":
        data.push({
          type: "scatter", mode: withTextMode("markers", spec),
          x: rows.map((r) => r[spec.xVar]), y: rows.map((r) => r[spec.yVar]), name,
          text: traceText(spec, rows), textposition: "top center", textfont: textFont(spec),
          marker: {
            size: sizeDom ? rows.map((r) => scaleSize(Number(r[spec.sizeVar]), sizeDom)) : spec.pointSize * 2,
            color: spec.colorVar ? rows.map((r) => Number(r[spec.colorVar])) : color,
            colorscale: spec.colorVar ? spec.contColorScale : undefined,
            colorbar: spec.colorVar && gi === 0 ? { title: spec.colorVar } : undefined,
            showscale: spec.colorVar ? gi === 0 : undefined,
            opacity: Math.min(spec.opacity, 0.75), line: { width: spec.pointStroke, color: "#333" }, symbol: spec.pointSymbol,
            sizemode: "diameter",
          },
        });
        break;
      case "line":
      case "timeSeries":
      case "step":
        data.push({
          type: "scatter", mode: withTextMode(spec.showPoints ? "lines+markers" : "lines", spec),
          x: rows.map((r) => r[spec.xVar]), y: rows.map((r) => r[spec.yVar]), name,
          text: traceText(spec, rows), textposition: "top center", textfont: textFont(spec),
          line: lineStyle(spec, strokeColor), marker: markerColorStyle(spec, rows, color, gi === 0), opacity: spec.opacity,
        });
        if (spec.showDirectionalArrows && rows.length) {
          const last = rows[rows.length - 1];
          data.push({ type: "scatter", mode: "markers", x: [last[spec.xVar]], y: [last[spec.yVar]], marker: markerStyle(spec, strokeColor, { symbol: "triangle-right", size: spec.pointSize + 4 }), showlegend: false, hoverinfo: "skip" });
        }
        break;
      case "smooth": {
        const s = smoothLine(rows, spec.xVar, spec.yVar);
        if (spec.showPoints) {
          data.push({
            type: "scatter", mode: withTextMode("markers", spec),
            x: rows.map((r) => r[spec.xVar]), y: rows.map((r) => r[spec.yVar]), name: `${name} points`,
            text: traceText(spec, rows), textposition: "top center", textfont: textFont(spec),
            marker: markerColorStyle(spec, rows, color, gi === 0, { opacity: Math.min(spec.opacity, 0.55) }), showlegend: false,
          });
        }
        if (spec.showErrorEnvelope && s.x.length) {
          const band = errorBandAmount(numericCol(rows, spec.yVar), spec);
          data.push({
            type: "scatter", mode: "lines", x: s.x, y: s.y.map((v) => v + band),
            line: { width: 0 }, showlegend: false, hoverinfo: "skip",
          });
          data.push({
            type: "scatter", mode: "lines", x: s.x, y: s.y.map((v) => v - band),
            line: { width: 0 }, fill: "tonexty", fillcolor: hexToRgba(color, Math.min(0.25, spec.opacity * 0.25)),
            showlegend: false, hoverinfo: "skip",
          });
        }
        data.push({
          type: "scatter", mode: "lines", x: s.x, y: s.y, name,
          line: lineStyle(spec, strokeColor), opacity: spec.opacity,
        });
        if (spec.showDirectionalArrows && s.x.length) {
          data.push({ type: "scatter", mode: "markers", x: [s.x[s.x.length - 1]], y: [s.y[s.y.length - 1]], marker: markerStyle(spec, strokeColor, { symbol: "triangle-right", size: spec.pointSize + 4 }), showlegend: false, hoverinfo: "skip" });
        }
        break;
      }
      case "area":
      case "stackedArea":
      case "stream":
        data.push({
          type: "scatter", mode: "lines",
          x: rows.map((r) => r[spec.xVar]), y: rows.map((r) => r[spec.yVar]), name,
          line: lineStyle(spec, strokeColor),
          fill: spec.graphType === "stream" || spec.graphType === "stackedArea" || spec.stacked ? "tonexty" : "tozeroy",
          stackgroup: spec.graphType === "stream" || spec.graphType === "stackedArea" || spec.stacked ? "one" : undefined,
          fillcolor: hexToRgba(color, spec.opacity * 0.55), opacity: spec.opacity,
        });
        break;
      case "ridgeline": {
        const vals = numericCol(rows, spec.xVar);
        const d = kde(vals);
        const maxY = Math.max(...d.y, 0.001);
        const scaledY = d.y.map((v) => gi + (v / maxY) * 0.85);
        const polyX = [...d.x, d.x[d.x.length - 1], d.x[0]];
        const polyY = [...scaledY, gi, gi];
        data.push({
          type: "scatter",
          mode: "lines",
          x: polyX,
          y: polyY,
          name,
          line: lineStyle(spec, strokeColor, { width: spec.lineWidth || 1.6 }),
          fill: "toself",
          fillcolor: hexToRgba(color, Math.max(0.35, spec.opacity * 0.7)),
        });
        break;
      }
      case "density": {
        const d = kde(numericCol(rows, spec.xVar));
        data.push({
          type: "scatter", mode: "lines", x: d.x, y: d.y, name,
          line: lineStyle(spec, strokeColor), fill: "tozeroy", fillcolor: hexToRgba(color, spec.opacity * 0.4),
        });
        break;
      }
      case "ecdf": {
        const d = ecdf(numericCol(rows, spec.xVar));
        data.push({
          type: "scatter", mode: "lines", x: d.x, y: d.y, name,
          line: lineStyle({ ...spec, lineConnection: "staircase" }, strokeColor), opacity: spec.opacity,
        });
        break;
      }
      case "rug": {
        const yBase = groups.length > 1 ? gi * 0.25 : 0;
        data.push({
          type: "scatter", mode: "markers",
          x: rows.map((r) => r[spec.xVar]), y: rows.map(() => yBase), name,
          marker: {
            symbol: "line-ns-open",
            size: Math.max(16, spec.pointSize * 2.5),
            color,
            line: { width: Math.max(1.5, spec.pointStroke), color },
            opacity: spec.opacity,
          },
        });
        break;
      }
      case "errorBar": {
        const cats = uniqueStrings({ ...ds, rows } as Dataset, spec.xVar);
        const means = cats.map((c) => mean(numericCol(rows.filter((r) => String(r[spec.xVar] ?? "") === c), spec.yVar)));
        const errs = cats.map((c) => {
          const vals = numericCol(rows.filter((r) => String(r[spec.xVar] ?? "") === c), spec.yVar);
          return errorAmount(vals, spec);
        });
        data.push({
          type: "bar", x: horizontal ? means : cats, y: horizontal ? cats : means, orientation: horizontal ? "h" : "v", name,
          width: spec.barWidth ?? 0.8,
          marker: barMarker(spec, color),
          ...errorStyle(spec, errs, horizontal),
        });
        break;
      }
      case "dotPlot": {
        const cats = uniqueStrings({ ...ds, rows } as Dataset, spec.xVar);
        const means = cats.map((c) => mean(numericCol(rows.filter((r) => String(r[spec.xVar] ?? "") === c), spec.yVar)));
        data.push({
          type: "scatter", mode: withTextMode("markers", spec),
          x: horizontal ? means : cats, y: horizontal ? cats : means, name,
          text: spec.labelVar ? cats : undefined, textposition: "top center", textfont: textFont(spec),
          marker: markerStyle(spec, color, { size: spec.pointSize + 4 }),
        });
        break;
      }
      case "forest": {
        const effectRows = rows
          .map((r, i) => ({
            label: spec.xVar ? String(r[spec.xVar] ?? i + 1) : String(i + 1),
            effect: Number(r[spec.yVar]),
            error: spec.sizeVar ? Math.abs(Number(r[spec.sizeVar])) : NaN,
          }))
          .filter((r) => Number.isFinite(r.effect));
        const effects = effectRows.map((r) => r.effect);
        const errors = effectRows.map((r) => Number.isFinite(r.error) && r.error > 0 ? r.error : Math.max(0.05, Math.abs(r.effect) * 0.15));
        const labels = effectRows.map((r) => r.label);

        data.push({
          type: "scatter", mode: "markers", orientation: "h",
          x: effects, y: labels, name,
          marker: markerStyle(spec, color, { symbol: "square", size: spec.pointSize + 4 }),
          error_x: {
            type: "data",
            array: errors,
            visible: true,
            color: strokeColor || "#333",
            thickness: spec.errorCapThickness ?? 1.5,
            width: 5,
          },
        });

        if (gi === groups.length - 1 && effects.length >= 2) {
          const invVars = errors.map((e) => 1 / (e * e || 1));
          const sumInvVar = invVars.reduce((a, b) => a + b, 0) || 1;
          const pooledMean = effects.reduce((sum, eff, idx) => sum + eff * invVars[idx], 0) / sumInvVar;
          const pooledErr = 1.96 * Math.sqrt(1 / sumInvVar);

          data.push({
            type: "scatter", mode: "markers", orientation: "h",
            x: [pooledMean],
            y: ["Overall / Summary"],
            name: "Overall Summary",
            marker: { symbol: "diamond", size: Math.max(14, spec.pointSize + 6), color: "#dc2626", line: { color: "#991b1b", width: 1.5 } },
            error_x: {
              type: "data",
              array: [pooledErr],
              visible: true,
              color: "#dc2626",
              thickness: 2.2,
              width: 0,
            },
          });
        }
        break;
      }
      case "slope":
        data.push({
          type: "scatter", mode: withTextMode("lines+markers", spec),
          x: rows.map((r) => r[spec.xVar]), y: rows.map((r) => r[spec.yVar]), name,
          text: traceText(spec, rows), textposition: "top center", textfont: textFont(spec),
          line: lineStyle(spec, strokeColor), marker: markerStyle(spec, color),
        });
        break;
      case "bar": {
        const cats = uniqueStrings({ ...ds, rows } as Dataset, spec.xVar);
        const means = cats.map((c) => mean(numericCol(rows.filter((r) => String(r[spec.xVar] ?? "") === c), spec.yVar)));
        const errs = cats.map((c) => {
          const vals = numericCol(rows.filter((r) => String(r[spec.xVar] ?? "") === c), spec.yVar);
          if (spec.barError === "none") return 0;
          return errorAmount(vals, spec);
        });
        data.push({
          type: "bar", x: horizontal ? means : cats, y: horizontal ? cats : means, orientation: horizontal ? "h" : "v", name,
          width: spec.barWidth ?? 0.8,
          marker: barMarker(spec, color),
          ...errorStyle(spec, errs, horizontal),
        });
        break;
      }
      case "lollipop": {
        const cats = uniqueStrings({ ...ds, rows } as Dataset, spec.xVar);
        const means = cats.map((c) => mean(numericCol(rows.filter((r) => String(r[spec.xVar] ?? "") === c), spec.yVar)));
        const sx: (string | null)[] = [];
        const sy: (number | null)[] = [];
        cats.forEach((c, i) => { sx.push(c, c, null); sy.push(0, means[i], null); });
        data.push({ type: "scatter", mode: "lines", x: horizontal ? sy : sx, y: horizontal ? sx : sy, line: lineStyle(spec, strokeColor), showlegend: false, hoverinfo: "skip" });
        data.push({ type: "scatter", mode: "markers", x: horizontal ? means : cats, y: horizontal ? cats : means, name, marker: markerStyle(spec, color, { size: spec.pointSize + 4 }) });
        break;
      }
      case "box":
        data.push({
          type: "box", orientation: horizontal ? "h" : "v",
          y: horizontal ? (spec.groupVar ? rows.map(() => g) : rows.map((r) => r[spec.xVar])) : rows.map((r) => r[spec.yVar]),
          x: horizontal ? rows.map((r) => r[spec.yVar]) : (spec.groupVar ? rows.map(() => g) : rows.map((r) => r[spec.xVar])), name,
          marker: { color, symbol: spec.pointSymbol }, boxpoints: spec.showPoints ? "all" : "outliers", jitter: 0.4, pointpos: 0,
          fillcolor: color, opacity: spec.opacity, line: { color: "#333" },
        });
        break;
      case "beeswarm": {
        const isCatX = ds.types[spec.xVar] === "categorical" || !spec.groupVar;
        const cats = isCatX ? uniqueStrings({ ...ds, rows } as Dataset, spec.xVar) : [g];
        cats.forEach((cat, ci) => {
          const catRows = isCatX ? rows.filter((r) => String(r[spec.xVar] ?? "") === cat) : rows;
          const numVals = numericCol(catRows, horizontal ? spec.xVar : spec.yVar);
          const offsets = beeswarmOffsets(numVals);
          const basePos = isCatX ? ci : gi;
          const swarmPos = offsets.map((o) => basePos + o);
          data.push({
            type: "scatter",
            mode: withTextMode("markers", spec),
            x: horizontal ? numVals : swarmPos,
            y: horizontal ? swarmPos : numVals,
            name: isCatX ? cat : name,
            showlegend: !isCatX && ci === 0,
            text: traceText(spec, catRows),
            textposition: "top center",
            textfont: textFont(spec),
            marker: markerStyle(spec, isCatX ? markColor(spec, ci) : color, { size: Math.max(4, spec.pointSize) }),
          });
        });
        break;
      }
      case "strip":
        data.push({
          type: "box", orientation: horizontal ? "h" : "v",
          y: horizontal ? (spec.groupVar ? rows.map(() => g) : rows.map((r) => r[spec.xVar])) : rows.map((r) => r[spec.yVar]),
          x: horizontal ? rows.map((r) => r[spec.yVar]) : (spec.groupVar ? rows.map(() => g) : rows.map((r) => r[spec.xVar])), name,
          boxpoints: "all", jitter: 0.55, pointpos: 0,
          marker: markerStyle(spec, color),
          fillcolor: "rgba(0,0,0,0)", line: { color: "rgba(0,0,0,0)" }, hoveron: "points",
        });
        break;
      case "violin":
        data.push({
          type: "violin", orientation: horizontal ? "h" : "v",
          y: horizontal ? (spec.groupVar ? rows.map(() => g) : rows.map((r) => r[spec.xVar])) : rows.map((r) => r[spec.yVar]),
          x: horizontal ? rows.map((r) => r[spec.yVar]) : (spec.groupVar ? rows.map(() => g) : rows.map((r) => r[spec.xVar])), name,
          points: spec.showPoints ? "all" : false, box: { visible: true }, meanline: { visible: true },
          fillcolor: color, opacity: spec.opacity, line: { color: "#333" },
        });
        break;
      case "histogram":
        data.push({
          type: "histogram", x: rows.map((r) => r[spec.xVar]), name,
          marker: { color, opacity: spec.opacity, line: { width: Math.max(0.5, spec.pointStroke), color: "#fff" } }, nbinsx: spec.histBins,
          histnorm: spec.histNorm === "density" ? "probability density" : spec.histNorm === "percent" ? "percent" : "",
        });
        break;
    }


}
