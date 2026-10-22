import React, { Dispatch, SetStateAction } from "react";
import { Dataset } from "../../types";
import { DashboardItem, GraphState, AssetState, WorkspaceTab } from "../types";
import { projectGraphMeta } from "../graphMetaUtils";
import {
  DashboardGraphCard,
  DashboardTextPanel,
  DashboardFilePanel,
} from "./DashboardCards";

export interface DashboardCanvasLayerProps {
  dashboardZoom: number;
  dashboardExportSelecting: boolean;
  dashboardExportSelection: any;
  setDashboardExportSelecting: (val: boolean) => void;
  setDashboardExportSelection: (val: any) => void;
  setDashboardExportDrag: (val: any) => void;
  dashboardSelectRect: any;
  dashboardVisibleItems: DashboardItem[];
  workspaceTabs: WorkspaceTab[];
  graphStates: Record<string, GraphState>;
  assetStates: Record<string, AssetState>;
  dashboardDataset: Dataset;
  dashboardSelectedItemIds: string[];
  setDashboardSelectedItemIds: Dispatch<SetStateAction<string[]>>;
  setDashboardItems: Dispatch<SetStateAction<DashboardItem[]>>;
  moveDashboardItem: (id: string, x: number, y: number) => void;
  resizeDashboardItem: (id: string, w: number, h: number) => void;
  updateDashboardItem: (id: string, patch: Partial<DashboardItem>) => void;
  renderAssetMiniPreview: (assetId: string, ds: Dataset) => React.ReactNode;
  renderGraphPreview: (id: string, compact: boolean, ds: Dataset, filterFromChart?: any) => React.ReactNode;
  filterFromChart?: any;
}

export function DashboardCanvasLayer(props: DashboardCanvasLayerProps) {
  const {
    dashboardZoom,
    dashboardExportSelecting,
    dashboardExportSelection,
    setDashboardExportSelecting,
    setDashboardExportSelection,
    setDashboardExportDrag,
    dashboardSelectRect,
    dashboardVisibleItems,
    workspaceTabs,
    graphStates,
    assetStates,
    dashboardDataset,
    dashboardSelectedItemIds,
    setDashboardSelectedItemIds,
    setDashboardItems,
    moveDashboardItem,
    resizeDashboardItem,
    updateDashboardItem,
    renderAssetMiniPreview,
    renderGraphPreview,
    filterFromChart,
  } = props;

  return (
    <div className="dashboard-zoom-layer" style={{ transform: `scale(${dashboardZoom})` }}>
      {dashboardExportSelecting && (
        <div className="dashboard-export-instructions">
          Drag to select the dashboard area to export
          <button
            className="btn small"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDashboardExportSelecting(false);
              setDashboardExportSelection(null);
              setDashboardExportDrag(null);
            }}
          >
            Cancel
          </button>
        </div>
      )}
      {dashboardExportSelection && dashboardExportSelecting && (
        <div
          className="dashboard-export-selection"
          style={{
            left: dashboardExportSelection.x,
            top: dashboardExportSelection.y,
            width: dashboardExportSelection.w,
            height: dashboardExportSelection.h,
          }}
        />
      )}
      {dashboardSelectRect && (
        <div
          className="dashboard-marquee-selection"
          style={{
            left: dashboardSelectRect.x,
            top: dashboardSelectRect.y,
            width: dashboardSelectRect.w,
            height: dashboardSelectRect.h,
          }}
        />
      )}
      {dashboardVisibleItems.length === 0 && (
        <div className="dashboard-empty-state">
          <strong>Drop figures or files here</strong>
          <span>Arrange finished figures, collections, text, and dropped PNG, JPEG, TIFF, or PDF files here.</span>
        </div>
      )}
      {dashboardVisibleItems.map((item) => {
        const isText = item.kind === "text";
        const isFile = item.kind === "file";
        const isSplitPanel = isFile && !!item.splitSourceGraphId;
        const isAsset = item.kind === "asset" || !!item.assetId;
        const tab = workspaceTabs.find((t) => t.id === (isAsset ? item.assetId : item.graphId));
        const graph = item.graphId ? graphStates[item.graphId] : null;
        const asset = item.assetId ? assetStates[item.assetId] : null;
        return (
          <DashboardGraphCard
            key={`${item.id}-${item.graphId ? JSON.stringify(graph?.spec ?? {}) : ""}-${
              graph?.pythonImage?.slice(0, 16) ?? ""
            }-${graph?.ggplotImage?.slice(0, 16) ?? ""}`}
            item={item}
            zoom={dashboardZoom}
            title={
              isText
                ? item.textTitle || "Textbox"
                : isFile
                ? (item.fileName || "File").replace(/\.png$/i, "")
                : isAsset
                ? asset?.title || tab?.title || "Collection"
                : tab?.title ?? "Figure"
            }
            meta={
              isText
                ? "Textbox"
                : isSplitPanel
                ? `Split panel · ${item.splitSourceName || "composite script"}`
                : isFile
                ? item.fileMime || "Dropped file"
                : isAsset
                ? `${asset?.graphIds.length || 0} figure panel${asset?.graphIds.length === 1 ? "" : "s"}`
                : graph
                ? projectGraphMeta(graph)
                : "Figure placement"
            }
            onMove={moveDashboardItem}
            onResize={resizeDashboardItem}
            onChange={(patch) => updateDashboardItem(item.id, patch)}
            onRemove={() => {
              setDashboardItems((items) => items.filter((i) => i.id !== item.id));
              setDashboardSelectedItemIds((ids) => ids.filter((id) => id !== item.id));
            }}
            selected={dashboardSelectedItemIds.includes(item.id)}
            onSelect={(additive) =>
              setDashboardSelectedItemIds((ids) =>
                additive ? (ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id]) : [item.id]
              )
            }
          >
            {isText ? (
              <DashboardTextPanel item={item} onChange={(patch) => updateDashboardItem(item.id, patch)} />
            ) : isFile ? (
              <DashboardFilePanel item={item} />
            ) : isAsset && item.assetId ? (
              renderAssetMiniPreview(item.assetId, dashboardDataset)
            ) : item.graphId ? (
              renderGraphPreview(item.graphId, true, dashboardDataset, filterFromChart)
            ) : null}
          </DashboardGraphCard>
        );
      })}
    </div>
  );
}
