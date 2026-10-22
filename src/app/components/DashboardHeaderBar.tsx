import { Dataset } from "../../types";
import { DashboardFilter } from "../types";
import { applyFilters, uniqueValues } from "../graphMetaUtils";

export interface DashboardHeaderBarProps {
  dataset: Dataset;
  dashboardDataset: Dataset;
  dashboardVisibleItemsCount: number;
  dashboardMetrics: { numeric: number; categorical: number; missing: number };
  activeFilterCount: number;
  setDashboardFilters: (filters: DashboardFilter[]) => void;
  arrangeDashboardGrid: (cols: number) => void;
  alignDashboardYAxes: () => void;
  autoLetterDashboardPanels: (fmt?: "letter" | "parens" | "dot") => void;
  setSaveProjectDialogOpen: (open: boolean) => void;
  createDashboardAsset: () => void;
  addGraphToDashboard: (id: string) => void;
  activeGraphId: string;
  addTextToDashboard: () => void;
  addLetterToDashboard: () => void;
  dashboardFilterFields: string[];
  filterValuesFor: (col: string) => string[];
  toggleDashboardFilter: (col: string, val: string) => void;
  dashboardFilters: DashboardFilter[];
}

export function DashboardHeaderBar(props: DashboardHeaderBarProps) {
  const {
    dataset,
    dashboardDataset,
    dashboardVisibleItemsCount,
    dashboardMetrics,
    activeFilterCount,
    setDashboardFilters,
    arrangeDashboardGrid,
    alignDashboardYAxes,
    autoLetterDashboardPanels,
    setSaveProjectDialogOpen,
    createDashboardAsset,
    addGraphToDashboard,
    activeGraphId,
    addTextToDashboard,
    addLetterToDashboard,
    dashboardFilterFields,
    filterValuesFor,
    toggleDashboardFilter,
    dashboardFilters,
  } = props;

  return (
    <>
      <div className="dashboard-commandbar">
        <div className="dashboard-command-title">
          <span className="dashboard-eyebrow">Dashboard</span>
          <strong>{dataset.name || "Untitled dashboard"}</strong>
          <em>
            {dashboardDataset.rows.length} / {dataset.rows.length} rows · {dataset.columns.length} columns ·{" "}
            {dashboardVisibleItemsCount} placements
          </em>
        </div>
        <div className="dashboard-quick-metrics" aria-label="Dashboard metrics">
          <span>
            <b>{dashboardMetrics.numeric}</b> numeric
          </span>
          <span>
            <b>{dashboardMetrics.categorical}</b> categorical
          </span>
          <span>
            <b>{dashboardMetrics.missing}</b> missing
          </span>
        </div>
        <div className="dashboard-command-actions">
          {activeFilterCount > 0 && (
            <button className="btn small" onClick={() => setDashboardFilters([])}>
              Clear filters
            </button>
          )}
          {dashboardVisibleItemsCount > 1 && (
            <>
              <button
                className="btn small"
                type="button"
                onClick={() => arrangeDashboardGrid(2)}
                title="Arrange into 2-column grid"
              >
                Grid 2×2
              </button>
              <button
                className="btn small"
                type="button"
                onClick={() => arrangeDashboardGrid(3)}
                title="Arrange into 3-column grid"
              >
                Grid 3×2
              </button>
              <button
                className="btn small"
                type="button"
                onClick={alignDashboardYAxes}
                title="Align left axes of visible panels"
              >
                Align Y-axes
              </button>
              <button
                className="btn small"
                type="button"
                onClick={() => autoLetterDashboardPanels("letter")}
                title="Automatically assign panel letters A, B, C..."
              >
                Auto-label (A-Z)
              </button>
            </>
          )}
          <button className="btn small primary" onClick={() => setSaveProjectDialogOpen(true)}>
            Save dashboard
          </button>
        </div>
      </div>
      <div className="dashboard-floating-actions" aria-label="Dashboard placement actions">
        <button
          type="button"
          onClick={createDashboardAsset}
          title="Add dashboard collection"
          aria-label="Add dashboard collection"
        >
          <span className="dash-action-icon dash-action-asset" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => addGraphToDashboard(activeGraphId)}
          title="Place active figure"
          aria-label="Place active figure"
        >
          <span className="dash-action-icon dash-action-graph" aria-hidden="true" />
        </button>
        <button type="button" onClick={addTextToDashboard} title="Add textbox" aria-label="Add textbox">
          <span className="dash-action-icon dash-action-text" aria-hidden="true" />
        </button>
        <button type="button" onClick={addLetterToDashboard} title="Add panel letter" aria-label="Add panel letter">
          <span className="dash-action-icon dash-action-letter" aria-hidden="true">
            A
          </span>
        </button>
      </div>
      <div className="dashboard-filter-bar">
        <div className="dashboard-filter-title">
          <strong>Filters</strong>
          <span>
            {activeFilterCount
              ? `${activeFilterCount} active selection${activeFilterCount === 1 ? "" : "s"}`
              : "Click a value or a chart point to filter every widget"}
          </span>
        </div>
        <div className="dashboard-filter-groups">
          {dashboardFilterFields.length === 0 && (
            <span className="muted small">No categorical fields available for dashboard filters.</span>
          )}
          {dashboardFilterFields.map((col) => {
            const selected = filterValuesFor(col);
            const values = uniqueValues(dataset, col).slice(0, 12);
            return (
              <div className="dashboard-filter-group" key={col}>
                <div className="dashboard-filter-field">{col}</div>
                <div className="dashboard-filter-values">
                  {values.map((value) => {
                    const count = applyFilters(
                      dataset,
                      dashboardFilters.filter((filter) => filter.col !== col)
                    ).rows.filter((row) => String(row[col] ?? "") === value).length;
                    const isSelected = selected.includes(value);
                    return (
                      <button
                        key={value}
                        className={`dashboard-filter-chip ${isSelected ? "selected" : ""} ${
                          count === 0 ? "excluded" : ""
                        }`}
                        type="button"
                        onClick={() => toggleDashboardFilter(col, value)}
                        title={`${count} matching rows`}
                      >
                        <span>{value}</span>
                        <em>{count}</em>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
