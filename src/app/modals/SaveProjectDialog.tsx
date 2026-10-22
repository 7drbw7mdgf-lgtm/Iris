import { Dataset } from "../../types";
import { WorkspaceTab, GraphState, DashboardItem } from "../types";
import { safeFileName } from "../exportUtils";

export interface SaveProjectDialogProps {
  open: boolean;
  onClose: () => void;
  dataset: Dataset;
  workspaceTabs: WorkspaceTab[];
  graphStates: Record<string, GraphState>;
  dashboardItems: DashboardItem[];
  onConfirmSave: () => void;
}

export function SaveProjectDialog({
  open,
  onClose,
  dataset,
  workspaceTabs,
  graphStates,
  dashboardItems,
  onConfirmSave,
}: SaveProjectDialogProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Save Iris project">
      <div className="save-project-modal">
        <div className="export-preview-head">
          <div>
            <div className="view-eyebrow">Iris Project</div>
            <h2>Save workspace</h2>
            <p>{safeFileName(dataset.name || "iris_project", "iris_project")}.is</p>
          </div>
          <button className="icon-mini-btn" onClick={onClose} aria-label="Close save project dialog">
            ×
          </button>
        </div>
        <div className="save-project-summary">
          <div>
            <strong>{workspaceTabs.length}</strong>
            <span>sheets</span>
          </div>
          <div>
            <strong>{Object.keys(graphStates).length}</strong>
            <span>graphs</span>
          </div>
          <div>
            <strong>{dashboardItems.length}</strong>
            <span>dashboard items</span>
          </div>
          <div>
            <strong>{dataset.rows.length}</strong>
            <span>rows</span>
          </div>
        </div>
        <p className="save-project-note">
          Saves the current tables, figures, dashboard layout, collections, filters, and export settings as a portable `.is` file.
        </p>
        <div className="export-preview-actions">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={onConfirmSave}>
            Choose Location...
          </button>
        </div>
      </div>
    </div>
  );
}
