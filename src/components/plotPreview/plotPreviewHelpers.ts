import { PlotSpec } from "../../types";

export interface GraphComponentSelection {
  key: string;
  label: string;
  kind: "point" | "trace";
  traceName: string;
}

export type GuideKind = "none" | "single" | "oneandhalf" | "double" | "slide";

export function pointKey(curveNumber: number, pointNumber: number): string {
  return `point:${curveNumber}:${pointNumber}`;
}

export function traceKey(curveNumber: number): string {
  return `trace:${curveNumber}`;
}

export function plotFeatureFromTarget(target: EventTarget | null): string | null {
  const element = target instanceof Element ? target : null;
  if (!element) return null;
  if (element.closest(".legend, .colorbar")) return "legend";
  if (element.closest(".gtitle")) return "title";
  if (element.closest(".xaxislayer-above, .xaxislayer-below")) return "x-axis";
  if (element.closest(".yaxislayer-above, .yaxislayer-below")) return "y-axis";
  if (element.closest(".gridlayer")) return "grid";
  if (element.closest(".scatterlayer, .barlayer, .boxlayer, .violinglayer, .carpetlayer, .funnelarealayer")) return "trace";
  return null;
}

export function isObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function sanitizeTrace(trace: any): any {
  const next = isObject(trace) ? { ...trace } : {};
  const type = typeof next.type === "string" ? next.type : "scatter";
  next.type = type;

  const hasMarkerVisual = ["scatter", "bar", "box", "violin", "histogram", "pie", "treemap", "barpolar"].includes(type);
  if (hasMarkerVisual || next.marker !== undefined) {
    next.marker = isObject(next.marker) ? { ...next.marker } : {};
    if (next.marker.line !== undefined && !isObject(next.marker.line)) next.marker.line = {};
  }
  if (type === "scatter" || type === "scattergl" || type === "barpolar" || next.line !== undefined) {
    next.line = isObject(next.line) ? { ...next.line } : {};
  }
  return next;
}

export function lightenTrace(trace: any, markerPatch: Record<string, any>, linePatch: Record<string, any> = {}): any {
  const next = sanitizeTrace(trace);
  if (next.marker) next.marker = { ...next.marker, ...markerPatch };
  if (next.line) next.line = { ...next.line, ...linePatch };
  if (next.type === "bar" && next.marker) next.marker = { ...next.marker, ...markerPatch };
  return next;
}

