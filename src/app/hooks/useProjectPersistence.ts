import { useState, useRef, useEffect } from "react";
import { save } from "@tauri-apps/plugin-dialog";
import { Dataset } from "../../types";
import { writeTextFile } from "../../tauri";
import {
  IrisProject,
  WorkspaceTab,
  GraphState,
  AssetState,
  StatsResultRecord,
  DashboardItem,
  DashboardFilter,
  AppView,
  ExportSuccessState,
  CLOSED_EXPORT_SUCCESS,
  EMPTY_DATASET,
  AUTOSAVE_KEY,
} from "../types";
import {
  isTauriRuntime,
  safeFileName,
  downloadTextFile,
} from "../exportUtils";
import {
  stripRenderedImages,
  normalizeGraphState,
  makeGraphState,
  fitSpecToDataset,
  selectedPreviewMode,
} from "../graphStateUtils";
import { generateR } from "../../rgen";

export interface UseProjectPersistenceProps {
  dataset: Dataset;
  setDataset: React.Dispatch<React.SetStateAction<Dataset>>;
  dataStates: Record<string, Dataset>;
  setDataStates: React.Dispatch<React.SetStateAction<Record<string, Dataset>>>;
  workspaceTabs: WorkspaceTab[];
  setWorkspaceTabs: React.Dispatch<React.SetStateAction<WorkspaceTab[]>>;
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  graphStates: Record<string, GraphState>;
  setGraphStates: React.Dispatch<React.SetStateAction<Record<string, GraphState>>>;
  assetStates: Record<string, AssetState>;
  setAssetStates: React.Dispatch<React.SetStateAction<Record<string, AssetState>>>;
  statsResults: StatsResultRecord[];
  setStatsResults: React.Dispatch<React.SetStateAction<StatsResultRecord[]>>;
  dashboardItems: DashboardItem[];
  setDashboardItems: React.Dispatch<React.SetStateAction<DashboardItem[]>>;
  dashboardFilters: DashboardFilter[];
  setDashboardFilters: React.Dispatch<React.SetStateAction<DashboardFilter[]>>;
  appView: AppView;
  setAppView: (view: AppView) => void;
  exportSettings: { width: number; height: number; dpi: number };
  setExportSettings: React.Dispatch<
    React.SetStateAction<{ width: number; height: number; dpi: number }>
  >;
  loadPythonScript: (name: string, code: string) => Promise<void>;
  loadRScript: (name: string, code: string) => Promise<void>;
  notify: (msg: string) => void;
}

