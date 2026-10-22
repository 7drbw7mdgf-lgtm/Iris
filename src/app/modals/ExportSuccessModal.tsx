import { ExportSuccessState } from "../types";

export interface ExportSuccessModalProps {
  exportSuccess: ExportSuccessState;
  onClose: () => void;
  onOpenFolder: () => void;
  notify: (msg: string) => void;
}

export function ExportSuccessModal({
  exportSuccess,
  onClose,
  onOpenFolder,
  notify,
}: ExportSuccessModalProps) {
  if (!exportSuccess.open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Export saved">
      <div className="export-success-modal">
        <div className="export-preview-head">
          <div>
            <div className="view-eyebrow">Export Complete</div>
            <h2>Saved export</h2>
            <p>{exportSuccess.path}</p>
          </div>
          <button className="icon-mini-btn" onClick={onClose} aria-label="Close export saved dialog">
            ×
          </button>
        </div>
        <div className="export-success-actions">
          <button className="btn primary" onClick={onOpenFolder}>
            Open folder
          </button>
          <button
            className="btn"
            onClick={async () => {
              await navigator.clipboard?.writeText(exportSuccess.path);
              notify("Copied export path.");
            }}
          >
            Copy path
          </button>
          <button className="btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
