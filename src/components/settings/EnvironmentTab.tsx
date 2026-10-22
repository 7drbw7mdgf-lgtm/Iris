import { useState } from "react";
import type { RendererStatus } from "../../tauri";
import { type UserSettings } from "../../types";

export function EnvironmentTab({
  settings,
  rendererInfo,
  onRefreshRenderer,
  onRepairPython,
  onInstallSvglite,
  rendererBusy = "",
}: {
  settings: UserSettings;
  rendererInfo?: RendererStatus | null;
  onRefreshRenderer?: () => void;
  onRepairPython?: () => void;
  onInstallSvglite?: () => void;
  rendererBusy?: string;
}) {
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleCopyDiagnostics = () => {
    const report = [
      `### Iris System Diagnostics Report (v5.2.0)`,
      `- **OS**: macOS / Apple Silicon`,
      `- **UI Theme**: ${settings.shellTheme} (Accent: ${settings.accentColor})`,
      `- **Paper Canvas**: ${settings.paperCanvas ? "Enabled" : "Disabled"} (Tone: ${settings.paperCanvasTone || "white"})`,
      `- **Default Dimensions**: ${settings.defaultWidth}" × ${settings.defaultHeight}" @ ${settings.defaultDpi} DPI`,
      `- **R Detected**: ${rendererInfo?.r_found ? `Yes (${rendererInfo.r_version || "unknown"})` : "No"}`,
      `- **R Path**: ${rendererInfo?.r_path || "None"}`,
      `- **R ggplot2**: ${rendererInfo?.r_ggplot2 ? "Installed" : "Missing"}`,
      `- **R svglite**: ${rendererInfo?.r_svglite ? "Installed" : "Missing"}`,
      `- **Python Ready**: ${rendererInfo?.python_ready ? `Yes (${rendererInfo.python_version || "unknown"})` : "No"}`,
      `- **Python Path**: ${rendererInfo?.python_path || "Default managed venv"}`,
      `- **Missing Packages**: ${rendererInfo?.python_missing?.length ? rendererInfo.python_missing.join(", ") : "None"}`,
    ].join("\n");

    navigator.clipboard.writeText(report);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2200);
  };

  return (
    <div className="settings-view-panel">
      {/* R Stack Card */}
      <div className="env-status-card-modern">
        <div className="env-card-head">
          <div className="env-title-group">
            <span className="env-logo r-logo">R</span>
            <div>
              <strong>R (ggplot2) Scientific Engine</strong>
              <span className="env-subtitle">Core grammar of graphics compilation</span>
            </div>
          </div>
          <span className={`env-badge ${rendererInfo?.r_found ? "ok" : "bad"}`}>
            {rendererInfo?.r_found ? "Detected & Active" : "Missing / Not Found"}
          </span>
        </div>
        <div className="env-details-grid">
          <div className="env-detail-cell">
            <span className="cell-label">Binary Path</span>
            <code>{rendererInfo?.r_path || "Not detected in system PATH"}</code>
          </div>
          <div className="env-detail-cell">
            <span className="cell-label">R Version</span>
            <span>{rendererInfo?.r_version || "—"}</span>
          </div>
          <div className="env-detail-cell">
            <span className="cell-label">ggplot2 Package</span>
            <span className={rendererInfo?.r_ggplot2 ? "pkg-ok" : "pkg-bad"}>
              {rendererInfo?.r_ggplot2 ? "✓ Ready" : "✗ Missing"}
            </span>
          </div>
          <div className="env-detail-cell">
            <span className="cell-label">svglite (Vector Export)</span>
            <span className={rendererInfo?.r_svglite ? "pkg-ok" : "pkg-bad"}>
              {rendererInfo?.r_svglite ? "✓ Ready" : "✗ Missing"}
            </span>
          </div>
        </div>
        {!rendererInfo?.r_svglite && onInstallSvglite && (
          <div className="env-card-action-bar">
            <button className="btn small primary" type="button" onClick={onInstallSvglite} disabled={rendererBusy !== ""}>
              {rendererBusy === "r-svglite" ? "Installing svglite..." : "Install svglite for Vector Graphics"}
            </button>
          </div>
        )}
      </div>

      {/* Python Stack Card */}
      <div className="env-status-card-modern">
        <div className="env-card-head">
          <div className="env-title-group">
            <span className="env-logo py-logo">Py</span>
            <div>
              <strong>Python Scientific Stack</strong>
              <span className="env-subtitle">Matplotlib, Seaborn, Altair &amp; interactive artists</span>
            </div>
          </div>
          <span className={`env-badge ${rendererInfo?.python_ready ? "ok" : "bad"}`}>
            {rendererInfo?.python_ready ? "Ready" : "Needs Setup"}
          </span>
        </div>
        <div className="env-details-grid">
          <div className="env-detail-cell">
            <span className="cell-label">Virtualenv Path</span>
            <code>{rendererInfo?.python_path || "Managed Iris environment"}</code>
          </div>
          <div className="env-detail-cell">
            <span className="cell-label">Python Version</span>
            <span>{rendererInfo?.python_version || "—"}</span>
          </div>
          <div className="env-detail-cell full">
            <span className="cell-label">Package Verification</span>
            {rendererInfo?.python_missing && rendererInfo.python_missing.length > 0 ? (
              <span className="pkg-bad">Missing: {rendererInfo.python_missing.join(", ")}</span>
            ) : (
              <span className="pkg-ok">✓ matplotlib, seaborn, altair, pandas &amp; numpy ready</span>
            )}
          </div>
        </div>
        {onRepairPython && (
          <div className="env-card-action-bar">
            <button className="btn small" type="button" onClick={onRepairPython} disabled={rendererBusy !== ""}>
              {rendererBusy === "python" ? "Rebuilding Environment..." : "Repair / Rebuild Python Virtualenv"}
            </button>
          </div>
        )}
      </div>

      {/* Local Host Web Server Card */}
      <div className="env-status-card-modern">
        <div className="env-card-head">
          <div className="env-title-group">
            <span className="env-logo" style={{ background: "#3b82f6", color: "#fff", fontWeight: 700 }}>LH</span>
            <div>
              <strong>Local Host Web Server</strong>
              <span className="env-subtitle">Embedded HTTP service for browser access and REST APIs</span>
            </div>
          </div>
          <span className="env-badge ok">✓ Active &amp; Listening</span>
        </div>
        <div className="env-details-grid">
          <div className="env-detail-cell">
            <span className="cell-label">Localhost URL</span>
            <code>http://127.0.0.1:4180</code>
          </div>
          <div className="env-detail-cell">
            <span className="cell-label">REST API</span>
            <span><code>/api/status</code>, <code>/api/health</code></span>
          </div>
          <div className="env-detail-cell full">
            <span className="cell-label">External Integration</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Access Iris from any web browser (Safari, Chrome) or connect external computational notebooks via loopback.
            </span>
          </div>
        </div>
        <div className="env-card-action-bar" style={{ display: "flex", gap: 8 }}>
          <button
            className="btn small primary"
            type="button"
            onClick={() => window.open("http://127.0.0.1:4180", "_blank")}
          >
            Open in Web Browser
          </button>
          <button
            className="btn small"
            type="button"
            onClick={() => {
              navigator.clipboard.writeText("http://127.0.0.1:4180");
            }}
          >
            Copy Localhost URL
          </button>
        </div>
      </div>

      {/* Refresh & Diagnostics */}
      <div className="env-footer-actions">
        <button
          className="btn small"
          type="button"
          onClick={handleCopyDiagnostics}
          title="Copy formatted diagnostic report to clipboard"
        >
          {copyFeedback ? "✓ Diagnostics Copied!" : "📋 Copy Diagnostics Report"}
        </button>
        <button
          className="btn small primary"
          type="button"
          onClick={onRefreshRenderer}
          disabled={rendererBusy !== ""}
        >
          Re-check System Environments
        </button>
      </div>
    </div>
  );
}
