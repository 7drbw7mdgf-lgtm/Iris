import React, { PointerEvent } from "react";
import { Dataset } from "../../types";
import {
  WorkspaceTab,
  GraphState,
  AssetState,
  AssetLayout,
  AssetControlKind,
  AssetControl,
} from "../types";
import {
  saneAssetPanelGap,
  assetPanelCanvasSize,
  defaultAssetPanelPosition,
} from "../dashboardUtils";
import {
  applyAssetControls,
} from "../graphStateUtils";
import {
  graphTypeLabel,
  graphLibraryLabel,
  uniqueValues,
} from "../graphMetaUtils";
import { AssetPanelCard } from "./AssetPanelCard";

export interface AssetBuilderViewProps {
  activeTab: WorkspaceTab;
  activeAsset: AssetState;
  workspaceTabs: WorkspaceTab[];
  dataset: Dataset;
  graphStates: Record<string, GraphState>;
  graphTabs: WorkspaceTab[];
  renameActiveWorkspace: (title: string) => void;
  addAssetToDashboard: (assetId: string) => void;
  updateAsset: (id: string, update: Partial<AssetState>) => void;
  removeAssetControl: (assetId: string, controlId: string) => void;
  updateAssetControl: (assetId: string, controlId: string, update: Partial<AssetControl>) => void;
  toggleAssetControlValue: (assetId: string, controlId: string, value: string) => void;
  toggleGraphInAsset: (assetId: string, graphId: string) => void;
  addGraphContextControl: (assetId: string, graphId: string, kind: AssetControlKind) => void;
  updateAssetPanelScale: (assetId: string, graphId: string, scale: number, index: number) => void;
  moveAssetGraph: (assetId: string, graphId: string, direction: -1 | 1) => void;
  startAssetPanelDrag: (e: PointerEvent<HTMLElement>, assetId: string, graphId: string, index: number) => void;
  moveAssetPanelDrag: (e: PointerEvent<HTMLElement>) => void;
  endAssetPanelDrag: () => void;
  renderGraphPreview: (graphId: string, compact: boolean, dataOverride?: Dataset) => React.ReactNode;
  addGraphToAsset: (assetId: string, graphId: string) => void;
}

