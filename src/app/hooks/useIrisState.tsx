import { useState, useMemo, useRef } from "react";
import { Dataset } from "../../types";
import { TabType, AppView, EMPTY_DATASET } from "../types";
import { codeLooksCompositeScript } from "../graphStateUtils";
import { generateR } from "../../rgen";
import { generatePython } from "../../pgen";
import { StatsToolkitResult } from "../../components/StatsToolkit";
import { useAppSettings } from "./useAppSettings";
import { useWorkspaceTabs } from "./useWorkspaceTabs";
import { useProjectPersistence } from "./useProjectPersistence";
import { useDataImport } from "./useDataImport";
import { useScriptRenderer } from "./useScriptRenderer";
import { useGraphStudioController } from "./useGraphStudioController";
import { useAssetWorkspace } from "./useAssetWorkspace";
import { useLiveSplitPanels } from "./useLiveSplitPanels";
import { useDashboardWorkspace } from "./useDashboardWorkspace";
import { useDashboardExport } from "./useDashboardExport";
import { useExportFigure } from "./useExportFigure";
import { useChartPalette } from "./useChartPalette";
import { useCodePostDialog } from "./useCodePostDialog";
import { useProjectAssetCards } from "./useProjectAssetCards";
import { useWorkspaceActions } from "./useWorkspaceActions";

