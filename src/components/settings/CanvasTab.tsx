import { type UserSettings } from "../../types";

export const DIMENSION_PRESETS = [
  { label: "Nature (89 mm)", width: 3.5, height: 3.5, note: "Standard 1-column journal figure" },
  { label: "Cell (120 mm)", width: 4.72, height: 3.8, note: "Intermediate 1.5-column figure" },
  { label: "Science (183 mm)", width: 7.2, height: 4.8, note: "Full page-width 2-column spread" },
  { label: "16:9 Presentation", width: 10.0, height: 5.625, note: "High-definition slide deck format" },
  { label: "A4 Landscape", width: 8.27, height: 5.83, note: "Standard report document layout" },
  { label: "Square (6\" × 6\")", width: 6.0, height: 6.0, note: "Balanced square matrix or heatmap" },
];

export function CanvasTab({
  settings,
  onSaveSettings,
}: {
  settings: UserSettings;
  onSaveSettings: (patch: Partial<UserSettings>) => void;
}) {
  return (
    <div className="settings-view-panel">
      {/* Default Dimensions */}
      <div className="settings-card">
        <div className="settings-card-title">
          <h3>Default Figure Dimensions</h3>
          <p>Standard aspect ratio and dimensions for new plots (inches)</p>
        </div>

        <div className="dim-presets-row">
          <span className="dim-presets-label">Journal Presets:</span>
          <div className="dim-chips">
            {DIMENSION_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className={`dim-chip ${settings.defaultWidth === p.width && settings.defaultHeight === p.height ? "active" : ""}`}
                onClick={() => onSaveSettings({ defaultWidth: p.width, defaultHeight: p.height })}
                title={p.note}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="dim-custom-inputs">
          <div className="dim-input-group">
            <label htmlFor="dim-width">Width (in):</label>
            <input
              id="dim-width"
              type="number"
              step="0.1"
              min="1.5"
              max="30"
              value={settings.defaultWidth}
              onChange={(e) => onSaveSettings({ defaultWidth: parseFloat(e.target.value) || 7 })}
            />
          </div>
          <span className="dim-multiply">×</span>
          <div className="dim-input-group">
            <label htmlFor="dim-height">Height (in):</label>
            <input
              id="dim-height"
              type="number"
              step="0.1"
              min="1.5"
              max="30"
              value={settings.defaultHeight}
              onChange={(e) => onSaveSettings({ defaultHeight: parseFloat(e.target.value) || 5 })}
            />
          </div>
          <div className="dim-ratio-pill">
            Aspect Ratio: {(settings.defaultWidth / settings.defaultHeight).toFixed(2)}:1
          </div>
        </div>
      </div>

      {/* Publication Export Defaults */}
      <div className="settings-card">
        <div className="settings-card-title">
          <h3>Export Resolution &amp; Format</h3>
          <p>Default format and pixel density when exporting publication figures</p>
        </div>

        <div className="settings-form-row">
          <div className="form-item">
            <label htmlFor="export-dpi">Default Export DPI:</label>
            <select
              id="export-dpi"
              value={settings.defaultDpi}
              onChange={(e) => onSaveSettings({ defaultDpi: parseInt(e.target.value, 10) || 300 })}
            >
              <option value={72}>72 DPI — Screen preview</option>
              <option value={150}>150 DPI — Presentations &amp; draft review</option>
              <option value={300}>300 DPI — Nature / Science print standard</option>
              <option value={600}>600 DPI — Ultra high-resolution line art</option>
            </select>
          </div>

          <div className="form-item">
            <label htmlFor="export-format">Default Vector Format:</label>
            <select
              id="export-format"
              value={settings.defaultExportFormat}
              onChange={(e) => onSaveSettings({ defaultExportFormat: e.target.value as "svg" | "png" | "pdf" })}
            >
              <option value="svg">SVG (Scalable Vector Graphics for Illustrator)</option>
              <option value="pdf">PDF (Print Vector Document)</option>
              <option value="png">PNG (Lossless Raster Image)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Themes & Palettes Defaults */}
      <div className="settings-card">
        <div className="settings-card-title">
          <h3>Default Scientific Styling</h3>
          <p>Starting visual theme and palette applied when creating a new graph</p>
        </div>

        <div className="settings-form-row">
          <div className="form-item">
            <label htmlFor="default-theme">Default Theme:</label>
            <select
              id="default-theme"
              value={settings.defaultPublicationTheme || "classic"}
              onChange={(e) => onSaveSettings({ defaultPublicationTheme: e.target.value as any })}
            >
              <option value="classic">Classic (Nature / Prism standard)</option>
              <option value="minimal">Minimal (Clean uncluttered grid)</option>
              <option value="bw">Black &amp; White (Monochrome print)</option>
              <option value="dark">Dark Lab (High contrast)</option>
              <option value="prism">Prism (GraphPad standard)</option>
            </select>
          </div>

          <div className="form-item">
            <label htmlFor="default-palette">Default Palette:</label>
            <select
              id="default-palette"
              value={settings.defaultPalette || "prism"}
              onChange={(e) => onSaveSettings({ defaultPalette: e.target.value as any })}
            >
              <option value="prism">Prism Primary</option>
              <option value="set1">Set 1 (ColorBrewer publication)</option>
              <option value="viridis">Viridis (Colorblind safe)</option>
              <option value="pastel">Pastel Subtle</option>
              <option value="grayscale">Grayscale Tones</option>
            </select>
          </div>
        </div>
      </div>

      {/* Workflow Behaviors */}
      <div className="settings-card">
        <div className="settings-card-title">
          <h3>Interactive Workflow Behaviors</h3>
          <p>Configure automatic execution and navigation memory</p>
        </div>

        <div className="settings-toggle-row">
          <div className="toggle-info">
            <strong>Auto-render on Field Drop</strong>
            <span>Immediately re-calculate and render figure when dragging columns onto axis shelves</span>
          </div>
          <label className="ios-toggle">
            <input
              type="checkbox"
              checked={settings.autoRenderOnFieldDrop ?? true}
              onChange={(e) => onSaveSettings({ autoRenderOnFieldDrop: e.target.checked })}
            />
            <span className="ios-toggle-slider" />
          </label>
        </div>

        <div className="settings-toggle-row">
          <div className="toggle-info">
            <strong>Inspector Accordion Scroll Memory</strong>
            <span>Preserve the exact accordion scroll position when switching between artist and inspector tabs</span>
          </div>
          <label className="ios-toggle">
            <input
              type="checkbox"
              checked={settings.inspectorScrollMemory ?? true}
              onChange={(e) => onSaveSettings({ inspectorScrollMemory: e.target.checked })}
            />
            <span className="ios-toggle-slider" />
          </label>
        </div>
      </div>
    </div>
  );
}
