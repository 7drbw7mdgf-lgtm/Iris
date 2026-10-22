import React, { PointerEvent } from "react";
import { Dataset } from "../../types";
import { WorkspaceTab, GraphState, AssetState, AssetControlKind, AssetControl } from "../types";
import { ASSET_PANEL_WIDTH, ASSET_PANEL_HEIGHT, saneAssetPanelScale, defaultAssetPanelPosition } from "../dashboardUtils";
import { graphTypeLabel, graphLibraryLabel, uniqueValues } from "../graphMetaUtils";

export interface AssetPanelCardProps {
  tab: WorkspaceTab;
  index: number;
  graph?: GraphState;
  activeTabId: string;
  activeAsset: AssetState;
  assetGraphTabsCount: number;
  dataset: Dataset;
  assetDataset: Dataset;
  panelControls: AssetControl[];
  startAssetPanelDrag: (e: PointerEvent<HTMLElement>, assetId: string, graphId: string, index: number) => void;
  moveAssetPanelDrag: (e: PointerEvent<HTMLElement>) => void;
  endAssetPanelDrag: () => void;
  addGraphContextControl: (assetId: string, graphId: string, kind: AssetControlKind) => void;
  updateAssetPanelScale: (assetId: string, graphId: string, scale: number, index: number) => void;
  moveAssetGraph: (assetId: string, graphId: string, direction: -1 | 1) => void;
  toggleGraphInAsset: (assetId: string, graphId: string) => void;
  toggleAssetControlValue: (assetId: string, controlId: string, value: string) => void;
  updateAssetControl: (assetId: string, controlId: string, update: Partial<AssetControl>) => void;
  renderGraphPreview: (graphId: string, compact: boolean, dataOverride?: Dataset) => React.ReactNode;
}

export function AssetPanelCard({
  tab,
  index,
  graph,
  activeTabId,
  activeAsset,
  assetGraphTabsCount,
  dataset,
  assetDataset,
  panelControls,
  startAssetPanelDrag,
  moveAssetPanelDrag,
  endAssetPanelDrag,
  addGraphContextControl,
  updateAssetPanelScale,
  moveAssetGraph,
  toggleGraphInAsset,
  toggleAssetControlValue,
  updateAssetControl,
  renderGraphPreview,
}: AssetPanelCardProps) {
  const position = activeAsset.panelPositions[tab.id] ?? defaultAssetPanelPosition(index, false, activeAsset.panelGap);
  const scale = saneAssetPanelScale(position.scale);

  return (
    <article
      className="asset-panel"
      key={tab.id}
      style={
        activeAsset.layout === "freeform"
          ? {
              left: position.x,
              top: position.y,
              width: ASSET_PANEL_WIDTH * scale,
              height: ASSET_PANEL_HEIGHT * scale,
            }
          : {
              minHeight: ASSET_PANEL_HEIGHT * scale,
            }
      }
    >
      <div
        className="asset-panel-head"
        onPointerDown={(e) => startAssetPanelDrag(e, activeTabId, tab.id, index)}
        onPointerMove={moveAssetPanelDrag}
        onPointerUp={endAssetPanelDrag}
        onPointerCancel={endAssetPanelDrag}
      >
        <div>
          <strong>{tab.title}</strong>
          <em>
            {graph
              ? `${graphTypeLabel(graph.spec.graphType)} · ${graphLibraryLabel(graph.graphLibrary)} · drag to move`
              : "Graph · drag to move"}
          </em>
        </div>
        <div className="asset-panel-actions">
          <button
            className="asset-context-btn"
            type="button"
            onClick={() => addGraphContextControl(activeTabId, tab.id, "slider")}
            title="Add a slider based on this graph's Y variable"
          >
            + Y slider
          </button>
          <button
            className="asset-context-btn"
            type="button"
            onClick={() => addGraphContextControl(activeTabId, tab.id, "buttons")}
            title="Add buttons based on this graph's group or categorical axis"
          >
            + buttons
          </button>
          <label className="asset-scale-control" title="Scale this graph">
            <span>Scale</span>
            <input
              type="range"
              min={0.45}
              max={1.8}
              step={0.05}
              value={scale}
              onChange={(e) => updateAssetPanelScale(activeTabId, tab.id, Number(e.target.value), index)}
              onPointerDown={(e) => e.stopPropagation()}
            />
            <em>{Math.round(scale * 100)}%</em>
          </label>
          <button
            className="icon-mini-btn"
            type="button"
            onClick={() => moveAssetGraph(activeTabId, tab.id, -1)}
            disabled={index === 0}
            aria-label={`Move ${tab.title} earlier`}
          >
            ‹
          </button>
          <button
            className="icon-mini-btn"
            type="button"
            onClick={() => moveAssetGraph(activeTabId, tab.id, 1)}
            disabled={index === assetGraphTabsCount - 1}
            aria-label={`Move ${tab.title} later`}
          >
            ›
          </button>
          <button
            className="icon-mini-btn"
            type="button"
            onClick={() => toggleGraphInAsset(activeTabId, tab.id)}
            aria-label={`Remove ${tab.title}`}
          >
            ×
          </button>
        </div>
      </div>
      {panelControls.length > 0 && (
        <div className="asset-inline-controls">
          {panelControls.map((control) =>
            control.kind === "buttons" ? (
              <div className="asset-inline-control" key={control.id}>
                <strong>{control.field}</strong>
                <div className="asset-button-values inline">
                  {uniqueValues(dataset, control.field)
                    .slice(0, 12)
                    .map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={control.selectedValues.includes(value) ? "selected" : ""}
                        onClick={() => toggleAssetControlValue(activeTabId, control.id, value)}
                      >
                        {value}
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              <label className="asset-inline-control" key={control.id}>
                <strong>
                  {control.field} {"<="}{" "}
                  {Number(control.value).toLocaleString(undefined, { maximumFractionDigits: 3 })}
                </strong>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={(control.max - control.min) / 100 || 1}
                  value={control.value}
                  onChange={(e) => updateAssetControl(activeTabId, control.id, { value: Number(e.target.value) })}
                />
              </label>
            )
          )}
        </div>
      )}
      <div
        className="asset-panel-body"
        onPointerDown={(e) => startAssetPanelDrag(e, activeTabId, tab.id, index)}
        onPointerMove={moveAssetPanelDrag}
        onPointerUp={endAssetPanelDrag}
        onPointerCancel={endAssetPanelDrag}
      >
        {renderGraphPreview(tab.id, true, assetDataset)}
      </div>
    </article>
  );
}
