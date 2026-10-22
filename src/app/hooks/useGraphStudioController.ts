import { useState, useEffect, MutableRefObject, Dispatch, SetStateAction } from "react";
import { Dataset, PlotSpec, GraphType, defaultSpec } from "../../types";
import { PythonArtist } from "../../tauri";
import {
  GraphState,
  GraphLibrary,
  WorkspaceTab,
  ComponentEditScope,
  TabType,
} from "../types";
import {
  makeGraphState,
  selectedPreviewMode,
} from "../graphStateUtils";
import { inferSpecFromCode } from "../specInference";
import {
  IRIS_R_SYNC_START,
  syncRScriptWithVisualCode,
} from "../scriptSyncR";
import {
  IRIS_PY_SYNC_START,
  inferPythonLibraryFromCode,
  syncPythonScriptWithVisualCode,
} from "../scriptSyncPython";
import { generateR } from "../../rgen";
import {
  executeLoadRScript,
  executeLoadPythonScript,
} from "../scriptLoadUtils";

export interface UseGraphStudioControllerProps {
  dataset: Dataset;
  activeGraphDataset: Dataset;
  dataStates: Record<string, Dataset>;
  setWorkspaceTabs: Dispatch<SetStateAction<WorkspaceTab[]>>;
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  activeGraphId: string;
  sourceDataTabId: string;
  tabCounterRef: MutableRefObject<number>;
  generatedCode: string;
  generatedPythonCode: string;
  figW: number;
  figH: number;
  dpi: number;
  setRendering: (rendering: boolean) => void;
  setRenderError: (error: any) => void;
  setPythonArtists: Dispatch<SetStateAction<Record<string, PythonArtist[]>>>;
  setAppView: (view: "workspace" | "dashboard") => void;
  setRailSheetFilter: (filter: TabType) => void;
  notify: (msg: string) => void;
}

