import { useEffect, useRef, useState } from "react";
import Plotly from "plotly.js-dist-min";
import { Dataset, PlotSpec, type FriendlyRenderIssue } from "../types";
import { buildFigure } from "../plotlyGen";
import type { PythonArtist } from "../tauri";
import {
  pointKey,
  traceKey,
  libraryStyle,
  cloneAndApplyComponentColors,
  type GraphComponentSelection,
} from "./plotPreview/plotPreviewHelpers";
import {
  QuickThemeChips,
  FloatingToolbar,
  GuideOverlay,
  ToastBanner,
  RenderErrorCard,
} from "./plotPreview/PlotPreviewControls";
import { usePlotPreviewInteraction } from "./plotPreview/usePlotPreviewInteraction";

interface Props {
  spec: PlotSpec;
  dataset: Dataset;
  mode: "live" | "ggplot" | "python";
  graphLibrary: "plotly" | "ggplot2" | "matplotlib" | "seaborn" | "altair";
  ggplotImage: string | null; // base64 PNG
  pythonImage: string | null; // base64 PNG
  rendering: boolean;
  pythonLibrary: "matplotlib" | "seaborn" | "altair" | null;
  patch: (p: Partial<PlotSpec>) => void;
  compact?: boolean;
  onDataFilter?: (col: string, value: string) => void;
  componentColors?: Record<string, string>;
  selectedComponentKey?: string | null;
  onSelectComponent?: (selection: GraphComponentSelection) => void;
  linkedFeature?: string | null;
  onHoverFeature?: (feature: string | null) => void;
  artistRegions?: PythonArtist[];
  selectedArtistKey?: string | null;
  hoveredArtistKey?: string | null;
  onHoverArtist?: (key: string | null) => void;
  onSelectArtist?: (key: string) => void;
  renderError?: FriendlyRenderIssue | string | null;
  onRetryRender?: () => void;
  onResetCode?: () => void;
}

