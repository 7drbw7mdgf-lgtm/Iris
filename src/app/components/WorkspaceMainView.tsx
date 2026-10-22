import React from "react";
import { Dataset, PlotSpec } from "../../types";
import {
  AppView,
  WorkspaceTab,
  GraphState,
  AssetState,
  LiveSplitPanel,
  DashboardItem,
  DashboardFilter,
  TabType,
} from "../types";
import { DashboardView } from "./DashboardView";
import { GraphStudioView } from "./GraphStudioView";
import { AssetBuilderView } from "./AssetBuilderView";
import DataPanel from "../../components/DataPanel";
import StatsToolkit, { StatsToolkitResult } from "../../components/StatsToolkit";

export interface WorkspaceMainViewProps {
  appView: AppView;
  activeTab?: WorkspaceTab;
  activeGraphId: string;
  activeGraph: GraphState;
  activeGraphDataset: Dataset;
  activeDataset: Dataset;
  dataset: Dataset;
  workspaceTabs: WorkspaceTab[];
  graphStates: Record<string, GraphState>;
  assetStates: Record<string, AssetState>;
  dashboardItems: DashboardItem[];
  dashboardFilters: DashboardFilter[];
  dashboardVisibleItems: DashboardItem[];
  dashboardMetrics: { numeric: number; categorical: number; missing: number };
  dashboardDataset: Dataset;
  sourceDataTabId: string;
  dataTabs: WorkspaceTab[];
  dataStates: Record<string, Dataset>;
  graphTabs: WorkspaceTab[];
  activeAsset: AssetState | null;
  activeLiveSplitPanels: LiveSplitPanel[];
  activeGraphIsCompositeScript: boolean;
  canConvertActiveScriptToVisual: boolean;

  renameActiveWorkspace: (title: string) => void;
  setGraphDataSource: (graphId: string, tabId: string) => void;
  setActiveTabId: (id: string) => void;
  setAppView: (view: AppView) => void;
  setRailSheetFilter: (filter: TabType) => void;
  patch: (p: Partial<PlotSpec>, id?: string) => void;
  splitActiveCompositeScript: () => void;
  clearLiveSplitPanels: (id: string) => void;
  convertActiveScriptToVisualGraph: () => void;
  renderLiveSplitPreview: (id: string, panels: LiveSplitPanel[]) => React.ReactNode;
  renderGraphPreview: (id: string, compact?: boolean, dataOverride?: Dataset) => React.ReactNode;

  loadDataFile: (file: File) => void;
  editDataset: (next: Dataset) => void;
  createGraphDirectlyFromDataCode: (code: string) => void;
  createGraphFromColumns: (tabId: string, x?: string, y?: string) => void;
  assignColumnToShelf: (col: string, shelf: "x" | "y" | "color") => void;

  onStatsResult: (res: StatsToolkitResult) => void;

  addAssetToDashboard: (id: string) => void;
  updateAsset: (id: string, patch: Partial<AssetState>) => void;
  removeAssetControl: (assetId: string, ctrlId: string) => void;
  updateAssetControl: (assetId: string, ctrlId: string, patch: any) => void;
  toggleAssetControlValue: (assetId: string, ctrlId: string, val: string) => void;
  toggleGraphInAsset: (assetId: string, graphId: string) => void;
  addGraphContextControl: (assetId: string, graphId: string, kind: any) => void;
  updateAssetPanelScale: (assetId: string, graphId: string, scale: number, index: number) => void;
  moveAssetGraph: (assetId: string, graphId: string, dir: -1 | 1) => void;
  startAssetPanelDrag: (e: any, assetId: string, graphId: string, index: number) => void;
  moveAssetPanelDrag: (e: any) => void;
  endAssetPanelDrag: () => void;
  addGraphToAsset: (assetId: string, graphId: string) => void;

  dashboardProps: any;
}

