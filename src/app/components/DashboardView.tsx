import React, { RefObject, MutableRefObject, Dispatch, SetStateAction } from "react";
import { Dataset } from "../../types";
import {
  DashboardItem,
  DashboardFilter,
  DashboardExportRect,
  GraphState,
  AssetState,
  AppView,
  WorkspaceTab,
} from "../types";
import {
  DASHBOARD_MIN_CARD_WIDTH,
  DASHBOARD_MIN_CARD_HEIGHT,
  snapDashboardValue,
  snapDashboardSize,
  dashboardRectsIntersect,
} from "../dashboardUtils";
import { DashboardHeaderBar } from "./DashboardHeaderBar";
import { DashboardCanvasLayer } from "./DashboardCanvasLayer";

export interface DashboardViewProps {
  dataset: Dataset;
  dashboardDataset: Dataset;
  dashboardVisibleItems: DashboardItem[];
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
  dashboardCanvasRef: RefObject<HTMLDivElement | null>;
  handleDashboardWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
  handleDashboardTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  dashboardTouchDistanceRef: MutableRefObject<number | null>;
  dashboardExportSelecting: boolean;
  dashboardPointerRect: (x: number, y: number) => { x: number; y: number } | null;
  setDashboardExportDrag: (val: any) => void;
  setDashboardExportSelection: (val: any) => void;
  dashboardSelectDrag: any;
  setDashboardSelectDrag: (val: any) => void;
  setDashboardSelectRect: (val: any) => void;
  dashboardExportDrag: any;
  dashboardExportSelection: DashboardExportRect | null;
  finishDashboardExportSelection: (rect: any) => Promise<void>;
  dashboardSelectRect: any;
  setDashboardSelectedItemIds: Dispatch<SetStateAction<string[]>>;
  setDashboardExportSelecting: (val: boolean) => void;
  addDroppedDashboardFiles: (files: File[], canvas: HTMLElement, x: number, y: number) => Promise<void>;
  dashboardDropPayload: (dataTransfer: DataTransfer) => { graphId: string | null; assetId: string | null };
  graphStates: Record<string, GraphState>;
  assetStates: Record<string, AssetState>;
  setDashboardItems: Dispatch<SetStateAction<DashboardItem[]>>;
  setAppView: (view: AppView) => void;
  notify: (msg: string) => void;
  workspaceTabs: WorkspaceTab[];
  dashboardZoom: number;
  moveDashboardItem: (id: string, x: number, y: number) => void;
  resizeDashboardItem: (id: string, w: number, h: number) => void;
  updateDashboardItem: (id: string, patch: Partial<DashboardItem>) => void;
  dashboardSelectedItemIds: string[];
  renderAssetMiniPreview: (assetId: string, ds: Dataset) => React.ReactNode;
  renderGraphPreview: (id: string, compact: boolean, ds: Dataset, filterFromChart?: any) => React.ReactNode;
  filterFromChart?: any;
}

