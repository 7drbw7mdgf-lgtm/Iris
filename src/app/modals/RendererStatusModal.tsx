import { FriendlyRenderIssue } from "../../types";
import { RendererStatus } from "../../tauri";

export interface RendererStatusModalProps {
  open: boolean;
  onClose: () => void;
  rendererInfo: RendererStatus | null;
  rendererError: string;
  renderError: FriendlyRenderIssue | null;
  rendererBusy: string;
  onRefreshRenderer: () => void;
  onRepair: (which: "python" | "svglite") => void;
}

export function RendererStatusModal({
  open,
  onClose,
  rendererInfo,
  rendererError,
  renderError,
  rendererBusy,
  onRefreshRenderer,
  onRepair,
}: RendererStatusModalProps) {
  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Renderer status"
      onMouseDown={onClose}
    >
      <div className="export-success-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="export-preview-head">
          <div>
            <div className="view-eyebrow">Environment</div>
            <h2>Renderer status</h2>
            <p>Both engines Iris uses to render and export figures.</p>
          </div>
          <button className="icon-mini-btn" onClick={onClose} aria-label="Close renderer status">
            ×
          </button>
        </div>
        {rendererError && <div className="renderer-error-banner">{rendererError}</div>}
        {renderError && (
          <div className="renderer-error-banner render-issue-card">
            <strong>{renderError.kind}</strong>
            <span>{renderError.summary}</span>
            <em>Suggested fix: {renderError.fix}</em>
            <details>
              <summary>Show technical details</summary>
              <pre>{renderError.raw}</pre>
            </details>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <section>
            <strong>R · ggplot2</strong>
            {rendererInfo ? (
              <ul style={{ margin: "6px 0", paddingLeft: 18, lineHeight: 1.6 }}>
                <li>
                  Rscript:{" "}
                  {rendererInfo.r_found ? (
                    <code>{rendererInfo.r_path}</code>
                  ) : (
                    <span className="r-status bad">not found</span>
                  )}
                </li>
                {rendererInfo.r_version && <li>{rendererInfo.r_version}</li>}
                <li>ggplot2: {rendererInfo.r_ggplot2 ? "✓ installed" : "✗ missing (install.packages('ggplot2'))"}</li>
                <li>svglite (SVG export): {rendererInfo.r_svglite ? "✓ installed" : "✗ missing"}</li>
              </ul>
            ) : (
              <p className="muted">{rendererError ? "Unavailable" : "Checking…"}</p>
            )}
            {rendererInfo && !rendererInfo.r_svglite && rendererInfo.r_found && (
              <button
                className="btn"
                disabled={rendererBusy !== ""}
                onClick={() => onRepair("svglite")}
              >
                {rendererBusy === "svglite" ? "Installing svglite…" : "Install svglite"}
              </button>
            )}
          </section>
          <section>
            <strong>Python · matplotlib / seaborn / altair</strong>
            {rendererInfo ? (
              <ul style={{ margin: "6px 0", paddingLeft: 18, lineHeight: 1.6 }}>
                <li>
                  Environment:{" "}
                  {rendererInfo.python_found ? (
                    <code>{rendererInfo.python_path}</code>
                  ) : (
                    <span className="r-status bad">not built yet</span>
                  )}
                </li>
                {rendererInfo.python_version && <li>Python {rendererInfo.python_version}</li>}
                <li>
                  Packages:{" "}
                  {rendererInfo.python_ready
                    ? "✓ all present"
                    : rendererInfo.python_missing.length
                    ? `✗ missing ${rendererInfo.python_missing.join(", ")}`
                    : "not checked"}
                </li>
              </ul>
            ) : (
              <p className="muted">{rendererError ? "Unavailable" : "Checking…"}</p>
            )}
            {rendererInfo && !rendererInfo.python_ready && (
              <button
                className="btn"
                disabled={rendererBusy !== ""}
                onClick={() => onRepair("python")}
              >
                {rendererBusy === "python"
                  ? "Building environment… (first run downloads packages)"
                  : rendererInfo.python_found
                  ? "Repair environment"
                  : "Build environment"}
              </button>
            )}
          </section>
        </div>
        <div className="export-success-actions" style={{ marginTop: 14 }}>
          <button className="btn" disabled={rendererBusy !== ""} onClick={onRefreshRenderer}>
            Re-check
          </button>
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
