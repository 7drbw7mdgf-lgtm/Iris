import { ACCENT_PRESETS, type UserSettings } from "../../types";

export function AppearanceTab({
  settings,
  onSaveSettings,
}: {
  settings: UserSettings;
  onSaveSettings: (patch: Partial<UserSettings>) => void;
}) {
  return (
    <div className="settings-view-panel">
      {/* Theme Mode */}
      <div className="settings-card">
        <div className="settings-card-title">
          <h3>Interface Theme</h3>
          <p>Choose the visual style of the application workspace</p>
        </div>
        <div className="theme-picker-grid">
          <button
            type="button"
            className={`theme-card ${settings.shellTheme === "light" ? "active" : ""}`}
            onClick={() => onSaveSettings({ shellTheme: "light" })}
          >
            <div className="theme-card-preview light">
              <div className="preview-topbar" />
              <div className="preview-content">
                <div className="preview-rail" />
                <div className="preview-plot" />
              </div>
            </div>
            <div className="theme-card-label">
              <strong>Light</strong>
              <span>High contrast crisp studio</span>
            </div>
          </button>

          <button
            type="button"
            className={`theme-card ${settings.shellTheme === "dark" ? "active" : ""}`}
            onClick={() => onSaveSettings({ shellTheme: "dark" })}
          >
            <div className="theme-card-preview dark">
              <div className="preview-topbar" />
              <div className="preview-content">
                <div className="preview-rail" />
                <div className="preview-plot" />
              </div>
            </div>
            <div className="theme-card-label">
              <strong>Dark Lab</strong>
              <span>Low eye-strain dark mode</span>
            </div>
          </button>

          <button
            type="button"
            className={`theme-card ${settings.shellTheme === "system" ? "active" : ""}`}
            onClick={() => onSaveSettings({ shellTheme: "system" })}
          >
            <div className="theme-card-preview system">
              <div className="preview-half light" />
              <div className="preview-half dark" />
            </div>
            <div className="theme-card-label">
              <strong>System</strong>
              <span>Sync with macOS settings</span>
            </div>
          </button>
        </div>
      </div>

      {/* Accent Color */}
      <div className="settings-card">
        <div className="settings-card-title">
          <h3>Accent Highlight Color</h3>
          <p>Primary color used for active tabs, selected states, and focus rings</p>
        </div>
        <div className="accent-picker-wrap">
          <div className="accent-grid">
            {ACCENT_PRESETS.map((preset) => {
              const isSelected = settings.accentColor.toLowerCase() === preset.color.toLowerCase();
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`accent-item ${isSelected ? "selected" : ""}`}
                  onClick={() => onSaveSettings({ accentColor: preset.color })}
                  title={preset.label}
                >
                  <span className="accent-circle" style={{ backgroundColor: preset.color }}>
                    {isSelected && <span className="accent-check">✓</span>}
                  </span>
                  <span className="accent-name">{preset.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
          <div className="custom-color-control">
            <span className="custom-color-label">Custom Hex:</span>
            <div className="custom-color-input-wrap">
              <input
                type="color"
                className="custom-color-swatch"
                value={settings.accentColor}
                onChange={(e) => onSaveSettings({ accentColor: e.target.value })}
                title="Pick custom color"
              />
              <input
                type="text"
                className="custom-color-text"
                value={settings.accentColor.toUpperCase()}
                onChange={(e) => onSaveSettings({ accentColor: e.target.value })}
                maxLength={7}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Paper Canvas & Contrast */}
      <div className="settings-card">
        <div className="settings-card-title">
          <h3>Scientific Paper Canvas Frame</h3>
          <p>Display figure on a pure white presentation sheet with elevation shadow</p>
        </div>

        <div className="settings-toggle-row">
          <div className="toggle-info">
            <strong>Enable Paper Canvas Desk</strong>
            <span>Isolates the scientific plot on an explicit paper surface to preview margins and bleed</span>
          </div>
          <label className="ios-toggle">
            <input
              type="checkbox"
              checked={settings.paperCanvas}
              onChange={(e) => onSaveSettings({ paperCanvas: e.target.checked })}
            />
            <span className="ios-toggle-slider" />
          </label>
        </div>

        {settings.paperCanvas && (
          <div className="settings-sub-options">
            <div className="settings-sub-row">
              <span className="sub-label">Paper Surface Tone:</span>
              <div className="seg mini">
                <button
                  type="button"
                  className={`seg-btn ${(settings.paperCanvasTone || "white") === "white" ? "active" : ""}`}
                  onClick={() => onSaveSettings({ paperCanvasTone: "white" })}
                >
                  Pure White
                </button>
                <button
                  type="button"
                  className={`seg-btn ${settings.paperCanvasTone === "warm" ? "active" : ""}`}
                  onClick={() => onSaveSettings({ paperCanvasTone: "warm" })}
                >
                  Warm Ivory
                </button>
                <button
                  type="button"
                  className={`seg-btn ${settings.paperCanvasTone === "cool" ? "active" : ""}`}
                  onClick={() => onSaveSettings({ paperCanvasTone: "cool" })}
                >
                  Cool Slate
                </button>
              </div>
            </div>

            <div className="settings-sub-row">
              <span className="sub-label">Shadow Elevation:</span>
              <div className="seg mini">
                <button
                  type="button"
                  className={`seg-btn ${(settings.canvasShadow || "soft") === "soft" ? "active" : ""}`}
                  onClick={() => onSaveSettings({ canvasShadow: "soft" })}
                >
                  Soft
                </button>
                <button
                  type="button"
                  className={`seg-btn ${settings.canvasShadow === "crisp" ? "active" : ""}`}
                  onClick={() => onSaveSettings({ canvasShadow: "crisp" })}
                >
                  Crisp
                </button>
                <button
                  type="button"
                  className={`seg-btn ${settings.canvasShadow === "none" ? "active" : ""}`}
                  onClick={() => onSaveSettings({ canvasShadow: "none" })}
                >
                  Flat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* UI Density */}
      <div className="settings-card">
        <div className="settings-card-title">
          <h3>Interface Density</h3>
          <p>Adjust padding, shelf size, and inspector line-height</p>
        </div>
        <div className="seg">
          <button
            className={`seg-btn ${settings.uiDensity === "comfortable" ? "active" : ""}`}
            type="button"
            onClick={() => onSaveSettings({ uiDensity: "comfortable" })}
          >
            Comfortable (Standard)
          </button>
          <button
            className={`seg-btn ${settings.uiDensity === "compact" ? "active" : ""}`}
            type="button"
            onClick={() => onSaveSettings({ uiDensity: "compact" })}
          >
            Compact (High Data Density)
          </button>
        </div>
      </div>
    </div>
  );
}