export function DashboardView(props: DashboardViewProps) {
  const {
    dataset,
    dashboardDataset,
    dashboardVisibleItems,
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
    dashboardCanvasRef,
    handleDashboardWheel,
    handleDashboardTouchMove,
    dashboardTouchDistanceRef,
    dashboardExportSelecting,
    dashboardPointerRect,
    setDashboardExportDrag,
    setDashboardExportSelection,
    dashboardSelectDrag,
    setDashboardSelectDrag,
    setDashboardSelectRect,
    dashboardExportDrag,
    dashboardExportSelection,
    finishDashboardExportSelection,
    dashboardSelectRect,
    setDashboardSelectedItemIds,
    setDashboardExportSelecting,
    addDroppedDashboardFiles,
    dashboardDropPayload,
    graphStates,
    assetStates,
    setDashboardItems,
    setAppView,
    notify,
    workspaceTabs,
    dashboardZoom,
    moveDashboardItem,
    resizeDashboardItem,
    updateDashboardItem,
    dashboardSelectedItemIds,
    renderAssetMiniPreview,
    renderGraphPreview,
    filterFromChart,
  } = props;

  return (
    <section className="dashboard-workspace">
      <DashboardHeaderBar
        dataset={dataset}
        dashboardDataset={dashboardDataset}
        dashboardVisibleItemsCount={dashboardVisibleItems.length}
        dashboardMetrics={dashboardMetrics}
        activeFilterCount={activeFilterCount}
        setDashboardFilters={setDashboardFilters}
        arrangeDashboardGrid={arrangeDashboardGrid}
        alignDashboardYAxes={alignDashboardYAxes}
        autoLetterDashboardPanels={autoLetterDashboardPanels}
        setSaveProjectDialogOpen={setSaveProjectDialogOpen}
        createDashboardAsset={createDashboardAsset}
        addGraphToDashboard={addGraphToDashboard}
        activeGraphId={activeGraphId}
        addTextToDashboard={addTextToDashboard}
        addLetterToDashboard={addLetterToDashboard}
        dashboardFilterFields={dashboardFilterFields}
        filterValuesFor={filterValuesFor}
        toggleDashboardFilter={toggleDashboardFilter}
        dashboardFilters={dashboardFilters}
      />

      <div
        ref={dashboardCanvasRef as any}
        className="dashboard-canvas"
        onWheel={handleDashboardWheel}
        onTouchMove={handleDashboardTouchMove}
        onTouchEnd={() => {
          dashboardTouchDistanceRef.current = null;
        }}
        onTouchCancel={() => {
          dashboardTouchDistanceRef.current = null;
        }}
        data-selecting={dashboardExportSelecting ? "true" : undefined}
        data-dashboard-drop="true"
        onPointerDown={(e) => {
          if (dashboardExportSelecting) {
            const point = dashboardPointerRect(e.clientX, e.clientY);
            if (!point) return;
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            setDashboardExportDrag({ startX: point.x, startY: point.y, x: point.x, y: point.y });
            setDashboardExportSelection({ x: point.x, y: point.y, w: 0, h: 0 });
            return;
          }
          if (e.button !== 0) return;
          const target = e.target as Element;
          if (
            target.closest(
              ".dashboard-floating-card, button, input, select, textarea, [contenteditable='true'], .dashboard-floating-actions, .dashboard-filter-bar"
            )
          )
            return;
          const point = dashboardPointerRect(e.clientX, e.clientY);
          if (!point) return;
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          setDashboardSelectDrag({ startX: point.x, startY: point.y, x: point.x, y: point.y });
          setDashboardSelectRect({ x: point.x, y: point.y, w: 0, h: 0 });
        }}
        onPointerMove={(e) => {
          if (!dashboardExportSelecting && !dashboardSelectDrag) return;
          const point = dashboardPointerRect(e.clientX, e.clientY);
          if (!point) return;
          if (dashboardExportSelecting && dashboardExportDrag) {
            const rect = {
              x: Math.min(dashboardExportDrag.startX, point.x),
              y: Math.min(dashboardExportDrag.startY, point.y),
              w: Math.abs(point.x - dashboardExportDrag.startX),
              h: Math.abs(point.y - dashboardExportDrag.startY),
            };
            setDashboardExportDrag({ ...dashboardExportDrag, x: point.x, y: point.y });
            setDashboardExportSelection(rect);
            return;
          }
          if (!dashboardSelectDrag) return;
          const rect = {
            x: Math.min(dashboardSelectDrag.startX, point.x),
            y: Math.min(dashboardSelectDrag.startY, point.y),
            w: Math.abs(point.x - dashboardSelectDrag.startX),
            h: Math.abs(point.y - dashboardSelectDrag.startY),
          };
          setDashboardSelectDrag({ ...dashboardSelectDrag, x: point.x, y: point.y });
          setDashboardSelectRect(rect);
        }}
        onPointerUp={async (e) => {
          if (dashboardExportSelecting) {
            e.preventDefault();
            e.currentTarget.releasePointerCapture(e.pointerId);
            const rect = dashboardExportSelection;
            setDashboardExportDrag(null);
            await finishDashboardExportSelection(rect);
            return;
          }
          if (!dashboardSelectDrag) return;
          e.preventDefault();
          e.currentTarget.releasePointerCapture(e.pointerId);
          const rect = dashboardSelectRect;
          setDashboardSelectDrag(null);
          setDashboardSelectRect(null);
          if (!rect || rect.w < 8 || rect.h < 8) {
            setDashboardSelectedItemIds([]);
            return;
          }
          setDashboardSelectedItemIds(
            dashboardVisibleItems
              .filter((item) => dashboardRectsIntersect(rect, { x: item.x, y: item.y, w: item.w, h: item.h }))
              .map((item) => item.id)
          );
        }}
        onPointerCancel={() => {
          setDashboardExportDrag(null);
          setDashboardExportSelecting(false);
          setDashboardExportSelection(null);
          setDashboardSelectDrag(null);
          setDashboardSelectRect(null);
        }}
        onDragOver={(e) => {
          if (dashboardExportSelecting) return;
          const types = Array.from(e.dataTransfer.types);
          if (
            types.includes("Files") ||
            types.includes("text/graph-tab") ||
            types.includes("text/asset-tab") ||
            types.includes("text/plain")
          ) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }
        }}
        onDrop={async (e) => {
          if (dashboardExportSelecting) return;
          const files = Array.from(e.dataTransfer.files || []);
          if (files.length > 0) {
            e.preventDefault();
            await addDroppedDashboardFiles(files, e.currentTarget, e.clientX, e.clientY);
            return;
          }
          const { graphId, assetId } = dashboardDropPayload(e.dataTransfer);
          if (graphId && graphStates[graphId]) {
            e.preventDefault();
            const point = dashboardPointerRect(e.clientX, e.clientY);
            if (!point) return;
            setDashboardItems((items) => [
              ...items,
              {
                id: `dash-${Date.now()}`,
                kind: "graph",
                graphId,
                x: snapDashboardValue(point.x - 200),
                y: snapDashboardValue(point.y - 28),
                w: snapDashboardSize(528, DASHBOARD_MIN_CARD_WIDTH),
                h: snapDashboardSize(360, DASHBOARD_MIN_CARD_HEIGHT),
              },
            ]);
            setAppView("dashboard");
            notify(`Placed ${workspaceTabs.find((tab) => tab.id === graphId)?.title ?? "figure"} on the dashboard.`);
          }
          if (assetId && assetStates[assetId]) {
            e.preventDefault();
            const point = dashboardPointerRect(e.clientX, e.clientY);
            if (!point) return;
            setDashboardItems((items) => [
              ...items,
              {
                id: `dash-${Date.now()}`,
                kind: "asset",
                assetId,
                x: snapDashboardValue(point.x - 260),
                y: snapDashboardValue(point.y - 36),
                w: snapDashboardSize(720, DASHBOARD_MIN_CARD_WIDTH),
                h: snapDashboardSize(440, DASHBOARD_MIN_CARD_HEIGHT),
              },
            ]);
            setAppView("dashboard");
            notify(`Placed ${assetStates[assetId]?.title ?? "collection"} on the dashboard.`);
          }
        }}
      >
        <DashboardCanvasLayer
          dashboardZoom={dashboardZoom}
          dashboardExportSelecting={dashboardExportSelecting}
          dashboardExportSelection={dashboardExportSelection}
          setDashboardExportSelecting={setDashboardExportSelecting}
          setDashboardExportSelection={setDashboardExportSelection}
          setDashboardExportDrag={setDashboardExportDrag}
          dashboardSelectRect={dashboardSelectRect}
          dashboardVisibleItems={dashboardVisibleItems}
          workspaceTabs={workspaceTabs}
          graphStates={graphStates}
          assetStates={assetStates}
          dashboardDataset={dashboardDataset}
          dashboardSelectedItemIds={dashboardSelectedItemIds}
          setDashboardSelectedItemIds={setDashboardSelectedItemIds}
          setDashboardItems={setDashboardItems}
          moveDashboardItem={moveDashboardItem}
          resizeDashboardItem={resizeDashboardItem}
          updateDashboardItem={updateDashboardItem}
          renderAssetMiniPreview={renderAssetMiniPreview}
          renderGraphPreview={renderGraphPreview}
          filterFromChart={filterFromChart}
        />
      </div>
    </section>
  );
}
