import { useState, useLayoutEffect, useRef } from "react";
import { Dataset, GraphType, PlotSpec, GRAPH_CATEGORIES } from "../types";
import { ChartTypeMiniIcon } from "./ChartThumbnails";
import {
  InspectorPanel,
  ComponentEditScope,
  GraphComponentSelection,
  getChartCapabilities,
} from "./inspector/inspectorHelpers";
import { StyleTab } from "./inspector/StyleTab";
import { AxesTab } from "./inspector/AxesTab";
import { LegendThemeTab } from "./inspector/LegendThemeTab";

export type { ChartCapabilities } from "./inspector/inspectorHelpers";
export { getChartCapabilities } from "./inspector/inspectorHelpers";

interface Props {
  spec: PlotSpec;
  patch: (p: Partial<PlotSpec>) => void;
  dataset: Dataset;
  collapsed: boolean;
  graphLibrary: "plotly" | "ggplot2" | "matplotlib" | "seaborn" | "altair";
  onGraphLibraryChange: (library: "plotly" | "ggplot2" | "matplotlib" | "seaborn" | "altair") => void;
  chartTypeLabel: string;
  onChangeType: () => void;
  componentEditScope: ComponentEditScope;
  onComponentEditScopeChange: (scope: ComponentEditScope) => void;
  selectedComponent: GraphComponentSelection | null;
  selectedComponentColor: string;
  onSelectedComponentColorChange: (color: string) => void;
  onResetSelectedComponentColor: () => void;
  onClearSelectedComponent: () => void;
  initialScrollTop?: number;
  onScroll?: (scrollTop: number) => void;
}

export default function Inspector({
  spec,
  patch,
  dataset,
  collapsed,
  graphLibrary,
  onGraphLibraryChange,
  chartTypeLabel,
  onChangeType,
  componentEditScope,
  onComponentEditScopeChange,
  selectedComponent,
  selectedComponentColor,
  onSelectedComponentColorChange,
  onResetSelectedComponentColor,
  onClearSelectedComponent,
  initialScrollTop,
  onScroll,
}: Props) {
  const all = dataset.columns;
  const t = spec.graphType;
  const [panel, setPanel] = useState<InspectorPanel>("style");

  const inspectorRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (inspectorRef.current && initialScrollTop != null && initialScrollTop > 0) {
      inspectorRef.current.scrollTop = initialScrollTop;
    }
  }, [initialScrollTop]);

  const caps = getChartCapabilities(t);

  if (collapsed) {
    return <div className="inspector collapsed" />;
  }

  const axesCustomCount = caps.hasCartesianAxes
    ? [
        spec.xScale && spec.xScale !== "linear",
        spec.yScale && spec.yScale !== "linear",
        Boolean(spec.xMin || spec.xMax),
        Boolean(spec.yMin || spec.yMax),
        spec.xTickAngle !== 0,
        spec.yTickAngle !== 0,
        spec.xTickDirection && spec.xTickDirection !== "outside",
        spec.frameStyle && spec.frameStyle !== "plain",
        Boolean(spec.xAxisBreak1Start || spec.yAxisBreak1Start),
      ].filter(Boolean).length
    : 0;

  const legendThemeCount = [
    spec.theme && spec.theme !== "classic",
    spec.palette && spec.palette !== "prism",
    spec.legendPos && spec.legendPos !== "right",
    Boolean(spec.fontFamily && spec.fontFamily !== "Arial, sans-serif"),
  ].filter(Boolean).length;

  const styleCount = [
    caps.hasPoints && spec.pointSize !== 5,
    caps.hasLines && spec.lineWidth !== 2,
    spec.opacity !== 1,
    caps.hasPoints && Boolean(spec.pointSymbol && spec.pointSymbol !== "circle"),
    caps.hasBars && Boolean(spec.fillPattern && spec.fillPattern !== "solid"),
    caps.hasComposition && (spec.pieExplode > 0 || spec.donutHole > 0.4),
    caps.isVolcano && Boolean(spec.volcanoColorBySig),
    caps.hasHistogram && spec.histBins !== 30,
  ].filter(Boolean).length;

  return (
    <div
      className="inspector"
      ref={inspectorRef}
      onScroll={(e) => onScroll?.(e.currentTarget.scrollTop)}
    >
      <div className="inspector-toolbar">
        <strong>Inspector</strong>
        <span className="inspector-type-tag">{chartTypeLabel}</span>
      </div>

      {/* Chart Type Card */}
      <div className="typecard">
        <div className={`ic graph-type-icon graph-type-icon-${spec.graphType}`} aria-hidden="true">
          <ChartTypeMiniIcon type={spec.graphType} />
        </div>
        <div className="body">
          <div className="k">Graph Type</div>
          <select
            className="chart-type-dropdown"
            value={spec.graphType}
            onChange={(e) => patch({ graphType: e.target.value as GraphType })}
            aria-label="Select chart type"
            title={`Active: ${chartTypeLabel}`}
          >
            {GRAPH_CATEGORIES.map((cat) => (
              <optgroup key={cat.category} label={cat.category}>
                {cat.types.map((gt) => (
                  <option key={gt.id} value={gt.id}>
                    {gt.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <button className="changebtn" type="button" onClick={onChangeType} title="Browse full chart gallery">
          Gallery...
        </button>
      </div>

      {/* Adaptive Mode Tabs */}
      <div className="inspector-mode-tabs" role="tablist" aria-label="Field settings sections">
        <button
          className={panel === "style" ? "active" : ""}
          type="button"
          onClick={() => setPanel("style")}
        >
          {caps.hasComposition ? "Slices & Style" : "Marks & Style"}
          {styleCount > 0 && <span className="tab-badge">{styleCount}</span>}
        </button>
        <button
          className={panel === "axes" ? "active" : ""}
          type="button"
          onClick={() => setPanel("axes")}
        >
          {caps.hasCartesianAxes ? "Axes & Grid" : "Layout"}
          {axesCustomCount > 0 && <span className="tab-badge">{axesCustomCount}</span>}
        </button>
        <button
          className={panel === "legend" ? "active" : ""}
          type="button"
          onClick={() => setPanel("legend")}
        >
          Theme &amp; Legend
          {legendThemeCount > 0 && <span className="tab-badge">{legendThemeCount}</span>}
        </button>
      </div>

      {/* Panels */}
      {panel === "style" && (
        <StyleTab
          spec={spec}
          patch={patch}
          dataset={dataset}
          caps={caps}
          all={all}
          graphLibrary={graphLibrary}
          onGraphLibraryChange={onGraphLibraryChange}
        />
      )}

      {panel === "axes" && (
        <AxesTab
          spec={spec}
          patch={patch}
          caps={caps}
          chartTypeLabel={chartTypeLabel}
        />
      )}

      {panel === "legend" && (
        <LegendThemeTab
          spec={spec}
          patch={patch}
          componentEditScope={componentEditScope}
          onComponentEditScopeChange={onComponentEditScopeChange}
          selectedComponent={selectedComponent}
          selectedComponentColor={selectedComponentColor}
          onSelectedComponentColorChange={onSelectedComponentColorChange}
          onResetSelectedComponentColor={onResetSelectedComponentColor}
          onClearSelectedComponent={onClearSelectedComponent}
        />
      )}
    </div>
  );
}