export function useIrisState() {
  const {
    settings,
    settingsModalOpen,
    setSettingsModalOpen,
    theme,
    toggleTheme,
    actionNotice,
    notify,
    handleSaveSettings,
    handleResetSettings,
  } = useAppSettings();

  const [appView, setAppView] = useState<AppView>("workspace");
  const [railSheetFilter, setRailSheetFilter] = useState<TabType>("graph");
  const [railSectionsCollapsed, setRailSectionsCollapsed] = useState({
    fields: false,
    sheets: false,
    assets: false,
  });
  const [styleOverridesCode, setStyleOverridesCode] = useState(true);
  const inspectorScrollTopRef = useRef<number>(0);

  const [exportSettings, setExportSettings] = useState({
    width: settings.defaultWidth || 7,
    height: settings.defaultHeight || 5,
    dpi: settings.defaultDpi || 300,
  });

  const {
    workspaceTabs,
    setWorkspaceTabs,
    activeTabId,
    setActiveTabId,
    tabCounterRef,
    renameWorkspaceTab,
    addTab,
    closeTab,
    confirmCloseTab,
  } = useWorkspaceTabs();

  const [dataset, setDataset] = useState<Dataset>(EMPTY_DATASET);
  const [dataStates, setDataStates] = useState<Record<string, Dataset>>({
    "data-1": EMPTY_DATASET,
  });
  const [statsResults, setStatsResults] = useState<StatsToolkitResult[]>([]);

  const firstDataTabId = workspaceTabs.find((t) => t.type === "data")?.id ?? "data-1";
  const firstGraphId = workspaceTabs.find((t) => t.type === "graph")?.id ?? "graph-1";
  const activeTab = workspaceTabs.find((t) => t.id === activeTabId) ?? workspaceTabs[0];
  const activeGraphId = activeTab?.type === "graph" ? activeTab.id : firstGraphId;
  const sourceDataTabId = firstDataTabId;
  const activeDataTabId = activeTab?.type === "data" ? activeTab.id : sourceDataTabId;
  const activeDataset = dataStates[activeDataTabId] ?? dataset;
  const activeGraphDataset = dataStates[sourceDataTabId] ?? activeDataset;

  const graphCtrl = useGraphStudioController({
    dataset,
    activeGraphDataset,
    dataStates,
    setWorkspaceTabs,
    activeTabId,
    setActiveTabId,
    activeGraphId,
    sourceDataTabId,
    tabCounterRef,
    generatedCode: "",
    generatedPythonCode: "",
    figW: exportSettings.width,
    figH: exportSettings.height,
    dpi: exportSettings.dpi,
    setRendering: () => {},
    setRenderError: () => {},
    setPythonArtists: () => {},
    setAppView,
    setRailSheetFilter,
    notify,
  });

  const { graphStates, setGraphStates, updateGraph, patch } = graphCtrl;
  const activeGraph = graphStates[activeGraphId] ?? graphCtrl.activeGraph;

  const isPlotlyLibrary = activeGraph.graphLibrary === "plotly";
  const isRLibrary = activeGraph.graphLibrary === "ggplot2";
  const isAltairLibrary = activeGraph.graphLibrary === "altair";
  const isPythonLibrary = activeGraph.graphLibrary === "matplotlib" || activeGraph.graphLibrary === "seaborn";

  const generatedCode = useMemo(
    () => generateR(activeGraph.spec, activeGraphDataset, activeGraph.rLibraries.split(/[\s,]+/).filter(Boolean)),
    [activeGraph.spec, activeGraphDataset, activeGraph.rLibraries]
  );

  const pythonLibrary = isPythonLibrary || isAltairLibrary ? (activeGraph.graphLibrary as any) : "plotly";
  const generatedPythonCode = useMemo(
    () => generatePython(activeGraph.spec, activeGraphDataset, pythonLibrary),
    [activeGraph.spec, activeGraphDataset, pythonLibrary]
  );

  const pythonCode = activeGraph.pythonCodeDirty || activeGraph.loadedPythonScriptName
    ? activeGraph.pythonCodeOverride
    : generatedPythonCode;

  const renderer = useScriptRenderer({
    activeGraph,
    activeGraphId,
    updateGraph,
    figW: exportSettings.width,
    figH: exportSettings.height,
    dpi: exportSettings.dpi,
    styleOverridesCode,
    generatedCode,
    pythonCode,
    notify,
  });

  const assets = useAssetWorkspace({
    dataset,
    workspaceTabs,
    graphStates,
    notify,
  });

  const liveSplit = useLiveSplitPanels({
    activeGraphId,
    activeGraph,
    activeGraphDataset,
    graphStates,
    workspaceTabs,
    pythonCode,
    figW: exportSettings.width,
    figH: exportSettings.height,
    dpi: exportSettings.dpi,
    pyPathShim: renderer.pyPathShim,
    setPythonArtists: renderer.setPythonArtists,
    updateGraph,
    setInspectorCollapsed: () => {},
    setAppView,
    setRendering: renderer.setRendering,
    setRenderError: renderer.setRenderError,
    notify,
  });

  const dashboard = useDashboardWorkspace({
    dataset,
    notify,
    setAppView,
  });

  const persistence = useProjectPersistence({
    dataset,
    setDataset,
    dataStates,
    setDataStates,
    workspaceTabs,
    setWorkspaceTabs,
    activeTabId,
    setActiveTabId,
    graphStates,
    setGraphStates,
    assetStates: assets.assetStates,
    setAssetStates: assets.setAssetStates,
    statsResults: statsResults as any,
    setStatsResults: setStatsResults as any,
    dashboardItems: dashboard.dashboardItems,
    setDashboardItems: dashboard.setDashboardItems,
    dashboardFilters: dashboard.dashboardFilters,
    setDashboardFilters: dashboard.setDashboardFilters,
    appView,
    setAppView,
    exportSettings,
    setExportSettings,
    loadPythonScript: graphCtrl.loadPythonScript,
    loadRScript: graphCtrl.loadRScript,
    notify,
  });

  const dashExport = useDashboardExport({
    dataset,
    dashboardCanvasRef: dashboard.dashboardCanvasRef,
    notify,
    showExportSuccess: persistence.showExportSuccess,
    setAppView,
  });

  const dataImport = useDataImport({
    loadDataset: persistence.loadDataset,
    openTextDocument: persistence.openTextDocument,
    setLoadedScriptDir: () => {},
    openInputRef: persistence.openInputRef,
    notify,
  });

  const exportFig = useExportFigure({
    activeGraph,
    activeGraphDataset,
    dataset,
    figW: exportSettings.width,
    figH: exportSettings.height,
    dpi: exportSettings.dpi,
    isPlotlyLibrary,
    isAltairLibrary,
    generatedCode,
    rRenderCode: renderer.rRenderCode,
    pyRenderCode: renderer.pyRenderCode,
    setExportSettings,
    setRenderError: renderer.setRenderError,
    showExportSuccess: persistence.showExportSuccess,
  });

  const chartPalette = useChartPalette();

  const codePost = useCodePostDialog({
    activeGraphDataset,
    sourceDataTabId,
    tabCounterRef,
    figW: exportSettings.width,
    figH: exportSettings.height,
    dpi: exportSettings.dpi,
    setWorkspaceTabs,
    setGraphStates,
    setActiveTabId,
    setAppView,
    setRendering: renderer.setRendering,
    setRenderError: renderer.setRenderError,
    notify,
  });

  const projectAssets = useProjectAssetCards({
    workspaceTabs,
    dataStates,
    dataset,
    activeDataset,
    graphStates,
    assetStates: assets.assetStates,
    statsResults: statsResults as any,
    dashboardItems: dashboard.dashboardItems,
    setActiveTabId,
    setAppView,
    setRailSheetFilter,
    addGraphToDashboard: dashboard.addGraphToDashboard,
    addAssetToDashboard: dashboard.addAssetToDashboard,
    addStatsResultToDashboard: (res) => dashboard.addStatsResultToDashboard(res as any),
    notify,
  });

  const activeLiveSplitPanels = liveSplit.liveSplitPanels[activeGraphId] ?? [];
  const activeScriptCode = isRLibrary ? activeGraph.rCode : pythonCode;
  const activeGraphIsCompositeScript = useMemo(
    () => Boolean(activeGraph.scriptBacked || activeGraph.loadedPythonScriptName || activeGraph.loadedRScriptName) &&
      codeLooksCompositeScript(activeScriptCode),
    [activeGraph.scriptBacked, activeGraph.loadedPythonScriptName, activeGraph.loadedRScriptName, activeScriptCode]
  );

  const canRunPythonCode = activeGraph.pythonCodeDirty || activeGraph.scriptBacked || !!activeGraph.loadedPythonScriptName;
  const canRunR = renderer.rStatus.ok && !renderer.rendering && activeGraph.rCode.trim().length > 0;
  const canRenderPythonSelected = !renderer.rendering && !isRLibrary && canRunPythonCode && pythonCode.trim().length > 0;
  const canRenderSelected = isRLibrary ? canRunR : canRenderPythonSelected;
  const renderButtonLabel = renderer.rendering ? "Rendering..." : isRLibrary ? "Render ggplot2" : "Render Python";

  const actions = useWorkspaceActions({
    activeTab,
    activeDataset,
    workspaceTabs,
    renameWorkspaceTab,
    setDataStates,
    setDataset,
    updateAsset: assets.updateAsset,
    patch,
    dataStates,
    graphStates,
    fallbackGraph: graphCtrl.activeGraph,
    updateGraph,
    notify,
    activeGraphId,
    activeGraph,
    pythonCode,
    activeLiveSplitPanels,
    exportSettings,
    pyPathShim: renderer.pyPathShim,
    applyLiveSplitGraphDetailEdits: liveSplit.applyLiveSplitGraphDetailEdits,
    setRendering: renderer.setRendering,
    setRenderError: renderer.setRenderError,
    setPythonArtists: renderer.setPythonArtists,
  });

  const dataTabs = workspaceTabs.filter((t) => t.type === "data");
  const graphTabs = workspaceTabs.filter((t) => t.type === "graph");
  const activeAsset = activeTab?.type === "asset" ? assets.assetStates[activeTab.id] : null;

  return {
    settings,
    settingsModalOpen,
    setSettingsModalOpen,
    theme,
    toggleTheme,
    actionNotice,
    notify,
    handleSaveSettings,
    handleResetSettings,
    appView,
    setAppView,
    railSheetFilter,
    setRailSheetFilter,
    railSectionsCollapsed,
    setRailSectionsCollapsed,
    styleOverridesCode,
    setStyleOverridesCode,
    inspectorScrollTopRef,
    workspaceTabs,
    activeTabId,
    setActiveTabId,
    confirmCloseTab,
    closeTab,
    addTab,
    statsResults,
    setStatsResults,
    firstDataTabId,
    firstGraphId,
    activeTab,
    activeGraphId,
    activeGraph,
    persistence,
    dataset,
    dataStates,
    sourceDataTabId,
    activeDataTabId,
    activeDataset,
    activeGraphDataset,
    dataImport,
    graphCtrl,
    graphStates,
    updateGraph,
    patch,
    isPlotlyLibrary,
    isRLibrary,
    isAltairLibrary,
    isPythonLibrary,
    pythonCode,
    renderer,
    assets,
    liveSplit,
    dashExport,
    dashboard,
    exportFig,
    chartPalette,
    codePost,
    projectAssets,
    activeLiveSplitPanels,
    activeGraphIsCompositeScript,
    canRenderSelected,
    renderButtonLabel,
    actions,
    dataTabs,
    graphTabs,
    activeAsset,
  };
}

export type IrisState = ReturnType<typeof useIrisState>;
