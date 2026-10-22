import { Selection } from "./types";

interface DataPanelStatusBarProps {
  editing: Selection | null;
  selectedRangeAddress: string;
  selectedCellCount: number;
  selectionAverage: number | null;
  selectionFilledCount: number;
  selectedMissingCount: number;
  selectionNumericValues: number[];
  selectionMin: number | null;
  selectionMax: number | null;
  selectionSum: number;
  tableZoom: number;
  setTableZoom: (updater: number | ((prev: number) => number)) => void;
}

export function DataPanelStatusBar({
  editing,
  selectedRangeAddress,
  selectedCellCount,
  selectionAverage,
  selectionFilledCount,
  selectedMissingCount,
  selectionNumericValues,
  selectionMin,
  selectionMax,
  selectionSum,
  tableZoom,
  setTableZoom,
}: DataPanelStatusBarProps) {
  return (
    <div className="excel-status-bar" role="status">
      <div className="status-mode-section">
        <span className="status-mode-pill">{editing ? "EDIT" : "READY"}</span>
        <span className="status-address-pill">{selectedRangeAddress}</span>
        {selectedCellCount > 1 && (
          <span className="status-cell-count">{selectedCellCount} cells selected</span>
        )}
      </div>

      <div className="status-stats-section">
        {selectionAverage !== null && (
          <div className="status-stat-item">
            <span className="stat-label">Average:</span>
            <span className="stat-value">{selectionAverage.toLocaleString(undefined, { maximumFractionDigits: 3 })}</span>
          </div>
        )}
        {selectionFilledCount > 0 && (
          <div className="status-stat-item">
            <span className="stat-label">Count:</span>
            <span className="stat-value">{selectionFilledCount}</span>
          </div>
        )}
        {selectedMissingCount > 0 && (
          <div className="status-stat-item">
            <span className="stat-label">Blank:</span>
            <span className="stat-value">{selectedMissingCount}</span>
          </div>
        )}
        {selectionNumericValues.length > 0 && (
          <div className="status-stat-item">
            <span className="stat-label">Numerical Count:</span>
            <span className="stat-value">{selectionNumericValues.length}</span>
          </div>
        )}
        {selectionMin !== null && (
          <div className="status-stat-item">
            <span className="stat-label">Min:</span>
            <span className="stat-value">{selectionMin.toLocaleString(undefined, { maximumFractionDigits: 3 })}</span>
          </div>
        )}
        {selectionMax !== null && (
          <div className="status-stat-item">
            <span className="stat-label">Max:</span>
            <span className="stat-value">{selectionMax.toLocaleString(undefined, { maximumFractionDigits: 3 })}</span>
          </div>
        )}
        {selectionNumericValues.length > 0 && (
          <div className="status-stat-item">
            <span className="stat-label">Sum:</span>
            <span className="stat-value">{selectionSum.toLocaleString(undefined, { maximumFractionDigits: 3 })}</span>
          </div>
        )}
      </div>

      <div className="status-zoom-section">
        <button
          type="button"
          className="zoom-stepper-btn"
          onClick={() => setTableZoom((z) => Math.max(50, z - 10))}
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          −
        </button>
        <input
          type="range"
          className="status-zoom-slider"
          min="50"
          max="200"
          step="10"
          value={tableZoom}
          onChange={(e) => setTableZoom(Number(e.target.value))}
          title="Spreadsheet Zoom"
          aria-label="Zoom slider"
        />
        <button
          type="button"
          className="zoom-stepper-btn"
          onClick={() => setTableZoom((z) => Math.min(200, z + 10))}
          title="Zoom In"
          aria-label="Zoom In"
        >
          +
        </button>
        <button
          type="button"
          className="zoom-reset-btn"
          onClick={() => setTableZoom(100)}
          title="Click to reset zoom to 100%"
        >
          {tableZoom}%
        </button>
      </div>
    </div>
  );
}