export function useProjectPersistence(props: UseProjectPersistenceProps) {
  const {
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
    assetStates,
    setAssetStates,
    statsResults,
    setStatsResults,
    dashboardItems,
    setDashboardItems,
    dashboardFilters,
    setDashboardFilters,
    appView,
    setAppView,
    exportSettings,
    setExportSettings,
    loadPythonScript,
    loadRScript,
    notify,
  } = props;

  const [undoStack, setUndoStack] = useState<Dataset[]>([]);
  const [redoStack, setRedoStack] = useState<Dataset[]>([]);
  const [saveProjectDialogOpen, setSaveProjectDialogOpen] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<ExportSuccessState>(CLOSED_EXPORT_SUCCESS);

  const openInputRef = useRef<HTMLInputElement>(null);
  const autosaveReadyRef = useRef(false);

  const activeTab = workspaceTabs.find((t) => t.id === activeTabId) ?? workspaceTabs[0];
  const firstDataTabId = workspaceTabs.find((t) => t.type === "data")?.id ?? "data-1";
  const activeDataTabId = activeTab?.type === "data" ? activeTab.id : firstDataTabId;

  const showExportSuccess = (path: string) => {
    setExportSuccess({ open: true, path });
  };

  const editDataset = (next: Dataset) => {
    const targetDataTabId = activeTab?.type === "data" ? activeTab.id : activeDataTabId;
    const current = dataStates[targetDataTabId] ?? dataset;
    setUndoStack((s) => [...s, current].slice(-100));
    setRedoStack([]);
    setDataStates((states) => ({ ...states, [targetDataTabId]: next }));
    setDataset(next);
  };

  const undoData = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((stack) => stack.slice(0, stack.length - 1));
    setRedoStack((stack) => [...stack, dataset]);
    setDataset(previous);
    setDataStates((states) => ({ ...states, [activeDataTabId]: previous }));
  };

  const redoData = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((stack) => stack.slice(0, stack.length - 1));
    setUndoStack((stack) => [...stack, dataset]);
    setDataset(next);
    setDataStates((states) => ({ ...states, [activeDataTabId]: next }));
  };

  const makeProject = (): IrisProject => ({
    format: "iris-project",
    version: 1,
    dataset,
    dataStates,
    workspaceTabs,
    activeTabId,
    graphStates: stripRenderedImages(graphStates),
    assetStates,
    statsResults,
    dashboardItems,
    dashboardFilters,
    appView,
    exportSettings,
  });

  const applyProject = (project: IrisProject) => {
    if (project.format !== "iris-project" || project.version !== 1) {
      throw new Error("This is not a valid Iris project file.");
    }
    setDataset(project.dataset);
    setDataStates(project.dataStates || { "data-1": project.dataset });
    setWorkspaceTabs(
      project.workspaceTabs.length
        ? project.workspaceTabs
        : [{ id: "graph-1", type: "graph", title: "Graph 1" }]
    );
    setActiveTabId(project.activeTabId || project.workspaceTabs[0]?.id || "graph-1");
    setGraphStates(
      stripRenderedImages(
        Object.fromEntries(
          Object.entries(
            project.graphStates || { "graph-1": makeGraphState(project.dataset) }
          ).map(([id, graph]) => [id, normalizeGraphState(graph, project.dataset)])
        )
      )
    );
    setAssetStates(project.assetStates || {});
    setStatsResults(project.statsResults || []);
    setDashboardItems(project.dashboardItems || []);
    setDashboardFilters(project.dashboardFilters || []);
    setAppView(project.appView || "workspace");
    setExportSettings(project.exportSettings || { width: 7, height: 5, dpi: 300 });
    setUndoStack([]);
    setRedoStack([]);
  };

  const saveProject = async () => {
    const fileName = `${safeFileName(dataset.name || "iris_project", "iris_project")}.is`;
    const contents = JSON.stringify(makeProject(), null, 2);
    if (!isTauriRuntime()) {
      downloadTextFile(fileName, contents, "application/json");
      notify("Dashboard project downloaded.");
      return;
    }
    try {
      const path = await save({
        title: "Save Iris project",
        defaultPath: fileName,
        filters: [{ name: "Iris project", extensions: ["is", "iris"] }],
      });
      if (!path) return;
      const result = await writeTextFile(path, contents);
      if (result.success) notify("Dashboard project saved.");
      else alert(result.error);
    } catch {
      downloadTextFile(fileName, contents, "application/json");
      notify("Native save unavailable, downloaded project instead.");
    }
  };

  const confirmSaveProject = async () => {
    setSaveProjectDialogOpen(false);
    await saveProject();
  };

  const openTextDocument = async (fileName: string, text: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (extension === "py") {
      await loadPythonScript(fileName.replace(/\.[^.]+$/, ""), text);
      return;
    }
    if (extension === "r" || extension === "rscript") {
      await loadRScript(fileName.replace(/\.[^.]+$/, ""), text);
      return;
    }
    try {
      applyProject(JSON.parse(text) as IrisProject);
    } catch (e) {
      alert("Could not open Iris project:\n\n" + e);
    }
  };

  const loadDataset = (ds: Dataset) => {
    const targetDataTabId = activeTab?.type === "data" ? activeTab.id : activeDataTabId;
    setDataset(ds);
    setDataStates((states) => ({ ...states, [targetDataTabId]: ds }));
    setGraphStates((states) => {
      const next: Record<string, GraphState> = {};
      for (const id of Object.keys(states)) {
        const previous = states[id];
        const graphSourceId = previous.sourceDataTabId || firstDataTabId;
        if (graphSourceId !== targetDataTabId) {
          next[id] = previous;
          continue;
        }
        const spec = fitSpecToDataset(previous.spec, ds);
        if (previous.scriptBacked) {
          next[id] = {
            ...previous,
            sourceDataTabId: targetDataTabId,
            spec,
            ggplotImage: null,
            pythonImage: null,
          };
          continue;
        }
        next[id] = {
          ...previous,
          sourceDataTabId: targetDataTabId,
          spec,
          mode: selectedPreviewMode(previous.graphLibrary),
          ggplotImage: null,
          pythonImage: null,
          pythonCodeOverride: "",
          pythonCodeDirty: false,
          loadedPythonScriptName: null,
          rCode: generateR(
            spec,
            ds,
            previous.rLibraries.split(/[\s,]+/).filter(Boolean)
          ),
          rCodeDirty: false,
          loadedRScriptName: null,
        };
      }
      return next;
    });
    setUndoStack([]);
    setRedoStack([]);
    setDashboardFilters([]);
  };

  const clearDatasetAndGraphs = () => {
    if (
      !window.confirm(
        "Clear the current dataset and reset all graphs? This cannot be undone."
      )
    )
      return;
    setDataset(EMPTY_DATASET);
    setDataStates((states) => ({ ...states, [activeDataTabId]: EMPTY_DATASET }));
    setGraphStates((states) => {
      const next: Record<string, GraphState> = {};
      for (const id of Object.keys(states)) {
        const previous = states[id];
        next[id] =
          (previous.sourceDataTabId || firstDataTabId) === activeDataTabId
            ? makeGraphState(EMPTY_DATASET, { sourceDataTabId: activeDataTabId })
            : previous;
      }
      return next;
    });
    setUndoStack([]);
    setRedoStack([]);
    setDashboardFilters([]);
    notify("Dataset cleared and graphs reset.");
  };

  useEffect(() => {
    localStorage.removeItem(AUTOSAVE_KEY);
    autosaveReadyRef.current = false;
  }, []);

  useEffect(() => {
    if (!autosaveReadyRef.current) return;
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(makeProject()));
    } catch (e) {
      console.warn("Autosave to localStorage skipped (quota or restricted storage):", e);
    }
  }, [
    dataset,
    dataStates,
    workspaceTabs,
    activeTabId,
    graphStates,
    assetStates,
    statsResults,
    dashboardItems,
    dashboardFilters,
    appView,
    exportSettings,
  ]);

  return {
    dataset,
    setDataset,
    dataStates,
    setDataStates,
    undoStack,
    setUndoStack,
    redoStack,
    setRedoStack,
    editDataset,
    undoData,
    redoData,
    saveProjectDialogOpen,
    setSaveProjectDialogOpen,
    exportSuccess,
    setExportSuccess,
    openInputRef,
    autosaveReadyRef,
    makeProject,
    applyProject,
    saveProject,
    confirmSaveProject,
    openTextDocument,
    loadDataset,
    clearDatasetAndGraphs,
    showExportSuccess,
  };
}
