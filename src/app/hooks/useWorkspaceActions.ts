import { Dataset, PlotSpec } from "../../types";
import { PythonArtist } from "../../tauri";
import { WorkspaceTab, GraphState, AssetState, LiveSplitPanel } from "../types";
import { fitSpecToDataset, selectedPreviewMode } from "../graphStateUtils";
import { generateR } from "../../rgen";
import { executeApplyPythonArtistEdit } from "../artistEditUtils";

export interface UseWorkspaceActionsProps {
  activeTab?: WorkspaceTab;
  activeDataset: Dataset;
  workspaceTabs: WorkspaceTab[];
  renameWorkspaceTab: (id: string, title: string) => void;
  setDataStates: React.Dispatch<React.SetStateAction<Record<string, Dataset>>>;
  setDataset: React.Dispatch<React.SetStateAction<Dataset>>;
  updateAsset: (id: string, update: Partial<AssetState>) => void;
  patch: (p: Partial<PlotSpec>, id?: string) => void;
  dataStates: Record<string, Dataset>;
  graphStates: Record<string, GraphState>;
  fallbackGraph: GraphState;
  updateGraph: (id: string, update: Partial<GraphState>) => void;
  notify: (msg: string) => void;
  activeGraphId: string;
  activeGraph: GraphState;
  pythonCode: string;
  activeLiveSplitPanels: LiveSplitPanel[];
  exportSettings: { width: number; height: number; dpi: number };
  pyPathShim: (codeMode: boolean) => string;
  applyLiveSplitGraphDetailEdits: (panels: LiveSplitPanel[]) => Promise<void>;
  setRendering: (r: boolean) => void;
  setRenderError: (e: any) => void;
  setPythonArtists: React.Dispatch<React.SetStateAction<Record<string, PythonArtist[]>>>;
}

export function useWorkspaceActions(props: UseWorkspaceActionsProps) {
  const {
    activeTab,
    activeDataset,
    workspaceTabs,
    renameWorkspaceTab,
    setDataStates,
    setDataset,
    updateAsset,
    patch,
    dataStates,
    graphStates,
    fallbackGraph,
    updateGraph,
    notify,
    activeGraphId,
    activeGraph,
    pythonCode,
    activeLiveSplitPanels,
    exportSettings,
    pyPathShim,
    applyLiveSplitGraphDetailEdits,
    setRendering,
    setRenderError,
    setPythonArtists,
  } = props;

  const renameActiveWorkspace = (nextTitle: string) => {
    if (!activeTab) return;
    renameWorkspaceTab(activeTab.id, nextTitle);
    if (activeTab.type === "data") {
      const next = { ...activeDataset, name: nextTitle };
      setDataStates((states) => ({ ...states, [activeTab.id]: next }));
      setDataset(next);
      return;
    }
    if (activeTab.type === "asset") {
      updateAsset(activeTab.id, { title: nextTitle });
      return;
    }
    if (activeTab.type === "graph") {
      patch({ title: nextTitle }, activeTab.id);
    }
  };

  const setGraphDataSource = (graphId: string, dataTabId: string) => {
    const ds = dataStates[dataTabId];
    if (!ds) return;
    const current = graphStates[graphId] ?? fallbackGraph;
    const spec = fitSpecToDataset(current.spec, ds);
    updateGraph(graphId, {
      sourceDataTabId: dataTabId,
      spec,
      mode: selectedPreviewMode(current.graphLibrary),
      ggplotImage: null,
      pythonImage: null,
      pythonCodeOverride: "",
      pythonCodeDirty: false,
      loadedPythonScriptName: null,
      rCode: generateR(spec, ds, current.rLibraries.split(/[\s,]+/).filter(Boolean)),
      rCodeDirty: false,
      loadedRScriptName: null,
    });
    setDataset(ds);
    notify(`Graph linked to ${workspaceTabs.find((tab) => tab.id === dataTabId)?.title ?? ds.name}.`);
  };

  const applyPythonArtistEdit = async (key: string, edit: any) => {
    await executeApplyPythonArtistEdit(
      {
        activeGraphId,
        activeGraph,
        graphStates,
        pythonCode,
        activeLiveSplitPanels,
        figW: exportSettings.width,
        figH: exportSettings.height,
        dpi: exportSettings.dpi,
        pyPathShim,
        applyLiveSplitGraphDetailEdits,
        setRendering,
        setRenderError,
        setPythonArtists,
        updateGraph,
        notify,
      },
      key,
      edit
    );
  };

  return {
    renameActiveWorkspace,
    setGraphDataSource,
    applyPythonArtistEdit,
  };
}