export function libraryStyle(
  data: any[],
  layout: any,
  library: "plotly" | "ggplot2" | "matplotlib" | "seaborn" | "altair",
  spec: PlotSpec,
): { data: any[]; layout: any } {
  const nextLayout = {
    ...layout,
    xaxis: layout.xaxis ? { ...layout.xaxis, title: { ...(layout.xaxis.title ?? {}) } } : layout.xaxis,
    yaxis: layout.yaxis ? { ...layout.yaxis, title: { ...(layout.yaxis.title ?? {}) } } : layout.yaxis,
    legend: layout.legend ? { ...layout.legend } : layout.legend,
    margin: { ...(layout.margin ?? {}) },
    font: { ...(layout.font ?? {}) },
  };
  let nextData = data.map(sanitizeTrace);

  if (library === "plotly") {
    nextLayout.paper_bgcolor = spec.backgroundColor || "#ffffff";
    nextLayout.plot_bgcolor = spec.backgroundColor || "#ffffff";
    nextLayout.hovermode = "closest";
    nextLayout.font = { ...nextLayout.font, family: spec.fontFamily || "Inter, Arial, sans-serif" };
    nextLayout.legend = { ...(nextLayout.legend ?? {}), bgcolor: "rgba(255,255,255,0)", borderwidth: 0 };
    return { data: nextData, layout: nextLayout };
  }

  if (library === "ggplot2") {
    nextLayout.paper_bgcolor = "#ffffff";
    nextLayout.plot_bgcolor = spec.backgroundColor || "#EBEBEB";
    nextLayout.font = { ...nextLayout.font, family: "Arial, Helvetica, sans-serif", color: "#1f1f1f" };
    nextLayout.margin = { ...nextLayout.margin, l: 64, r: 24, t: spec.title ? 52 : 22, b: 56 };
    nextLayout.legend = { ...(nextLayout.legend ?? {}), bgcolor: "rgba(255,255,255,0)", borderwidth: 0 };
    if (nextLayout.xaxis) {
      nextLayout.xaxis = { ...nextLayout.xaxis, showgrid: true, gridcolor: "#ffffff", zeroline: false, linecolor: "rgba(0,0,0,0)", linewidth: 0, ticks: "outside" };
    }
    if (nextLayout.yaxis) {
      nextLayout.yaxis = { ...nextLayout.yaxis, showgrid: true, gridcolor: "#ffffff", zeroline: false, linecolor: "rgba(0,0,0,0)", linewidth: 0, ticks: "outside" };
    }
    nextData = nextData.map((trace) => lightenTrace(trace, { line: { ...(trace.marker?.line ?? {}), width: Math.max(0.4, Number(trace.marker?.line?.width ?? 0.4)), color: "#333333" } }));
    return { data: nextData, layout: nextLayout };
  }

  if (library === "matplotlib") {
    nextLayout.paper_bgcolor = spec.backgroundColor || "#ffffff";
    nextLayout.plot_bgcolor = spec.backgroundColor || "#ffffff";
    nextLayout.font = { ...nextLayout.font, family: "DejaVu Sans, Arial, sans-serif", color: "#111111" };
    nextLayout.margin = { ...nextLayout.margin, l: 66, r: 18, t: spec.title ? 48 : 18, b: 58 };
    nextLayout.legend = { ...(nextLayout.legend ?? {}), bgcolor: "rgba(255,255,255,0)", borderwidth: 0 };
    if (nextLayout.xaxis) nextLayout.xaxis = { ...nextLayout.xaxis, showgrid: spec.showGrid, gridcolor: "#d9d9d9", linecolor: "#111111", linewidth: 1.2, mirror: false };
    if (nextLayout.yaxis) nextLayout.yaxis = { ...nextLayout.yaxis, showgrid: spec.showGrid, gridcolor: "#d9d9d9", linecolor: "#111111", linewidth: 1.2, mirror: false };
    nextData = nextData.map((trace) => lightenTrace(trace, { opacity: spec.opacity, line: { ...(trace.marker?.line ?? {}), width: Math.max(0.8, Number(trace.marker?.line?.width ?? 0.8)) } }, { width: Math.max(1.4, Number(trace.line?.width ?? spec.lineWidth)) }));
    return { data: nextData, layout: nextLayout };
  }

  if (library === "seaborn") {
    nextLayout.paper_bgcolor = "#ffffff";
    nextLayout.plot_bgcolor = spec.backgroundColor || "#F3F6FA";
    nextLayout.font = { ...nextLayout.font, family: "Arial, Helvetica, sans-serif", color: "#263238" };
    nextLayout.margin = { ...nextLayout.margin, l: 66, r: 18, t: spec.title ? 48 : 18, b: 58 };
    nextLayout.legend = { ...(nextLayout.legend ?? {}), bgcolor: "rgba(255,255,255,0)", borderwidth: 0 };
    if (nextLayout.xaxis) nextLayout.xaxis = { ...nextLayout.xaxis, showgrid: true, gridcolor: "#ffffff", zeroline: false, linecolor: "#40505c", linewidth: 1 };
    if (nextLayout.yaxis) nextLayout.yaxis = { ...nextLayout.yaxis, showgrid: true, gridcolor: "#ffffff", zeroline: false, linecolor: "#40505c", linewidth: 1 };
    nextData = nextData.map((trace) => lightenTrace(trace, { opacity: Math.min(0.95, spec.opacity), line: { ...(trace.marker?.line ?? {}), width: 0.8, color: "rgba(38,50,56,0.45)" } }, { width: Math.max(1.6, Number(trace.line?.width ?? spec.lineWidth)) }));
    return { data: nextData, layout: nextLayout };
  }

  nextLayout.paper_bgcolor = "#ffffff";
  nextLayout.plot_bgcolor = spec.backgroundColor || "#ffffff";
  nextLayout.font = { ...nextLayout.font, family: "Inter, Helvetica, Arial, sans-serif", color: "#2e3440" };
  nextLayout.margin = { ...nextLayout.margin, l: 58, r: 18, t: spec.title ? 44 : 16, b: 50 };
  nextLayout.legend = { ...(nextLayout.legend ?? {}), bgcolor: "rgba(255,255,255,0)", borderwidth: 0 };
  if (nextLayout.xaxis) nextLayout.xaxis = { ...nextLayout.xaxis, showgrid: true, gridcolor: "#edf0f7", zeroline: false, linecolor: "#d8dee9", linewidth: 1 };
  if (nextLayout.yaxis) nextLayout.yaxis = { ...nextLayout.yaxis, showgrid: true, gridcolor: "#edf0f7", zeroline: false, linecolor: "#d8dee9", linewidth: 1 };
  nextData = nextData.map((trace) => lightenTrace(trace, { line: { ...(trace.marker?.line ?? {}), width: 0 }, opacity: spec.opacity }, { width: Math.max(2, Number(trace.line?.width ?? spec.lineWidth)) }));
  return { data: nextData, layout: nextLayout };
}

export function cloneAndApplyComponentColors(data: any[], componentColors: Record<string, string> | null | undefined, selectedKey: string | null): any[] {
  const overrides = componentColors ?? {};
  if (!Object.keys(overrides).length && !selectedKey) return data;
  return data.map((trace, curveNumber) => {
    const next = sanitizeTrace(trace);
    const traceOverride = overrides[traceKey(curveNumber)];
    const usesMarkerColors = next.type === "pie" || next.type === "treemap";
    if (traceOverride) {
      next.marker = { ...(next.marker ?? {}), [usesMarkerColors ? "colors" : "color"]: traceOverride };
      next.line = { ...(next.line ?? {}), color: traceOverride };
    }
    const length = Math.max(
      Array.isArray(trace.x) ? trace.x.length : 0,
      Array.isArray(trace.y) ? trace.y.length : 0,
      Array.isArray(trace.labels) ? trace.labels.length : 0
    );
    if (length > 0) {
      const markerColorValue = usesMarkerColors ? next.marker?.colors : next.marker?.color;
      const base = Array.isArray(markerColorValue)
        ? [...markerColorValue]
        : Array.from({ length }, () => markerColorValue ?? traceOverride ?? "#4C6FE0");
      let changed = false;
      for (let i = 0; i < length; i++) {
        const override = overrides[pointKey(curveNumber, i)];
        if (override) {
          base[i] = override;
          changed = true;
        }
      }
      if (changed) next.marker = { ...(next.marker ?? {}), [usesMarkerColors ? "colors" : "color"]: base };
    }
    if (selectedKey === traceKey(curveNumber)) {
      next.marker = { ...(next.marker ?? {}), line: { ...(next.marker?.line ?? {}), width: Math.max(2, Number(next.marker?.line?.width ?? 0) + 2), color: "#5B54E6" } };
    }
    return next;
  });
}
