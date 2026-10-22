import React from "react";
import { Dataset } from "../../types";
import { DashboardExportDialogState, DashboardExportFormat, CLOSED_DASHBOARD_EXPORT_DIALOG } from "../types";

export interface DashboardExportModalProps {
  dashboardExportDialog: DashboardExportDialogState;
  setDashboardExportDialog: React.Dispatch<React.SetStateAction<DashboardExportDialogState>>;
  dataset: Dataset;
  onClose?: () => void;
  onBeginSelection: () => void;
  onRenderPreview: (settings: DashboardExportDialogState) => void;
  onConfirmExport: () => void;
}

export function DashboardExportModal({
  dashboardExportDialog,
  setDashboardExportDialog,
  dataset,
  onClose = () => setDashboardExportDialog(CLOSED_DASHBOARD_EXPORT_DIALOG),
  onBeginSelection,
  onRenderPreview,
  onConfirmExport,
}: DashboardExportModalProps) {
  if (!dashboardExportDialog.open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Dashboard export preview">
      <div className="export-preview-modal">
        <div className="export-preview-head">
          <div>
            <div className="view-eyebrow">Dashboard Export</div>
            <h2>{dataset.name || "Dashboard area"}</h2>
            <p>
              {dashboardExportDialog.rect
                ? `${Math.round(dashboardExportDialog.rect.w)} × ${Math.round(dashboardExportDialog.rect.h)} px selected`
                : "No area selected"}
            </p>
          </div>
          <button className="icon-mini-btn" onClick={onClose} aria-label="Close dashboard export preview">
            ×
          </button>
        </div>
        <div className="export-preview-body">
          <div className="export-preview-canvas">
            {dashboardExportDialog.busy && <div className="render-overlay">Rendering dashboard preview...</div>}
            {!dashboardExportDialog.busy && dashboardExportDialog.error && (
              <div className="export-error">{dashboardExportDialog.error}</div>
            )}
            {!dashboardExportDialog.busy && dashboardExportDialog.previewData && (
              <img
                className="export-preview-image"
                src={`data:image/png;base64,${dashboardExportDialog.previewData}`}
                alt="Dashboard export preview"
              />
            )}
          </div>
          <aside className="export-preview-options">
            <label className="tk-field">
              <span>Format</span>
              <select
                value={dashboardExportDialog.format}
                onChange={(e) =>
                  setDashboardExportDialog((d) => ({
                    ...d,
                    format: e.target.value as DashboardExportFormat,
                  }))
                }
              >
                <option value="pdf">PDF</option>
                <option value="png">PNG</option>
              </select>
            </label>
            <div className="export-preview-note">
              Drag a fresh area from the dashboard to crop differently. PDF uses the same selected area shown in this preview.
            </div>
          </aside>
        </div>
        <div className="export-preview-actions">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" disabled={dashboardExportDialog.busy} onClick={onBeginSelection}>
            Select different area
          </button>
          <button
            className="btn"
            disabled={dashboardExportDialog.busy}
            onClick={() => onRenderPreview(dashboardExportDialog)}
          >
            Re-render Preview
          </button>
          <button
            className="btn primary"
            disabled={dashboardExportDialog.busy || !dashboardExportDialog.previewData || !!dashboardExportDialog.error}
            onClick={onConfirmExport}
          >
            Confirm & Export
          </button>
        </div>
      </div>
    </div>
  );
}
