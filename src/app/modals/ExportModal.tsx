import React, { useState } from "react";
import { Dataset } from "../../types";
import { ExportDialogState, GraphState, ExportFormat, CLOSED_EXPORT_DIALOG } from "../types";
import { graphLibraryLabel } from "../graphMetaUtils";
import { JOURNAL_EXPORT_PRESETS, findPreset } from "../exportPresets";

export interface ExportModalProps {
  exportDialog: ExportDialogState;
  setExportDialog: React.Dispatch<React.SetStateAction<ExportDialogState>>;
  activeGraph: GraphState;
  dataset: Dataset;
  isPlotlyLibrary: boolean;
  onClose?: () => void;
  onRenderPreview: (settings: ExportDialogState) => void;
  onConfirmExport: () => void;
}

export function ExportModal({
  exportDialog,
  setExportDialog,
  activeGraph,
  dataset,
  isPlotlyLibrary,
  onClose = () => setExportDialog(CLOSED_EXPORT_DIALOG),
  onRenderPreview,
  onConfirmExport,
}: ExportModalProps) {
  const [selectedPresetId, setSelectedPresetId] = useState("custom");
  if (!exportDialog.open) return null;

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = findPreset(presetId);
    if (!preset) return;
    setExportDialog((d) => ({
      ...d,
      width: preset.widthIn,
      height: preset.heightIn,
      dpi: preset.dpi,
      previewData: "",
      error: "",
    }));
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Export preview">
      <div className="export-preview-modal">
        <div className="export-preview-head">
          <div>
            <div className="view-eyebrow">Export Preview</div>
            <h2>{activeGraph.spec.title || activeGraph.loadedRScriptName || dataset.name || "Figure"}</h2>
            <p>
              {graphLibraryLabel(activeGraph.graphLibrary)} · {exportDialog.width} × {exportDialog.height} in ·{" "}
              {exportDialog.dpi} DPI
            </p>
          </div>
          <button className="icon-mini-btn" onClick={onClose} aria-label="Close export preview">
            ×
          </button>
        </div>
        <div className="export-preview-body">
          <div className="export-preview-canvas">
            {exportDialog.busy && <div className="render-overlay">Rendering export preview...</div>}
            {!exportDialog.busy && exportDialog.error && <div className="export-error">{exportDialog.error}</div>}
            {!exportDialog.busy && exportDialog.previewData && (
              <img
                className="export-preview-image"
                src={`data:image/${exportDialog.previewFormat === "svg" ? "svg+xml" : "png"};base64,${exportDialog.previewData}`}
                alt="Export preview"
              />
            )}
            {!exportDialog.busy && !exportDialog.previewData && !exportDialog.error && (
              <div className="empty-hint">
                <p>No preview yet.</p>
              </div>
            )}
          </div>
          <aside className="export-preview-options">
            <label className="tk-field">
              <span>Journal Publication Preset</span>
              <select
                value={selectedPresetId}
                onChange={(e) => handlePresetChange(e.target.value)}
                title="Select a target scientific journal standard for automatic column widths"
              >
                {JOURNAL_EXPORT_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="tk-field">
              <span>Format</span>
              <select
                value={exportDialog.format}
                onChange={(e) => {
                  const format = e.target.value as ExportFormat;
                  setExportDialog((d) => ({ ...d, format, previewData: "", error: "" }));
                }}
              >
                <option value="png">PNG</option>
                <option value="svg">SVG</option>
                <option value="pdf" disabled={isPlotlyLibrary}>
                  PDF
                </option>
              </select>
            </label>
            <div className="dual">
              <label className="tk-field">
                <span>Width (in)</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  step={0.25}
                  value={exportDialog.width}
                  onChange={(e) =>
                    setExportDialog((d) => ({
                      ...d,
                      width: Number(e.target.value) || d.width,
                      previewData: "",
                      error: "",
                    }))
                  }
                />
              </label>
              <label className="tk-field">
                <span>Height (in)</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  step={0.25}
                  value={exportDialog.height}
                  onChange={(e) =>
                    setExportDialog((d) => ({
                      ...d,
                      height: Number(e.target.value) || d.height,
                      previewData: "",
                      error: "",
                    }))
                  }
                />
              </label>
            </div>
            <label className="tk-field">
              <span>DPI</span>
              <input
                type="number"
                min={72}
                max={1200}
                step={1}
                value={exportDialog.dpi}
                onChange={(e) =>
                  setExportDialog((d) => ({
                    ...d,
                    dpi: Number(e.target.value) || d.dpi,
                    previewData: "",
                    error: "",
                  }))
                }
              />
            </label>
            <div className="export-preview-note">
              {exportDialog.format === "pdf"
                ? "PDF exports render a PNG preview first, then save the final PDF after confirmation."
                : "This preview is generated with the same renderer and dimensions used for export."}
            </div>
          </aside>
        </div>
        <div className="export-preview-actions">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" disabled={exportDialog.busy} onClick={() => onRenderPreview(exportDialog)}>
            Re-render Preview
          </button>
          <button
            className="btn primary"
            disabled={exportDialog.busy || !exportDialog.previewData || !!exportDialog.error}
            onClick={onConfirmExport}
          >
            Confirm & Export
          </button>
        </div>
      </div>
    </div>
  );
}