export function AssetBuilderView(props: AssetBuilderViewProps) {
  const {
    activeTab,
    activeAsset,
    workspaceTabs,
    dataset,
    graphStates,
    graphTabs,
    renameActiveWorkspace,
    addAssetToDashboard,
    updateAsset,
    removeAssetControl,
    updateAssetControl,
    toggleAssetControlValue,
    toggleGraphInAsset,
    addGraphContextControl,
    updateAssetPanelScale,
    moveAssetGraph,
    startAssetPanelDrag,
    moveAssetPanelDrag,
    endAssetPanelDrag,
    renderGraphPreview,
    addGraphToAsset,
  } = props;

  const assetGraphTabs = activeAsset.graphIds
    .map((graphId) => workspaceTabs.find((tab) => tab.id === graphId))
    .filter((tab): tab is WorkspaceTab => !!tab && tab.type === "graph");
  const assetDataset = applyAssetControls(dataset, activeAsset.controls || []);
  const categoricalFields = dataset.columns.filter((col) => dataset.types[col] === "categorical");
  const numericFields = dataset.columns.filter((col) => dataset.types[col] === "numeric");

  return (
    <div
      className="asset-builder"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("text/graph-tab")) e.preventDefault();
      }}
      onDrop={(e) => {
        const graphId = e.dataTransfer.getData("text/graph-tab");
        if (graphId && graphStates[graphId]) {
          e.preventDefault();
          addGraphToAsset(activeTab.id, graphId);
        }
      }}
    >
      <div className="asset-toolbar">
        <div>
          <div className="view-eyebrow">Dashboard collection</div>
          <input
            className="asset-title-input"
            value={activeAsset.title}
            onChange={(e) => renameActiveWorkspace(e.target.value)}
            aria-label="Collection title"
          />
        </div>
        <div className="asset-controls">
          <button className="btn small" type="button" onClick={() => addAssetToDashboard(activeTab.id)}>
            Place collection on dashboard
          </button>
          <label>
            Layout
            <select
              value={activeAsset.layout}
              onChange={(e) => updateAsset(activeTab.id, { layout: e.target.value as AssetLayout })}
            >
              <option value="grid">Grid</option>
              <option value="row">Row</option>
              <option value="column">Column</option>
              <option value="storyboard">Storyboard</option>
              <option value="freeform">Freeform</option>
            </select>
          </label>
          <label>
            Padding
            <input
              className="asset-gap-slider"
              type="range"
              min={0}
              max={72}
              step={2}
              value={activeAsset.panelGap}
              onChange={(e) => updateAsset(activeTab.id, { panelGap: saneAssetPanelGap(Number(e.target.value)) })}
            />
            <span className="asset-control-value">{activeAsset.panelGap}px</span>
          </label>
        </div>
      </div>
      <div className="asset-workbench">
        <aside className="asset-graph-picker">
          <div className="asset-control-section">
            <div className="asset-section-head">
              <strong>Controls</strong>
              <em>
                {assetDataset.rows.length} / {dataset.rows.length} rows
              </em>
            </div>
            {(activeAsset.controls || []).length === 0 ? (
              <p className="asset-control-hint">
                Use + Y slider or + buttons inside a figure card. Controls filter every figure in the collection.
              </p>
            ) : (
              <div className="asset-control-list">
                {(activeAsset.controls || []).map((control) => {
                  const fields = control.kind === "buttons" ? categoricalFields : numericFields;
                  const values = control.kind === "buttons" ? uniqueValues(dataset, control.field).slice(0, 24) : [];
                  return (
                    <div className="asset-control-card" key={control.id}>
                      <div className="asset-control-card-head">
                        <span>{control.kind === "buttons" ? "Button filter" : "Slider filter"}</span>
                        <button
                          className="icon-mini-btn"
                          type="button"
                          onClick={() => removeAssetControl(activeTab.id, control.id)}
                          aria-label={`Remove ${control.label}`}
                        >
                          ×
                        </button>
                      </div>
                      <label className="asset-field-select">
                        Field
                        <select
                          value={control.field}
                          onChange={(e) => updateAssetControl(activeTab.id, control.id, { field: e.target.value })}
                        >
                          {fields.map((field) => (
                            <option key={field} value={field}>
                              {field}
                            </option>
                          ))}
                        </select>
                      </label>
                      {control.kind === "buttons" ? (
                        <div className="asset-button-values">
                          {values.map((value) => (
                            <button
                              key={value}
                              type="button"
                              className={control.selectedValues.includes(value) ? "selected" : ""}
                              onClick={() => toggleAssetControlValue(activeTab.id, control.id, value)}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <label className="asset-slider-control">
                          <span>
                            {control.field} {"<="}{" "}
                            <b>{Number(control.value).toLocaleString(undefined, { maximumFractionDigits: 3 })}</b>
                          </span>
                          <input
                            type="range"
                            min={control.min}
                            max={control.max}
                            step={(control.max - control.min) / 100 || 1}
                            value={control.value}
                            onChange={(e) =>
                              updateAssetControl(activeTab.id, control.id, { value: Number(e.target.value) })
                            }
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <strong>Figures</strong>
          <span>Pick figure tabs to combine into this dashboard collection.</span>
          <div className="asset-graph-list">
            {graphTabs.map((tab) => {
              const graph = graphStates[tab.id];
              const selected = activeAsset.graphIds.includes(tab.id);
              return (
                <button
                  key={tab.id}
                  className={`asset-graph-choice ${selected ? "selected" : ""}`}
                  type="button"
                  onClick={() => toggleGraphInAsset(activeTab.id, tab.id)}
                >
                  <span>{tab.title}</span>
                  <em>
                    {graph
                      ? `${graphTypeLabel(graph.spec.graphType)} · ${graphLibraryLabel(graph.graphLibrary)}`
                      : "Graph"}
                  </em>
                </button>
              );
            })}
          </div>
        </aside>
        <section className="asset-preview-shell">
          {assetGraphTabs.length === 0 ? (
            <div className="asset-empty-state">
              <strong>Drop figure tabs here</strong>
              <span>Select figures on the left, or drag figure tabs into this area to build a dashboard collection.</span>
            </div>
          ) : (
            <div
              className={`asset-stitch asset-${activeAsset.layout}`}
              style={{
                gap: activeAsset.panelGap,
                ...(activeAsset.layout === "freeform"
                  ? assetPanelCanvasSize(
                      assetGraphTabs.length,
                      false,
                      activeAsset.panelGap,
                      assetGraphTabs.map(
                        (tab, index) =>
                          activeAsset.panelPositions[tab.id] ??
                          defaultAssetPanelPosition(index, false, activeAsset.panelGap)
                      )
                    )
                  : {}),
              }}
            >
              {assetGraphTabs.map((tab, index) => {
                const graph = graphStates[tab.id];
                const panelControls = (activeAsset.controls || []).filter(
                  (control) => control.sourceGraphId === tab.id
                );
                return (
                  <AssetPanelCard
                    key={tab.id}
                    tab={tab}
                    index={index}
                    graph={graph}
                    activeTabId={activeTab.id}
                    activeAsset={activeAsset}
                    assetGraphTabsCount={assetGraphTabs.length}
                    dataset={dataset}
                    assetDataset={assetDataset}
                    panelControls={panelControls}
                    startAssetPanelDrag={startAssetPanelDrag}
                    moveAssetPanelDrag={moveAssetPanelDrag}
                    endAssetPanelDrag={endAssetPanelDrag}
                    addGraphContextControl={addGraphContextControl}
                    updateAssetPanelScale={updateAssetPanelScale}
                    moveAssetGraph={moveAssetGraph}
                    toggleGraphInAsset={toggleGraphInAsset}
                    toggleAssetControlValue={toggleAssetControlValue}
                    updateAssetControl={updateAssetControl}
                    renderGraphPreview={renderGraphPreview}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
