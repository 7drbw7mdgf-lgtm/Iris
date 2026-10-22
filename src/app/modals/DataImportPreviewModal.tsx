import { Dataset } from "../../types";
import { DataImportPreview } from "../types";
import { dataImportColumnProfile } from "../graphMetaUtils";

export interface DataImportPreviewModalProps {
  dataImportPreview: DataImportPreview | null;
  onClose: () => void;
  updateDataImportColumnType: (column: string, type: Dataset["types"][string]) => void;
  confirmDataImportPreview: () => void;
}

export function DataImportPreviewModal({
  dataImportPreview,
  onClose,
  updateDataImportColumnType,
  confirmDataImportPreview,
}: DataImportPreviewModalProps) {
  if (!dataImportPreview) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Import data preview">
      <div className="import-preview-modal app-import-preview-modal">
        <div className="export-preview-head">
          <div>
            <div className="view-eyebrow">Import Preview</div>
            <h2>{dataImportPreview.name}</h2>
            <p>
              {dataImportPreview.error
                ? dataImportPreview.error
                : `${dataImportPreview.dataset.rows.length} rows · ${dataImportPreview.dataset.columns.length} columns detected`}
            </p>
          </div>
          <button className="icon-mini-btn" onClick={onClose} aria-label="Close import preview">
            ×
          </button>
        </div>
        {!dataImportPreview.error && (
          <>
            <div className="import-preview-source" title={dataImportPreview.source}>
              {dataImportPreview.source}
            </div>
            <div className="import-profile-grid" aria-label="Detected columns">
              {dataImportColumnProfile(dataImportPreview).map((profile) => (
                <div className="import-profile-card" key={profile.column}>
                  <strong>{profile.column}</strong>
                  <label>
                    <span>
                      <i className={`type-dot ${profile.type}`} />
                      Type
                    </span>
                    <select
                      value={profile.type}
                      onChange={(e) => updateDataImportColumnType(profile.column, e.target.value as Dataset["types"][string])}
                    >
                      <option value="numeric">Numeric</option>
                      <option value="categorical">Categorical</option>
                    </select>
                  </label>
                  <em>{profile.missing} missing</em>
                  {profile.sample && <small>{profile.sample}</small>}
                </div>
              ))}
            </div>
            <div className="import-preview-table-wrap app-import-preview-table">
              <table className="data-table spreadsheet-table">
                <thead>
                  <tr>
                    <th />
                    {dataImportPreview.dataset.columns.map((column) => (
                      <th key={column}>
                        <div className="sheet-column-head">
                          <span className={`type-dot ${dataImportPreview.dataset.types[column] || "categorical"}`} />
                          <span>{column}</span>
                          <select
                            className="import-header-type-select"
                            value={dataImportPreview.dataset.types[column] || "categorical"}
                            onChange={(e) => updateDataImportColumnType(column, e.target.value as Dataset["types"][string])}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="numeric">Numeric</option>
                            <option value="categorical">Categorical</option>
                          </select>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataImportPreview.dataset.rows.slice(0, 12).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <th className="row-index">{rowIndex + 1}</th>
                      {dataImportPreview.dataset.columns.map((column) => (
                        <td key={column}>{String(row[column] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className="export-preview-actions">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          {!dataImportPreview.error && (
            <button className="btn primary" onClick={confirmDataImportPreview}>
              Import table
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
