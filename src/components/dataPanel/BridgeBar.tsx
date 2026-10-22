import { Dataset } from "../../types";
import { LinkedGraphInfo } from "./types";

interface BridgeBarProps {
  linkedGraphs?: LinkedGraphInfo[];
  activeGraphId?: string;
  onOpenGraph?: (graphId: string) => void;
  selectedColumn: string;
  onAssignColumnToShelf?: (col: string, shelf: "x" | "y" | "color") => void;
  selectedCols: string[];
  dataset: Dataset;
  handleQuickPlot: (colOverride?: string) => void;
}

export function BridgeBar({
  linkedGraphs,
  activeGraphId,
  onOpenGraph,
  selectedColumn,
  onAssignColumnToShelf,
  selectedCols,
  dataset,
  handleQuickPlot,
}: BridgeBarProps) {
  return (
    <div className="sheet-graph-bridge-bar" aria-label="Linked figures bridge">
      <div className="bridge-info-group">
        <span className="bridge-icon" aria-hidden="true">📊</span>
        <span className="bridge-label">Linked Figures:</span>
        {linkedGraphs && linkedGraphs.length > 0 ? (
          <div className="bridge-pills">
            {linkedGraphs.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`bridge-graph-pill ${g.id === activeGraphId ? "active" : ""}`}
                onClick={() => onOpenGraph?.(g.id)}
                title={`Open ${g.title} (${g.chartType || "figure"})`}
              >
                <span className="pill-type-dot" />
                <strong>{g.title}</strong>
                <span className="pill-chart-type">{g.chartType || "plot"}</span>
                {g.id === activeGraphId && <span className="pill-active-badge">Active</span>}
                <span className="bridge-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        ) : (
          <span className="bridge-empty-text">No figures linked to this sheet yet</span>
        )}
      </div>
      <div className="bridge-action-group">
        {selectedColumn && onAssignColumnToShelf && (
          <div className="bridge-shelf-assign">
            <span className="bridge-assign-label">Assign &ldquo;{selectedColumn}&rdquo;:</span>
            <button
              type="button"
              className="btn mini"
              onClick={() => onAssignColumnToShelf(selectedColumn, "x")}
              title={`Set "${selectedColumn}" as X axis in active figure`}
            >
              X
            </button>
            <button
              type="button"
              className="btn mini"
              onClick={() => onAssignColumnToShelf(selectedColumn, "y")}
              title={`Set "${selectedColumn}" as Y axis in active figure`}
            >
              Y
            </button>
            <button
              type="button"
              className="btn mini"
              onClick={() => onAssignColumnToShelf(selectedColumn, "color")}
              title={`Set "${selectedColumn}" as Color group in active figure`}
            >
              Color
            </button>
          </div>
        )}
        <button
          type="button"
          className="btn small primary bridge-plot-btn"
          onClick={() => handleQuickPlot()}
          title="Create a new figure using the current selection"
          disabled={dataset.columns.length === 0}
        >
          <span aria-hidden="true">⚡</span>
          {selectedCols.length >= 2
            ? `Plot ${selectedCols[0]} vs ${selectedCols[1]}`
            : selectedColumn
            ? `Plot "${selectedColumn}"`
            : "New Figure from Sheet"}
        </button>
      </div>
    </div>
  );
}
