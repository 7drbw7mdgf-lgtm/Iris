import { useState } from "react";
import { Dataset, GRAPH_CATEGORIES, GraphType } from "../../types";
import { GraphState } from "../types";
import { ChartTypeThumbnail } from "../../components/ChartThumbnails";
import { graphTypeCompatibility, getChartMetadata } from "../graphMetaUtils";

export interface ChartTypePaletteModalProps {
  open: boolean;
  onClose: () => void;
  activeGraph: GraphState;
  activeGraphDataset: Dataset;
  onApplyChart: (typeId: GraphType, label: string) => void;
}

export function ChartTypePaletteModal({
  open,
  onClose,
  activeGraph,
  activeGraphDataset,
  onApplyChart,
}: ChartTypePaletteModalProps) {
  const [chartTypeSearch, setChartTypeSearch] = useState("");
  const [galleryCategory, setGalleryCategory] = useState("All");
  const [hoveredChartId, setHoveredChartId] = useState<string | null>(null);

  if (!open) return null;

  const term = chartTypeSearch.trim().toLowerCase();
  const allCategories = [
    { id: "All", label: "All Types", count: GRAPH_CATEGORIES.reduce((acc, c) => acc + c.types.length, 0) },
    ...GRAPH_CATEGORIES.map((c) => ({ id: c.category, label: c.category, count: c.types.length })),
  ];
  const categories = GRAPH_CATEGORIES.filter((cat) => galleryCategory === "All" || cat.category === galleryCategory)
    .map((cat) => ({
      ...cat,
      types: cat.types.filter((g) => !term || `${g.label} ${g.id} ${cat.category}`.toLowerCase().includes(term)),
    }))
    .filter((cat) => cat.types.length > 0);

  const totalVisible = categories.reduce((acc, c) => acc + c.types.length, 0);
  const inspectId = hoveredChartId || activeGraph.spec.graphType;
  const found = GRAPH_CATEGORIES.flatMap((c) => c.types.map((t) => ({ ...t, category: c.category }))).find(
    (t) => t.id === inspectId
  );
  const footerCompat = graphTypeCompatibility((inspectId as any) || "scatter", activeGraphDataset);
  const meta = getChartMetadata(inspectId);

  const handleApply = (typeId: GraphType, label: string) => {
    onApplyChart(typeId, label);
    onClose();
    setChartTypeSearch("");
  };

  return (
    <div
      className="modal-backdrop chart-palette-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Chart Gallery"
      onMouseDown={onClose}
    >
      <div className="chart-palette" onMouseDown={(e) => e.stopPropagation()}>
        <div className="chart-palette-head">
          <div className="gallery-header-info">
            <div className="view-eyebrow">Visual Studio Catalog</div>
            <h2>Scientific Chart Gallery</h2>
            <p className="gallery-subtitle">
              Select from 50 publication-grade chart templates tailored for experimental and clinical figures
            </p>
          </div>
          <button className="icon-mini-btn" onClick={onClose} aria-label="Close chart palette">
            ×
          </button>
        </div>

        <div className="palette-search-row">
          <div className="palette-search-wrap">
            <span className="palette-search-lens" aria-hidden="true">
              🔍
            </span>
            <input
              className="chart-palette-search"
              autoFocus
              value={chartTypeSearch}
              onChange={(e) => setChartTypeSearch(e.target.value)}
              placeholder="Search by name, category, or keyword (e.g. volcano, violin, heatmap, survival)..."
            />
            {chartTypeSearch && (
              <button
                type="button"
                className="palette-search-clear"
                onClick={() => setChartTypeSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <span className="palette-total-pill">{totalVisible} of 50 charts</span>
        </div>

        <div className="palette-category-tabs" role="tablist" aria-label="Filter by chart family">
          {allCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={galleryCategory === c.id}
              className={`palette-cat-tab ${galleryCategory === c.id ? "active" : ""}`}
              onClick={() => setGalleryCategory(c.id)}
            >
              <span>{c.label}</span>
              <span className="cat-count-badge">{c.count}</span>
            </button>
          ))}
        </div>

        <div className="chart-palette-body">
          {categories.map((cat) => (
            <div key={cat.category} className="type-cat">
              <div className="type-cat-label">
                <span>{cat.category}</span>
                <em>{cat.types.length} charts</em>
              </div>
              <div className="type-grid palette-type-grid">
                {cat.types.map((g) => {
                  const compatibility = graphTypeCompatibility(g.id, activeGraphDataset);
                  const isSelected = activeGraph.spec.graphType === g.id;
                  return (
                    <button
                      key={g.id}
                      className={`type-btn ${isSelected ? "active" : ""} ${!compatibility.ok ? "disabled" : ""}`}
                      onMouseEnter={() => setHoveredChartId(g.id)}
                      onMouseLeave={() => setHoveredChartId(null)}
                      onClick={() => handleApply(g.id, g.label)}
                      disabled={!compatibility.ok}
                      title={compatibility.ok ? `Select ${g.label}` : compatibility.reason}
                    >
                      <div className="type-btn-thumb-wrap">
                        <ChartTypeThumbnail type={g.id} disabled={!compatibility.ok} />
                        {compatibility.ok ? (
                          <span className="type-btn-ready">✓ Ready</span>
                        ) : (
                          <span className="type-btn-reason">{compatibility.reason}</span>
                        )}
                      </div>
                      <span className="type-btn-label">{g.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="empty-hint">
              <p>No chart types match “{chartTypeSearch}”.</p>
              <button
                className="btn small"
                type="button"
                onClick={() => {
                  setChartTypeSearch("");
                  setGalleryCategory("All");
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        <div className="chart-palette-footer" aria-live="polite">
          <div className="palette-footer-info">
            <span className="palette-footer-icon">{found?.icon ?? "◫"}</span>
            <div className="palette-footer-main">
              <div className="palette-footer-title">
                <strong>{found?.label ?? inspectId}</strong>
                <span className="palette-footer-badge">{found?.category ?? "General"}</span>
                {footerCompat.ok ? (
                  <span className="palette-footer-status ready">✓ Compatible with current data</span>
                ) : (
                  <span className="palette-footer-status warning">{footerCompat.reason}</span>
                )}
              </div>
              <p className="palette-footer-desc">{meta.desc}</p>
            </div>
          </div>
          <div className="palette-footer-actions">
            <div className="palette-footer-req">
              <span>Inputs:</span> <code>{meta.inputs}</code>
            </div>
            {found && (
              <button
                type="button"
                className="btn small primary palette-apply-btn"
                disabled={!footerCompat.ok}
                onClick={() => handleApply(found.id, found.label)}
              >
                Use {found.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
