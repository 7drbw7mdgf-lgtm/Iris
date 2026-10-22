import { Dataset, PlotSpec, PALETTES } from "../types";

export function colorFor(palette: string, i: number): string {
  const arr = PALETTES[palette as keyof typeof PALETTES] ?? PALETTES.prism;
  return arr[i % arr.length];
}

export function markColor(spec: PlotSpec, i: number): string {
  return spec.markColor || colorFor(spec.palette, i);
}

export function lineColor(spec: PlotSpec, i: number): string {
  return spec.lineColor || spec.markColor || colorFor(spec.palette, i);
}

export function markerStyle(spec: PlotSpec, color: string, extra: Record<string, any> = {}): any {
  return {
    symbol: spec.pointSymbol,
    size: spec.pointSize,
    color,
    opacity: spec.opacity,
    line: { width: spec.pointStroke, color: "#333" },
    ...extra,
  };
}

export function markerColorStyle(spec: PlotSpec, rows: Dataset["rows"], fallback: string, showscale = false, extra: Record<string, any> = {}): any {
  if (!spec.colorVar) return markerStyle(spec, fallback, extra);
  return markerStyle(spec, fallback, {
    color: rows.map((r) => Number(r[spec.colorVar])),
    colorscale: spec.contColorScale,
    colorbar: showscale ? { title: spec.colorVar } : undefined,
    showscale,
    ...extra,
  });
}

export function lineShape(spec: PlotSpec): "linear" | "hv" | "spline" {
  if (spec.graphType === "step" || spec.lineConnection === "staircase") return "hv";
  if (spec.lineConnection === "spline") return "spline";
  return "linear";
}

export function lineStyle(spec: PlotSpec, color: string, extra: Record<string, any> = {}): any {
  return {
    width: spec.lineWidth,
    color,
    dash: spec.linePattern === "dash" || spec.linePattern === "dot" || spec.linePattern === "dashdot" ? spec.linePattern : "solid",
    shape: lineShape(spec),
    ...extra,
  };
}

export function errorStyle(spec: PlotSpec, values: number[], horizontal: boolean): any {
  const visible = spec.graphType === "errorBar" || spec.barError !== "none";
  if (!visible) return undefined;
  const direction = spec.errorDirection ?? "both";
  const base = {
    type: "data",
    array: direction === "down" ? values.map(() => 0) : values,
    arrayminus: direction === "up" ? values.map(() => 0) : values,
    visible: true,
    color: "#333",
    thickness: spec.errorCapThickness ?? 1.4,
    width: Math.max(3, (spec.errorCapThickness ?? 1.4) * 4),
  };
  return horizontal ? { error_x: base } : { error_y: base };
}

export function barMarker(spec: PlotSpec, color: string): any {
  const marker: any = {
    color,
    opacity: spec.opacity,
    line: { width: spec.barBorderWidth ?? spec.pointStroke, color: "#333" },
  };
  if (spec.fillPattern === "hatch") {
    marker.pattern = { shape: "/", solidity: 0.35 };
  }
  if (spec.fillPattern === "gradient") {
    marker.pattern = { shape: ".", solidity: 0.18 };
  }
  return marker;
}


export function textFont(spec: PlotSpec): any {
  return spec.labelVar ? { size: spec.labelSize } : undefined;
}

export function traceText(spec: PlotSpec, rows: Dataset["rows"]): string[] | undefined {
  return spec.labelVar ? rows.map((r) => String(r[spec.labelVar] ?? "")) : undefined;
}

export function withTextMode(mode: string, spec: PlotSpec): string {
  return spec.labelVar ? `${mode}+text` : mode;
}


export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


