import { Dataset, PlotSpec, type FriendlyRenderIssue } from "../../types";

export const THEME_PRESETS: { id: string; label: string; theme: PlotSpec["theme"]; palette: PlotSpec["palette"]; font: string }[] = [
  { id: "nature", label: "Nature", theme: "classic", palette: "prism", font: "Helvetica" },
  { id: "science", label: "Science", theme: "minimal", palette: "set1", font: "Arial" },
  { id: "cell", label: "Cell", theme: "prism", palette: "viridis", font: "Inter" },
  { id: "dark", label: "Dark Lab", theme: "dark", palette: "pastel", font: "Courier New" },
];

export function RenderErrorCard({
  issue,
  dataset,
  onRetryRender,
  onResetCode,
  patch,
}: {
  issue: FriendlyRenderIssue | string;
  dataset: Dataset;
  onRetryRender?: () => void;
  onResetCode?: () => void;
  patch: (p: Partial<PlotSpec>) => void;
}) {
  const isObj = typeof issue === "object" && issue !== null;
  const kind = isObj ? issue.kind : "Chart Rendering Error";
  const summary = isObj ? issue.summary : String(issue);
  const fix = isObj ? issue.fix : "Check variable mappings or column values in spreadsheet";
  const raw = isObj ? issue.raw : "";

  return (
    <div className="plot-render-error-card" role="alert">
      <div className="error-card-head">
        <span className="error-icon">⚠️</span>
        <div className="error-titles">
          <strong>{kind}</strong>
          <span>{summary}</span>
        </div>
      </div>
      {fix && (
        <div className="error-card-fix">
          <strong>Suggested fix:</strong> <span>{fix}</span>
        </div>
      )}
      {raw && (
        <details className="error-card-raw">
          <summary>Technical Details & Traceback</summary>
          <pre>{raw}</pre>
        </details>
      )}
      <div className="error-card-actions">
        {onRetryRender && (
          <button type="button" className="btn small primary" onClick={onRetryRender}>
            Retry Render
          </button>
        )}
        {onResetCode && (
          <button type="button" className="btn small" onClick={onResetCode}>
            Reset Script
          </button>
        )}
        <button
          type="button"
          className="btn small"
          onClick={() => patch({ xVar: dataset.columns[0] || "", yVar: dataset.columns[1] || "" })}
        >
          Reset Column Shelves
        </button>
      </div>
    </div>
  );
}

export function FloatingToolbar({
  compact,
  zoom,
  setZoom,
  clampZoom,
  guide,
  cycleGuide,
  copyHighResImage,
}: {
  compact?: boolean;
  zoom: number;
  setZoom: (val: number | ((z: number) => number)) => void;
  clampZoom: (z: number) => number;
  guide: "none" | "single" | "oneandhalf" | "double" | "slide";
  cycleGuide: () => void;
  copyHighResImage: () => void;
}) {
  if (compact) return null;
  const guideLabel =
    guide === "single" ? "89 mm (1-col)" :
    guide === "oneandhalf" ? "120 mm (1.5-col)" :
    guide === "double" ? "183 mm (2-col)" :
    guide === "slide" ? "16:9 (Slide)" : "Guides";

  return (
    <div className="canvas-floating-toolbar" role="toolbar" aria-label="Canvas controls">
      <div className="toolbar-zoom-group">
        <button type="button" onClick={() => setZoom(clampZoom(zoom - 0.15))} title="Zoom out" aria-label="Zoom out">−</button>
        <button type="button" className="zoom-reset-btn" onClick={() => setZoom(1)} title="Reset zoom to 100%">
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" onClick={() => setZoom(clampZoom(zoom + 0.15))} title="Zoom in" aria-label="Zoom in">+</button>
      </div>
      <div className="toolbar-divider" />
      <button
        type="button"
        className={`toolbar-btn ${guide !== "none" ? "active" : ""}`}
        onClick={cycleGuide}
        title="Cycle print column guides (89mm, 120mm, 183mm, 16:9)"
      >
        <span className="btn-icon">📐</span> {guideLabel}
      </button>
      <div className="toolbar-divider" />
      <button
        type="button"
        className="toolbar-btn copy-btn"
        onClick={copyHighResImage}
        title="Copy 300 DPI high-resolution image to clipboard"
      >
        <span className="btn-icon">📋</span> Copy 300 DPI
      </button>
    </div>
  );
}

export function GuideOverlay({ compact, guide }: { compact?: boolean; guide: string }) {
  if (compact || guide === "none") return null;
  return (
    <div className={`canvas-guide-overlay canvas-guide-${guide}`} aria-hidden="true">
      <span className="guide-dimension-tag">
        {guide === "single" ? "Single Column · 89 mm" :
         guide === "oneandhalf" ? "1.5 Column · 120 mm" :
         guide === "double" ? "Double Column · 183 mm" : "Presentation · 16:9"}
      </span>
    </div>
  );
}

export function QuickThemeChips({
  compact,
  spec,
  patch,
}: {
  compact?: boolean;
  spec: PlotSpec;
  patch: (p: Partial<PlotSpec>) => void;
}) {
  if (compact) return null;
  return (
    <div className="quick-theme-chips" aria-label="Quick publication themes">
      <span className="chips-label">Presets</span>
      {THEME_PRESETS.map((p) => {
        const isActive = spec.theme === p.theme && spec.palette === p.palette;
        return (
          <button
            key={p.id}
            type="button"
            className={`theme-chip ${isActive ? "active" : ""}`}
            onClick={() => patch({ theme: p.theme, palette: p.palette, fontFamily: p.font })}
            title={`Apply ${p.label} publication style`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

export function ToastBanner({ toast }: { toast: string | null }) {
  if (!toast) return null;
  return (
    <div className="canvas-toast-banner" role="status">
      <span className="toast-icon">✓</span> {toast}
    </div>
  );
}