export function WorkspaceMainView(props: WorkspaceMainViewProps) {
  const {
    appView,
    activeTab,
    activeGraphId,
    activeGraph,
    activeGraphDataset,
    activeDataset,
    dataset,
    workspaceTabs,
    graphStates,
    assetStates,
    sourceDataTabId,
    dataTabs,
    dataStates,
    graphTabs,
    activeAsset,
    activeLiveSplitPanels,
    activeGraphIsCompositeScript,
    canConvertActiveScriptToVisual,
    renameActiveWorkspace,
    setGraphDataSource,
    setActiveTabId,
    setAppView,
    setRailSheetFilter,
    patch,
    splitActiveCompositeScript,
    clearLiveSplitPanels,
    convertActiveScriptToVisualGraph,
    renderLiveSplitPreview,
    renderGraphPreview,
    loadDataFile,
    editDataset,
    createGraphDirectlyFromDataCode,
    createGraphFromColumns,
    assignColumnToShelf,
    onStatsResult,
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
    addGraphToAsset,
    dashboardProps,
  } = props;

  return (
    <main className="app-shell-grid">
      {appView === "dashboard" ? (
        <DashboardView
          {...dashboardProps}
          graphStates={graphStates}
          assetStates={assetStates}
          renderGraphPreview={renderGraphPreview}
        />
      ) : activeTab?.type === "data" ? (
        <div className="top-view-panel data-view-panel">
          <div className="view-titlebar">
            <div>
              <div className="view-eyebrow">Spreadsheet Data Table</div>
              <input
                className="workspace-title-input"
                value={activeTab.title || dataset.name}
                onChange={(e) => renameActiveWorkspace(e.target.value)}
                aria-label="Data sheet name"
              />
            </div>
            <div className="view-meta">
              <span className="view-meta-item">{activeDataset.rows.length} rows</span>
              <span className="view-meta-dot">·</span>
              <span className="view-meta-item">{activeDataset.columns.length} cols</span>
            </div>
          </div>
          <DataPanel
            dataset={activeDataset}
            onImportFile={loadDataFile}
            onEdit={editDataset}
            onCreateGraphFromCode={createGraphDirectlyFromDataCode}
            collapsed={false}
            showAllRows
            showFields
            linkedGraphs={[]}
            activeGraphId={activeGraphId}
            onOpenGraph={(graphId) => {
              setActiveTabId(graphId);
              setAppView("workspace");
              setRailSheetFilter("graph");
            }}
            onCreateGraphFromColumns={(xCol, yCol) => createGraphFromColumns(activeTab.id, xCol, yCol)}
            onAssignColumnToShelf={(col, shelf) => assignColumnToShelf(col, shelf)}
          />
        </div>
      ) : activeTab?.type === "stats" ? (
        <div className="top-view-panel">
          <StatsToolkit dataset={activeDataset} onResult={onStatsResult} />
        </div>
      ) : activeTab?.type === "asset" && activeAsset ? (
        <AssetBuilderView
          activeTab={activeTab}
          activeAsset={activeAsset}
          workspaceTabs={workspaceTabs}
          dataset={dataset}
          graphStates={graphStates}
          graphTabs={graphTabs}
          renameActiveWorkspace={renameActiveWorkspace}
          addAssetToDashboard={addAssetToDashboard}
          updateAsset={updateAsset}
          removeAssetControl={removeAssetControl}
          updateAssetControl={updateAssetControl}
          toggleAssetControlValue={toggleAssetControlValue}
          toggleGraphInAsset={toggleGraphInAsset}
          addGraphContextControl={addGraphContextControl}
          updateAssetPanelScale={updateAssetPanelScale}
          moveAssetGraph={moveAssetGraph}
          startAssetPanelDrag={startAssetPanelDrag}
          moveAssetPanelDrag={moveAssetPanelDrag}
          endAssetPanelDrag={endAssetPanelDrag}
          renderGraphPreview={renderGraphPreview}
          addGraphToAsset={addGraphToAsset}
        />
      ) : (
        <GraphStudioView
          activeGraphId={activeGraphId}
          workspaceTabs={workspaceTabs}
          activeGraph={activeGraph}
          activeGraphDataset={activeGraphDataset}
          renameActiveWorkspace={renameActiveWorkspace}
          sourceDataTabId={sourceDataTabId}
          setGraphDataSource={setGraphDataSource}
          dataTabs={dataTabs}
          dataStates={dataStates}
          dataset={dataset}
          setActiveTabId={setActiveTabId}
          setAppView={setAppView}
          setRailSheetFilter={setRailSheetFilter}
          patch={patch}
          activeGraphIsCompositeScript={activeGraphIsCompositeScript}
          splitActiveCompositeScript={splitActiveCompositeScript}
          activeLiveSplitPanels={activeLiveSplitPanels}
          clearLiveSplitPanels={clearLiveSplitPanels}
          convertActiveScriptToVisualGraph={convertActiveScriptToVisualGraph}
          canConvertActiveScriptToVisual={canConvertActiveScriptToVisual}
          renderLiveSplitPreview={renderLiveSplitPreview}
          renderGraphPreview={renderGraphPreview}
        />
      )}
    </main>
  );
}
