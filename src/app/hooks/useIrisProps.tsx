import { useCallback, useMemo } from "react";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { Dataset } from "../../types";
import { LiveSplitPanel } from "../types";
import { applyFilters } from "../graphMetaUtils";
import { visibleDashboardItems } from "../dashboardUtils";
import PlotPreview from "../../components/PlotPreview";
import { LiveSplitPreview } from "../components/LiveSplitPreview";
import { IrisState } from "./useIrisState";
import { TopMenuBarProps } from "../components/TopMenuBar";
import { LeftRailProps } from "../components/LeftRail";
import { WorkspaceMainViewProps } from "../components/WorkspaceMainView";
import { RightInspectorRailProps } from "../components/RightInspectorRail";
import { AppModalsProps } from "../modals/AppModals";
import { ChartTypePaletteModalProps } from "../modals/ChartTypePaletteModal";

export function useIrisProps(state: IrisState) {
  const renderGraphPreview = useCallback((graphId: string, compact = false, dataOverride?: Dataset) => {
    const g = state.graphStates[graphId] ?? state.activeGraph;
    const previewDataset = dataOverride ?? state.dataStates[g.sourceDataTabId || state.firstDataTabId] ?? state.dataset;
    return (
      <PlotPreview
        spec={g.spec}
        dataset={previewDataset}
        mode={compact && !g.scriptBacked ? "live" : g.mode}
        graphLibrary={g.graphLibrary}
        ggplotImage={g.ggplotImage}
        pythonImage={g.pythonImage}
        rendering={state.renderer.rendering && graphId === state.activeGraphId}
        pythonLibrary={g.graphLibrary === "matplotlib" || g.graphLibrary === "seaborn" ? g.graphLibrary : null}
        patch={(p) => state.patch(p, graphId)}
        compact={compact}
        artistRegions={!compact ? state.renderer.pythonArtists[graphId] ?? [] : []}
        selectedArtistKey={state.renderer.selectedPythonArtist?.graphId === graphId ? state.renderer.selectedPythonArtist.key : null}
        hoveredArtistKey={graphId === state.activeGraphId ? state.renderer.hoveredPythonArtistKey : null}
        onHoverArtist={!compact ? state.renderer.setHoveredPythonArtistKey : undefined}
        onSelectArtist={!compact ? (key) => state.renderer.setSelectedPythonArtist({ graphId, key }) : undefined}
        componentColors={g.componentColors}
        selectedComponentKey={g.selectedComponent?.key ?? null}
        onSelectComponent={(selection) => state.updateGraph(graphId, { selectedComponent: selection })}
        linkedFeature={state.graphCtrl.codeFigureLinking && graphId === state.activeGraphId ? state.graphCtrl.linkedCodeFeature : null}
        onHoverFeature={state.graphCtrl.codeFigureLinking && graphId === state.activeGraphId ? state.graphCtrl.setLinkedCodeFeature : undefined}
        renderError={graphId === state.activeGraphId ? state.renderer.renderError : null}
        onRetryRender={() => (state.isRLibrary ? void state.renderer.renderGgplot() : void state.renderer.renderPython())}
        onResetCode={() => (state.isRLibrary ? state.graphCtrl.resetRCode() : state.graphCtrl.resetPythonCode())}
      />
    );
  }, [state.graphStates, state.activeGraph, state.dataStates, state.firstDataTabId, state.dataset, state.renderer, state.activeGraphId, state.isRLibrary, state.graphCtrl, state.patch, state.updateGraph]);

  const renderLiveSplitPreview = useCallback((graphId: string, panels: LiveSplitPanel[]) => (
    <LiveSplitPreview
      graphId={graphId}
      panels={panels}
      compositeImage={state.graphStates[graphId]?.pythonImage}
      artists={state.renderer.pythonArtists[graphId] ?? []}
      selectedPythonArtist={state.renderer.selectedPythonArtist}
      hoveredPythonArtistKey={state.renderer.hoveredPythonArtistKey}
      splitArtistBox={state.renderer.splitArtistBox}
      setHoveredPythonArtistKey={state.renderer.setHoveredPythonArtistKey}
      setSplitArtistBox={state.renderer.setSplitArtistBox}
      setSelectedPythonArtist={state.renderer.setSelectedPythonArtist}
      selectedLiveSplitPanelId={state.liveSplit.selectedLiveSplitPanelId}
      setSelectedLiveSplitPanelId={state.liveSplit.setSelectedLiveSplitPanelId}
      setInspectorCollapsed={() => {}}
      moveLiveSplitPanel={state.liveSplit.moveLiveSplitPanel}
      resizeLiveSplitPanel={state.liveSplit.resizeLiveSplitPanel}
      onCommit={() => void state.liveSplit.applyLiveSplitGraphDetailEdits(state.liveSplit.liveSplitPanels[graphId] ?? panels)}
    />
  ), [state.graphStates, state.renderer, state.liveSplit]);

  const dashboardMetrics = useMemo(() => {
    const numeric = state.dataset.columns.filter((c) => state.dataset.types[c] === "numeric").length;
    const categorical = state.dataset.columns.filter((c) => state.dataset.types[c] === "categorical").length;
    const missing = state.dataset.rows.reduce((total, row) => total + state.dataset.columns.filter((c) => row[c] == null || row[c] === "").length, 0);
    return { numeric, categorical, missing };
  }, [state.dataset]);

  const dashboardDataset = useMemo(() => applyFilters(state.dataset, state.dashboard.dashboardFilters), [state.dataset, state.dashboard.dashboardFilters]);
  const dashboardVisibleItems = useMemo(
    () => visibleDashboardItems(state.dashboard.dashboardItems, state.graphStates, state.assets.assetStates, state.activeGraphId),
    [state.dashboard.dashboardItems, state.graphStates, state.assets.assetStates, state.activeGraphId]
  );

  const topMenuBarProps: TopMenuBarProps = {
    openProject: state.dataImport.openProject,
    setSaveProjectDialogOpen: state.persistence.setSaveProjectDialogOpen,
    undoData: state.persistence.undoData,
    redoData: state.persistence.redoData,
    undoStackLength: state.persistence.undoStack.length,
    redoStackLength: state.persistence.redoStack.length,
    clearDatasetAndGraphs: state.persistence.clearDatasetAndGraphs,
    openInputRef: state.persistence.openInputRef,
    openFileFromPicker: state.dataImport.openFileFromPicker,
    activeTab: state.activeTab,
    appView: state.appView,
    setAppView: state.setAppView,
    sourceDataTabId: state.sourceDataTabId,
    firstDataTabId: state.firstDataTabId,
    setActiveTabId: state.setActiveTabId,
    setRailSheetFilter: state.setRailSheetFilter,
    activeGraphId: state.activeGraphId,
    activeGraph: state.activeGraph,
    updateGraph: state.updateGraph,
    isPythonLibrary: state.isPythonLibrary,
    isRLibrary: state.isRLibrary,
    isPlotlyLibrary: state.isPlotlyLibrary,
    isAltairLibrary: state.isAltairLibrary,
    autoRender: state.renderer.autoRender,
    setAutoRender: state.renderer.setAutoRender,
    styleOverridesCode: state.styleOverridesCode,
    setStyleOverridesCode: state.setStyleOverridesCode,
    canRenderSelected: state.canRenderSelected,
    renderGgplot: state.renderer.renderGgplot,
    renderPython: state.renderer.renderPython,
    renderButtonLabel: state.renderButtonLabel,
    codeFigureLinking: state.graphCtrl.codeFigureLinking,
    setCodeFigureLinking: state.graphCtrl.setCodeFigureLinking,
    setLinkedCodeFeature: state.graphCtrl.setLinkedCodeFeature,
    canExportSelected: Boolean(state.activeGraph.ggplotImage || state.activeGraph.pythonImage || state.isPlotlyLibrary),
    openExportDialog: state.exportFig.openExportDialog,
    beginDashboardExportSelection: state.dashExport.beginDashboardExportSelection,
    renderError: state.renderer.renderError,
    openRendererPanel: state.renderer.openRendererPanel,
    rStatus: state.renderer.rStatus,
    rendererInfo: state.renderer.rendererInfo,
    rendererError: state.renderer.rendererError,
    rendererBusy: state.renderer.rendererBusy,
    refreshRendererStatus: state.renderer.refreshRendererStatus,
    runRendererRepair: state.renderer.runRendererRepair,
    setSettingsModalOpen: state.setSettingsModalOpen,
    theme: state.theme,
    toggleTheme: state.toggleTheme,
  };

  const leftRailProps: LeftRailProps = {
    dataset: state.dataset,
    workspaceTabs: state.workspaceTabs,
    activeTabId: state.activeTabId,
    setActiveTabId: state.setActiveTabId,
    appView: state.appView,
    setAppView: state.setAppView,
    graphStates: state.graphStates,
    railSectionsCollapsed: state.railSectionsCollapsed,
    setRailSectionsCollapsed: state.setRailSectionsCollapsed,
    railSheetFilter: state.railSheetFilter,
    setRailSheetFilter: state.setRailSheetFilter,
    activeDataTabId: state.activeDataTabId,
    activeGraphId: state.activeGraphId,
    createSheetFromMenu: (type) => (type === ("code" as any) ? state.codePost.setCodePostDialog((d) => ({ ...d, open: true })) : state.addTab(type)),
    createMenuLabel: state.railSheetFilter === "data" ? "New data table" : state.railSheetFilter === "stats" ? "New stats sheet" : "New figure",
    confirmCloseTab: (tab) => state.confirmCloseTab(tab, () => state.closeTab(tab.id)),
    addTab: state.addTab,
    projectAssetsProps: {
      projectAssetsOpen: state.projectAssets.projectAssetsOpen,
      setProjectAssetsOpen: state.projectAssets.setProjectAssetsOpen,
      projectAssetCards: state.projectAssets.projectAssetCards,
      filteredProjectAssetCards: state.projectAssets.filteredProjectAssetCards,
      projectAssetSearch: state.projectAssets.projectAssetSearch,
      setProjectAssetSearch: state.projectAssets.setProjectAssetSearch,
    },
  };

  const workspaceMainViewProps: WorkspaceMainViewProps = {
    appView: state.appView,
    activeTab: state.activeTab,
    activeGraphId: state.activeGraphId,
    activeGraph: state.activeGraph,
    activeGraphDataset: state.activeGraphDataset,
    activeDataset: state.activeDataset,
    dataset: state.dataset,
    workspaceTabs: state.workspaceTabs,
    graphStates: state.graphStates,
    assetStates: state.assets.assetStates,
    dashboardItems: state.dashboard.dashboardItems,
    dashboardFilters: state.dashboard.dashboardFilters,
    dashboardVisibleItems,
    dashboardMetrics,
    dashboardDataset,
    sourceDataTabId: state.sourceDataTabId,
    dataTabs: state.dataTabs,
    dataStates: state.dataStates,
    graphTabs: state.graphTabs,
    activeAsset: state.activeAsset,
    activeLiveSplitPanels: state.activeLiveSplitPanels,
    activeGraphIsCompositeScript: state.activeGraphIsCompositeScript,
    canConvertActiveScriptToVisual: Boolean(state.activeGraph.spec.xVar || state.activeGraph.spec.yVar),
    renameActiveWorkspace: state.actions.renameActiveWorkspace,
    setGraphDataSource: state.actions.setGraphDataSource,
    setActiveTabId: state.setActiveTabId,
    setAppView: state.setAppView,
    setRailSheetFilter: state.setRailSheetFilter,
    patch: state.patch,
    splitActiveCompositeScript: state.liveSplit.splitActiveCompositeScript,
    clearLiveSplitPanels: state.liveSplit.clearLiveSplitPanels,
    convertActiveScriptToVisualGraph: state.graphCtrl.convertActiveScriptToVisualGraph,
    renderLiveSplitPreview,
    renderGraphPreview,
    loadDataFile: state.dataImport.loadDataFile,
    editDataset: state.persistence.editDataset,
    createGraphDirectlyFromDataCode: state.codePost.createGraphDirectlyFromDataCode,
    createGraphFromColumns: (tabId, x, y) => state.graphCtrl.createGraphFromColumns(tabId, x, y),
    assignColumnToShelf: (col, shelf) => state.graphCtrl.assignColumnToShelf(col, shelf),
    onStatsResult: (res) => {
      state.setStatsResults((r) => [res, ...r]);
      state.notify(`Saved stats result: ${res.title}`);
    },
    addAssetToDashboard: state.dashboard.addAssetToDashboard,
    updateAsset: state.assets.updateAsset,
    removeAssetControl: state.assets.removeAssetControl,
    updateAssetControl: state.assets.updateAssetControl,
    toggleAssetControlValue: state.assets.toggleAssetControlValue,
    toggleGraphInAsset: state.assets.toggleGraphInAsset,
    addGraphContextControl: state.assets.addGraphContextControl,
    updateAssetPanelScale: state.assets.updateAssetPanelScale,
    moveAssetGraph: state.assets.moveAssetGraph,
    startAssetPanelDrag: state.assets.startAssetPanelDrag,
    moveAssetPanelDrag: state.assets.moveAssetPanelDrag,
    endAssetPanelDrag: state.assets.endAssetPanelDrag,
    addGraphToAsset: state.assets.addGraphToAsset,
    dashboardProps: {
      dataset: state.dataset,
      dashboardDataset,
      dashboardVisibleItems,
      dashboardMetrics,
      activeFilterCount: state.dashboard.dashboardFilters.length,
      setDashboardFilters: state.dashboard.setDashboardFilters,
      arrangeDashboardGrid: state.dashboard.arrangeDashboardGrid,
      alignDashboardYAxes: state.dashboard.alignDashboardYAxes,
      autoLetterDashboardPanels: state.dashboard.autoLetterDashboardPanels,
      setSaveProjectDialogOpen: state.persistence.setSaveProjectDialogOpen,
      createDashboardAsset: () => {},
      addGraphToDashboard: state.dashboard.addGraphToDashboard,
      activeGraphId: state.activeGraphId,
      addTextToDashboard: state.dashboard.addTextToDashboard,
      addLetterToDashboard: state.dashboard.addLetterToDashboard,
      dashboardFilterFields: state.dataset.columns,
      filterValuesFor: state.dashboard.filterValuesFor,
      toggleDashboardFilter: state.dashboard.toggleDashboardFilter,
      dashboardFilters: state.dashboard.dashboardFilters,
      dashboardCanvasRef: state.dashboard.dashboardCanvasRef,
      handleDashboardWheel: state.dashboard.handleDashboardWheel,
      handleDashboardTouchMove: state.dashboard.handleDashboardTouchMove,
      dashboardTouchDistanceRef: state.dashboard.dashboardTouchDistanceRef,
      dashboardExportSelecting: state.dashExport.dashboardExportSelecting,
      dashboardPointerRect: state.dashboard.dashboardPointerRect,
      setDashboardExportDrag: state.dashExport.setDashboardExportDrag,
      setDashboardExportSelection: state.dashExport.setDashboardExportSelection,
      dashboardSelectDrag: state.dashboard.dashboardSelectDrag,
      setDashboardSelectDrag: state.dashboard.setDashboardSelectDrag,
      setDashboardSelectRect: state.dashboard.setDashboardSelectRect,
      dashboardExportDrag: state.dashExport.dashboardExportDrag,
      dashboardExportSelection: state.dashExport.dashboardExportSelection,
      finishDashboardExportSelection: state.dashExport.finishDashboardExportSelection,
      dashboardSelectRect: state.dashboard.dashboardSelectRect,
      setDashboardSelectedItemIds: state.dashboard.setDashboardSelectedItemIds,
      setDashboardExportSelecting: state.dashExport.setDashboardExportSelecting,
      addDroppedDashboardFiles: state.dashboard.addDroppedDashboardFiles,
      dashboardDropPayload: state.dashboard.dashboardDropPayload,
      zoom: state.dashboard.dashboardZoom,
      moveDashboardItem: state.dashboard.moveDashboardItem,
      resizeDashboardItem: state.dashboard.resizeDashboardItem,
      updateDashboardItem: state.dashboard.updateDashboardItem,
      removeDashboardItem: state.dashboard.removeDashboardItem,
      dashboardSelectedItemIds: state.dashboard.dashboardSelectedItemIds,
    },
  };

  const rightInspectorRailProps: RightInspectorRailProps = {
    activeTab: state.activeTab,
    activeGraph: state.activeGraph,
    activeGraphId: state.activeGraphId,
    activeGraphDataset: state.activeGraphDataset,
    activeLiveSplitPanels: state.activeLiveSplitPanels,
    selectedLiveSplitPanelId: state.liveSplit.selectedLiveSplitPanelId,
    selectedPythonArtist: state.renderer.selectedPythonArtist,
    pythonArtists: state.renderer.pythonArtists,
    rendererInfo: state.renderer.rendererInfo,
    renderError: state.renderer.renderError,
    rendering: state.renderer.rendering,
    canRenderSelected: state.canRenderSelected,
    renderButtonLabel: state.renderButtonLabel,
    activeGraphIsCompositeScript: state.activeGraphIsCompositeScript,
    renderGraphPreview,
    renderGgplot: state.renderer.renderGgplot,
    renderPython: state.renderer.renderPython,
    splitActiveCompositeScript: state.liveSplit.splitActiveCompositeScript,
    refreshRendererStatus: state.renderer.refreshRendererStatus,
    updateGraph: state.updateGraph,
    setSelectedPythonArtist: state.renderer.setSelectedPythonArtist,
    applyPythonArtistEdit: state.actions.applyPythonArtistEdit,
    inspectorScrollTopRef: state.inspectorScrollTopRef,
    updateLiveSplitPanel: state.liveSplit.updateLiveSplitPanel,
    removeLiveSplitPanel: state.liveSplit.removeLiveSplitPanel,
    clearLiveSplitPanels: state.liveSplit.clearLiveSplitPanels,
    applyLiveSplitGraphDetailEdits: () => void state.liveSplit.applyLiveSplitGraphDetailEdits(state.activeLiveSplitPanels),
  };

  const appModalsProps: AppModalsProps = {
    codePostDialog: state.codePost.codePostDialog,
    setCodePostDialog: state.codePost.setCodePostDialog,
    createGraphFromPostedCode: state.codePost.createGraphFromPostedCode,
    exportDialog: state.exportFig.exportDialog,
    setExportDialog: state.exportFig.setExportDialog,
    activeGraph: state.activeGraph,
    dataset: state.dataset,
    isPlotlyLibrary: state.isPlotlyLibrary,
    renderExportPreview: state.exportFig.renderExportPreview,
    confirmExportFigure: state.exportFig.confirmExportFigure,
    dashboardExportDialog: state.dashExport.dashboardExportDialog,
    setDashboardExportDialog: state.dashExport.setDashboardExportDialog,
    beginDashboardExportSelection: state.dashExport.beginDashboardExportSelection,
    renderDashboardExportPreview: state.dashExport.renderDashboardExportPreview,
    confirmDashboardExport: state.dashExport.confirmDashboardExport,
    saveProjectDialogOpen: state.persistence.saveProjectDialogOpen,
    setSaveProjectDialogOpen: state.persistence.setSaveProjectDialogOpen,
    workspaceTabs: state.workspaceTabs,
    graphStates: state.graphStates,
    dashboardItems: state.dashboard.dashboardItems,
    confirmSaveProject: state.persistence.confirmSaveProject,
    dataImportPreview: state.dataImport.dataImportPreview,
    setDataImportPreview: state.dataImport.setDataImportPreview,
    updateDataImportColumnType: state.dataImport.updateDataImportColumnType,
    confirmDataImportPreview: state.dataImport.confirmDataImportPreview,
    exportSuccess: state.persistence.exportSuccess,
    setExportSuccess: state.persistence.setExportSuccess,
    openSavedExportLocation: async () => {
      if (state.persistence.exportSuccess.path) {
        try {
          await revealItemInDir(state.persistence.exportSuccess.path);
        } catch (e) {
          alert(String(e));
        }
      }
    },
    notify: state.notify,
    rendererPanelOpen: state.renderer.rendererPanelOpen,
    setRendererPanelOpen: state.renderer.setRendererPanelOpen,
    rendererInfo: state.renderer.rendererInfo,
    rendererError: state.renderer.rendererError,
    renderError: state.renderer.renderError,
    rendererBusy: state.renderer.rendererBusy,
    refreshRendererStatus: state.renderer.refreshRendererStatus,
    runRendererRepair: state.renderer.runRendererRepair,
    settingsModalOpen: state.settingsModalOpen,
    setSettingsModalOpen: state.setSettingsModalOpen,
    settings: state.settings,
    handleSaveSettings: state.handleSaveSettings,
    handleResetSettings: state.handleResetSettings,
  };

  const chartPaletteModalProps: ChartTypePaletteModalProps = {
    open: state.chartPalette.chartPaletteOpen,
    onClose: () => state.chartPalette.setChartPaletteOpen(false),
    activeGraph: state.activeGraph,
    activeGraphDataset: state.activeGraphDataset,
    onApplyChart: (typeId) => state.patch({ graphType: typeId }, state.activeGraphId),
  };

  return {
    topMenuBarProps,
    leftRailProps,
    workspaceMainViewProps,
    rightInspectorRailProps,
    appModalsProps,
    chartPaletteModalProps,
  };
}