export function useGraphStudioController(props: UseGraphStudioControllerProps) {
  const {
    dataset,
    activeGraphDataset,
    dataStates,
    setWorkspaceTabs,
    setActiveTabId,
    activeGraphId,
    sourceDataTabId,
    tabCounterRef,
    generatedCode,
    generatedPythonCode,
    figW,
    figH,
    dpi,
    setRendering,
    setRenderError,
    setPythonArtists,
    setAppView,
    setRailSheetFilter,
    notify,
  } = props;

  const [graphStates, setGraphStates] = useState<Record<string, GraphState>>({
    "graph-1": makeGraphState(dataset),
  });

  const [codeFigureLinking, setCodeFigureLinking] = useState(false);
  const [linkedCodeFeature, setLinkedCodeFeature] = useState<string | null>(null);
  const [componentEditScope, setComponentEditScope] = useState<ComponentEditScope>("series");

  const activeGraph = graphStates[activeGraphId] ?? makeGraphState(dataset);

  const updateGraph = (id: string, update: Partial<GraphState>) => {
    setGraphStates((states) => {
      const current = states[id] ?? makeGraphState(dataset);
      return { ...states, [id]: { ...current, ...update } };
    });
  };

  const patch = (p: Partial<PlotSpec>, id = activeGraphId) => {
    setGraphStates((states) => {
      const current = states[id] ?? makeGraphState(dataset);
      return {
        ...states,
        [id]: {
          ...current,
          spec: { ...current.spec, ...p },
          mode: selectedPreviewMode(current.graphLibrary),
        },
      };
    });
  };

  useEffect(() => {
    const g = graphStates[activeGraphId];
    if (!g) return;
    if (!g.loadedRScriptName && g.rCodeDirty) return;
    if (g.loadedRScriptName && !g.rCode.includes(IRIS_R_SYNC_START)) return;
    const nextCode = g.loadedRScriptName
      ? syncRScriptWithVisualCode(g.rCode, generatedCode, g.loadedRScriptName)
      : generatedCode;
    if (g.rCode === nextCode) return;
    setGraphStates((states) => ({
      ...states,
      [activeGraphId]: { ...g, rCode: nextCode, rCodeDirty: false },
    }));
  }, [activeGraphId, generatedCode, graphStates]);

  useEffect(() => {
    const g = graphStates[activeGraphId];
    if (!g?.loadedPythonScriptName) return;
    if (!g.pythonCodeOverride.includes(IRIS_PY_SYNC_START)) return;
    const nextCode = syncPythonScriptWithVisualCode(
      g.pythonCodeOverride,
      generatedPythonCode,
      g.loadedPythonScriptName
    );
    if (g.pythonCodeOverride === nextCode) return;
    setGraphStates((states) => ({
      ...states,
      [activeGraphId]: { ...g, pythonCodeOverride: nextCode, pythonCodeDirty: false },
    }));
  }, [activeGraphId, generatedPythonCode, graphStates]);

  const portActiveGraphToLibrary = (library: GraphLibrary) => {
    const current = graphStates[activeGraphId] ?? activeGraph;
    const targetMode = selectedPreviewMode(library);
    const next: Partial<GraphState> = {
      graphLibrary: library,
      mode: targetMode,
      ggplotImage: null,
      pythonImage: null,
    };
    if (library === "ggplot2") {
      const rLibraries = current.rLibraries || "";
      next.rCode = generateR(
        current.spec,
        activeGraphDataset,
        rLibraries.split(/[\s,]+/).filter(Boolean)
      );
      next.rCodeDirty = false;
      next.loadedRScriptName = null;
    }
    updateGraph(activeGraphId, next);
  };

  const updateRCode = (code: string) => {
    const inferredSpec = inferSpecFromCode(code, activeGraphDataset);
    updateGraph(activeGraphId, {
      spec: Object.keys(inferredSpec).length
        ? { ...activeGraph.spec, ...inferredSpec }
        : activeGraph.spec,
      loadedRScriptName: activeGraph.loadedRScriptName,
      rCode: code,
      rCodeDirty: activeGraph.loadedRScriptName ? false : code !== generatedCode,
      graphLibrary: "ggplot2",
      scriptBacked: true,
      mode: "ggplot",
      ggplotImage: null,
    });
  };

  const updatePythonCode = (code: string) => {
    const inferredSpec = inferSpecFromCode(code, activeGraphDataset);
    const inferredLibrary = inferPythonLibraryFromCode(code);
    updateGraph(activeGraphId, {
      spec: Object.keys(inferredSpec).length
        ? { ...activeGraph.spec, ...inferredSpec }
        : activeGraph.spec,
      loadedPythonScriptName: activeGraph.loadedPythonScriptName,
      pythonCodeOverride: code,
      pythonCodeDirty: true,
      graphLibrary: inferredLibrary,
      scriptBacked: true,
      mode: "python",
      pythonImage: null,
    });
  };

  const resetRCode = () => {
    updateGraph(activeGraphId, {
      loadedRScriptName: null,
      rCode: generatedCode,
      rCodeDirty: false,
    });
  };

  const resetPythonCode = () => {
    updateGraph(activeGraphId, {
      loadedPythonScriptName: null,
      pythonCodeOverride: "",
      pythonCodeDirty: false,
      pythonImage: null,
    });
  };

  const convertActiveScriptToVisualGraph = () => {
    const current = graphStates[activeGraphId] ?? activeGraph;
    const nextLibrary = current.graphLibrary === "ggplot2" ? "ggplot2" : current.graphLibrary;
    const rLibraries = current.rLibraries || "";
    updateGraph(activeGraphId, {
      scriptBacked: false,
      mode: selectedPreviewMode(nextLibrary),
      ggplotImage: null,
      pythonImage: null,
      loadedPythonScriptName: null,
      loadedRScriptName: null,
      pythonCodeOverride: "",
      pythonCodeDirty: false,
      rCode: generateR(
        current.spec,
        activeGraphDataset,
        rLibraries.split(/[\s,]+/).filter(Boolean)
      ),
      rCodeDirty: false,
    });
    notify("Switched this graph to Iris visual controls.");
  };

  const assignColumnToShelf = (col: string, shelf: "x" | "y" | "color") => {
    if (!activeGraphId) return;
    const key = shelf === "x" ? "xVar" : shelf === "y" ? "yVar" : "colorVar";
    patch({ [key]: col }, activeGraphId);
    notify(`Set ${shelf.toUpperCase()} shelf to ${col}`);
  };

  const createGraphFromColumns = (dataTabId: string, xCol?: string, yCol?: string) => {
    const ds = dataStates[dataTabId] || dataset;
    const n = tabCounterRef.current++;
    const id = `graph-${n}`;
    const base = defaultSpec(ds);

    let graphType: GraphType = "scatter";
    if (xCol && !yCol) {
      const xType = ds.types[xCol];
      graphType = xType === "numeric" ? "histogram" : "bar";
    } else if (xCol && yCol) {
      const xType = ds.types[xCol];
      const yType = ds.types[yCol];
      if (xType === "categorical" && yType === "numeric") {
        graphType = "bar";
      } else {
        graphType = "scatter";
      }
    }

    const title = xCol && yCol ? `${yCol} vs ${xCol}` : xCol ? `${xCol} Plot` : `Graph ${n}`;
    const spec: PlotSpec = {
      ...base,
      graphType,
      xVar: xCol || base.xVar,
      yVar: yCol !== undefined ? yCol : xCol ? "" : base.yVar,
      title,
    };

    setWorkspaceTabs((tabs) => [...tabs, { id, type: "graph", title }]);
    setGraphStates((states) => ({
      ...states,
      [id]: makeGraphState(ds, { sourceDataTabId: dataTabId, spec }),
    }));
    setActiveTabId(id);
    setRailSheetFilter("graph");
    setAppView("workspace");
    notify(`Created ${title} linked to ${ds.name || "data table"}.`);
  };

  const loadRScript = async (name: string, code: string) => {
    await executeLoadRScript(name, code, {
      activeGraphId,
      activeGraph,
      activeGraphDataset,
      sourceDataTabId,
      figW,
      figH,
      dpi,
      tabCounterRef,
      setRendering,
      setRenderError,
      setPythonArtists,
      setGraphStates,
      setWorkspaceTabs,
      setActiveTabId,
      setAppView,
      updateGraph,
      notify,
    });
  };

  const loadPythonScript = async (name: string, code: string) => {
    await executeLoadPythonScript(name, code, {
      activeGraphId,
      activeGraph,
      activeGraphDataset,
      sourceDataTabId,
      figW,
      figH,
      dpi,
      tabCounterRef,
      setRendering,
      setRenderError,
      setPythonArtists,
      setGraphStates,
      setWorkspaceTabs,
      setActiveTabId,
      setAppView,
      updateGraph,
      notify,
    });
  };

  return {
    graphStates,
    setGraphStates,
    activeGraph,
    updateGraph,
    patch,
    portActiveGraphToLibrary,
    updateRCode,
    updatePythonCode,
    resetRCode,
    resetPythonCode,
    convertActiveScriptToVisualGraph,
    assignColumnToShelf,
    createGraphFromColumns,
    loadRScript,
    loadPythonScript,
    codeFigureLinking,
    setCodeFigureLinking,
    linkedCodeFeature,
    setLinkedCodeFeature,
    componentEditScope,
    setComponentEditScope,
  };
}