export default function PlotPreview({
  spec,
  dataset,
  mode,
  graphLibrary,
  ggplotImage,
  pythonImage,
  rendering,
  pythonLibrary,
  patch,
  compact = false,
  onDataFilter,
  componentColors = {},
  selectedComponentKey = null,
  onSelectComponent,
  linkedFeature = null,
  onHoverFeature,
  artistRegions = [],
  selectedArtistKey = null,
  hoveredArtistKey = null,
  onHoverArtist,
  onSelectArtist,
  renderError = null,
  onRetryRender,
  onResetCode,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [dropOver, setDropOver] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const patchRef = useRef(patch);
  patchRef.current = patch;
  const filterRef = useRef(onDataFilter);
  filterRef.current = onDataFilter;
  const selectComponentRef = useRef(onSelectComponent);
  selectComponentRef.current = onSelectComponent;

  const {
    zoom,
    setZoom,
    clampZoom,
    guide,
    cycleGuide,
    toast,
    handlePreviewWheel,
    handlePreviewPointerDown,
    handlePreviewPointerMove,
    handlePreviewPointerEnd,
    hoverImageArtist,
    artistAtImage,
    previewInteractionProps,
    copyHighResImage,
  } = usePlotPreviewInteraction({
    mode,
    compact,
    ggplotImage,
    pythonImage,
    ref,
    artistRegions,
    onHoverArtist,
    onHoverFeature,
    linkedFeature,
  });

  const resizePlot = (el: HTMLDivElement) => {
    const run = () => {
      if (el.isConnected && el.clientWidth > 0 && el.clientHeight > 0) Plotly.Plots.resize(el);
    };
    requestAnimationFrame(run);
    window.setTimeout(run, 80);
    window.setTimeout(run, 220);
  };

  useEffect(() => {
    const hasData = dataset.columns.length > 0 && dataset.rows.length > 0;
    if (!hasData) {
      if (ref.current) Plotly.purge(ref.current);
      return;
    }
    if (mode !== "live" || !ref.current) return;
    const el = ref.current;
    try {
      const { data, layout } = buildFigure(spec, dataset);
      const libraryFigure = libraryStyle(data, layout, graphLibrary, spec);
      const styledData = cloneAndApplyComponentColors(libraryFigure.data, componentColors, selectedComponentKey);
      setLiveError(null);
      Plotly.react(el, styledData, libraryFigure.layout, {
        responsive: true,
        scrollZoom: !compact,
        displaylogo: false,
        edits: {
          legendPosition: true,
          legendText: false,
          titleText: true,
          axisTitleText: true,
          annotationPosition: true,
          annotationText: true,
        },
        modeBarButtonsToRemove: ["lasso2d", "select2d"],
      } as any)
        .then(() => requestAnimationFrame(() => {
          resizePlot(el);
        }))
        .catch((error: unknown) => {
          console.error("Iris live preview failed", error);
          setLiveError(error instanceof Error ? error.message : String(error));
        });
    } catch (err) {
      console.error("Iris live preview build failed", err);
      setLiveError(err instanceof Error ? err.message : String(err));
    }

    (el as any).removeAllListeners?.("plotly_relayout");
    (el as any).on("plotly_relayout", (ev: any) => {
      const p: Partial<PlotSpec> = {};
      if (ev["legend.x"] !== undefined) p.legendX = ev["legend.x"];
      if (ev["legend.y"] !== undefined) p.legendY = ev["legend.y"];
      if (ev["title.text"] !== undefined) p.title = ev["title.text"];
      if (ev["xaxis.title.text"] !== undefined) p.xLabel = ev["xaxis.title.text"];
      if (ev["yaxis.title.text"] !== undefined) p.yLabel = ev["yaxis.title.text"];
      if (Object.keys(p).length) patchRef.current(p);
    });
    (el as any).removeAllListeners?.("plotly_click");
    (el as any).on("plotly_click", (ev: any) => {
      const point = ev?.points?.[0];
      if (point && selectComponentRef.current) {
        const curveNumber = Number(point.curveNumber ?? 0);
        const pointNumber = Number(point.pointNumber ?? point.pointIndex ?? 0);
        const traceName = point?.data?.name != null ? String(point.data.name) : `Trace ${curveNumber + 1}`;
        const rawValue = point.text ?? point.label ?? `${point.x ?? ""}${point.y != null ? `, ${point.y}` : ""}`.trim();
        selectComponentRef.current({
          key: Number.isFinite(pointNumber) ? pointKey(curveNumber, pointNumber) : traceKey(curveNumber),
          label: rawValue ? `${traceName}: ${rawValue}` : traceName,
          kind: Number.isFinite(pointNumber) ? "point" : "trace",
          traceName,
        });
      }
      if (!filterRef.current) return;
      if (!point) return;
      const traceName = point?.data?.name != null ? String(point.data.name) : "";
      if (spec.groupVar && traceName && traceName !== spec.yVar && traceName !== "observed" && traceName !== "normal guide") {
        filterRef.current(spec.groupVar, traceName);
        return;
      }
      const label = point.label ?? point.x ?? point.theta ?? "";
      if (spec.xVar && label !== "") filterRef.current(spec.xVar, String(label));
    });
  }, [spec, dataset, mode, graphLibrary, componentColors, selectedComponentKey]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const resize = () => {
      resizePlot(el);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    if (el.parentElement) observer.observe(el.parentElement);
    window.addEventListener("resize", resize);
    resize();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [mode, dataset.columns.length, dataset.rows.length]);

  useEffect(() => {
    const el = ref.current;
    return () => {
      if (el) Plotly.purge(el);
    };
  }, []);

  const assignDroppedField = (col: string) => {
    if (!dataset.columns.includes(col)) return;
    const isNumeric = dataset.types[col] === "numeric";
    const categoryFirst = ["bar", "pie", "donut", "treemap", "waffle", "circularBar", "box", "violin", "beeswarm", "strip", "heatmap"].includes(spec.graphType);
    const update: Partial<PlotSpec> = {};

    if (!isNumeric) {
      if (categoryFirst || !spec.xVar) update.xVar = col;
      else update.groupVar = col;
      patch(update);
      return;
    }

    if (!spec.xVar || !dataset.columns.includes(spec.xVar)) update.xVar = col;
    else if (!spec.yVar || !dataset.columns.includes(spec.yVar) || spec.yVar === spec.xVar) update.yVar = col;
    else if (spec.graphType === "bubble" && (!spec.sizeVar || !dataset.columns.includes(spec.sizeVar))) update.sizeVar = col;
    else if (!spec.labelVar || !dataset.columns.includes(spec.labelVar)) update.labelVar = col;
    else update.yVar = col;
    patch(update);
  };

  const handleGraphDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const col = e.dataTransfer.getData("text/column") || e.dataTransfer.getData("text/plain");
    if (!col || !dataset.columns.includes(col)) return;
    e.preventDefault();
    setDropOver(false);
    assignDroppedField(col);
  };

  const graphDropProps = {
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => {
      const col = e.dataTransfer.getData("text/column") || e.dataTransfer.getData("text/plain");
      if (col && dataset.columns.includes(col)) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setDropOver(true);
      }
    },
    onDragLeave: () => setDropOver(false),
    onDrop: handleGraphDrop,
  };

  const hasDataset = dataset.columns.length > 0 && dataset.rows.length > 0;
  const hasRenderedImage = (mode === "ggplot" && !!ggplotImage) || (mode === "python" && !!pythonImage);
  if (!hasDataset && !hasRenderedImage && mode === "live") {
    return (
      <div className={`preview-stage ${compact ? "compact" : ""}`} {...previewInteractionProps} onWheel={handlePreviewWheel} onPointerDown={handlePreviewPointerDown} onPointerMove={handlePreviewPointerMove} onPointerUp={handlePreviewPointerEnd} onPointerCancel={handlePreviewPointerEnd}>
        <div className="empty-hint">
          <p>No data loaded.</p>
          <p className="muted">Import or drop a table file from the data panel to build a graph.</p>
        </div>
      </div>
    );
  }

  if (mode === "ggplot") {
    return (
      <div className={`preview-stage ggplot-stage ${compact ? "compact" : ""} ${dropOver ? "plot-drop-over" : ""}`} {...graphDropProps} {...previewInteractionProps} onWheel={handlePreviewWheel} onPointerDown={handlePreviewPointerDown} onPointerMove={handlePreviewPointerMove} onPointerUp={handlePreviewPointerEnd} onPointerCancel={handlePreviewPointerEnd}>
        <QuickThemeChips compact={compact} spec={spec} patch={patch} />
        {dropOver && <div className="plot-drop-hint">Drop field to update graph</div>}
        {rendering && <div className="render-overlay">Rendering with R…</div>}
        {ggplotImage ? (
          <div className="preview-zoom-content" style={{ transform: `scale(${zoom})` }}><img className="ggplot-img" src={`data:image/png;base64,${ggplotImage}`} alt="ggplot2 render" /></div>
        ) : renderError ? (
          <RenderErrorCard issue={renderError} dataset={dataset} onRetryRender={onRetryRender} onResetCode={onResetCode} patch={patch} />
        ) : (
          <div className="empty-hint">
            <p>No ggplot2 render yet.</p>
            <p className="muted">Click <strong>Render with R</strong> to produce the publication figure.</p>
          </div>
        )}
        <GuideOverlay compact={compact} guide={guide} />
        <FloatingToolbar compact={compact} zoom={zoom} setZoom={setZoom} clampZoom={clampZoom} guide={guide} cycleGuide={cycleGuide} copyHighResImage={copyHighResImage} />
        <ToastBanner toast={toast} />
      </div>
    );
  }

  if (mode === "python") {
    const label = graphLibrary === "plotly" ? "Plotly" : graphLibrary === "altair" ? "Altair" : pythonLibrary === "seaborn" ? "seaborn" : "matplotlib";
    const linkedKind = linkedFeature === "x-axis" ? "xlabel" : linkedFeature === "y-axis" ? "ylabel" : linkedFeature === "trace" ? "line" : linkedFeature;
    const activeArtist = artistRegions.find((artist) => artist.key === (hoveredArtistKey || selectedArtistKey))
      ?? artistRegions.find((artist) => artist.visible && artist.kind === linkedKind)
      ?? (linkedFeature === "trace" ? artistRegions.find((artist) => artist.visible && (artist.kind === "collection" || artist.kind === "patch")) : undefined);
    return (
      <div className={`preview-stage ggplot-stage ${compact ? "compact" : ""} ${dropOver ? "plot-drop-over" : ""}`} {...graphDropProps} {...previewInteractionProps} onWheel={handlePreviewWheel} onPointerDown={handlePreviewPointerDown} onPointerMove={handlePreviewPointerMove} onPointerUp={handlePreviewPointerEnd} onPointerCancel={handlePreviewPointerEnd}>
        <QuickThemeChips compact={compact} spec={spec} patch={patch} />
        {dropOver && <div className="plot-drop-hint">Drop field to update graph</div>}
        {rendering && <div className="render-overlay">Rendering with Python…</div>}
        {pythonImage ? (
          <div className="preview-zoom-content" style={{ transform: `scale(${zoom})` }}>
            <div className="raster-figure">
              <img
                className="ggplot-img"
                src={`data:image/png;base64,${pythonImage}`}
                alt={`${label} render`}
                title={activeArtist?.label}
                onMouseMove={!compact && artistRegions.length ? hoverImageArtist : undefined}
                onMouseLeave={() => onHoverArtist?.(null)}
                onClick={!compact && artistRegions.length ? (e) => {
                  const artist = artistAtImage(e);
                  if (artist) onSelectArtist?.(artist.key);
                } : undefined}
                draggable={false}
              />
              {activeArtist && !compact && (
                <svg className="raster-artist-highlight" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
                  {activeArtist.kind === "line" && activeArtist.points.length > 1 && (
                    <polyline points={activeArtist.points.map(([x, y]) => `${x * 1000},${y * 1000}`).join(" ")} />
                  )}
                  {activeArtist.kind === "collection" && activeArtist.points.map(([x, y], index) => (
                    <circle key={index} cx={x * 1000} cy={y * 1000} r="7" />
                  ))}
                  {activeArtist.bbox && activeArtist.kind !== "line" && activeArtist.kind !== "collection" && (
                    <rect x={activeArtist.bbox[0] * 1000} y={activeArtist.bbox[1] * 1000} width={activeArtist.bbox[2] * 1000} height={activeArtist.bbox[3] * 1000} />
                  )}
                </svg>
              )}
            </div>
          </div>
        ) : renderError ? (
          <RenderErrorCard issue={renderError} dataset={dataset} onRetryRender={onRetryRender} onResetCode={onResetCode} patch={patch} />
        ) : (
          <div className="empty-hint">
            <p>No {label} render yet.</p>
            <p className="muted">{label} renders on demand — press <strong>Render with Python</strong>, or keep <strong>Auto</strong> on to render as you edit.</p>
          </div>
        )}
        <GuideOverlay compact={compact} guide={guide} />
        <FloatingToolbar compact={compact} zoom={zoom} setZoom={setZoom} clampZoom={clampZoom} guide={guide} cycleGuide={cycleGuide} copyHighResImage={copyHighResImage} />
        <ToastBanner toast={toast} />
      </div>
    );
  }

  return (
    <div className={`preview-stage ${compact ? "compact" : ""} ${dropOver ? "plot-drop-over" : ""}`} {...graphDropProps} {...previewInteractionProps} onWheel={handlePreviewWheel} onPointerDown={handlePreviewPointerDown} onPointerMove={handlePreviewPointerMove} onPointerUp={handlePreviewPointerEnd} onPointerCancel={handlePreviewPointerEnd}>
      <QuickThemeChips compact={compact} spec={spec} patch={patch} />
      {dropOver && <div className="plot-drop-hint">Drop field to update graph</div>}
      {liveError ? (
        <RenderErrorCard issue={liveError} dataset={dataset} onRetryRender={onRetryRender} onResetCode={onResetCode} patch={patch} />
      ) : (
        <div ref={ref} className="plotly-host" />
      )}
      <GuideOverlay compact={compact} guide={guide} />
      <FloatingToolbar compact={compact} zoom={zoom} setZoom={setZoom} clampZoom={clampZoom} guide={guide} cycleGuide={cycleGuide} copyHighResImage={copyHighResImage} />
      <ToastBanner toast={toast} />
    </div>
  );
}
