import { useState, Dispatch, SetStateAction } from "react";
import { Dataset, FriendlyRenderIssue } from "../../types";
import { renderPythonPlot, PythonArtist } from "../../tauri";
import { LiveSplitPanel, GraphState, WorkspaceTab } from "../types";
import { snapDashboardValue, snapDashboardSize } from "../dashboardUtils";
import { stripIrisSplitOverrides } from "../graphStateUtils";
import { splitPanelOverrideCode, splitPanelLayoutOverrideCode } from "../splitPanelUtils";
import { pythonArtistOverrideCode, PythonArtistEdit } from "../../pythonArtistOverrides";
import { renderTimeout } from "./useScriptRenderer";
import {
  executeSplitActiveCompositeScript,
  executeApplyLiveSplitGraphDetailEdits,
} from "../liveSplitActions";

export interface UseLiveSplitPanelsProps {
  activeGraphId: string;
  activeGraph: GraphState;
  activeGraphDataset: Dataset;
  graphStates: Record<string, GraphState>;
  workspaceTabs: WorkspaceTab[];
  pythonCode: string;
  figW: number;
  figH: number;
  dpi: number;
  pyPathShim: (codeMode: boolean) => string;
  setPythonArtists: Dispatch<SetStateAction<Record<string, PythonArtist[]>>>;
  updateGraph: (id: string, patch: Partial<GraphState>) => void;
  setInspectorCollapsed: (collapsed: boolean) => void;
  setAppView: (view: "workspace" | "dashboard") => void;
  setRendering: (rendering: boolean) => void;
  setRenderError: (error: FriendlyRenderIssue | null) => void;
  notify: (msg: string) => void;
}

export function useLiveSplitPanels(props: UseLiveSplitPanelsProps) {
  const {
    activeGraphId,
    activeGraph,
    activeGraphDataset,
    graphStates,
    workspaceTabs,
    pythonCode,
    figW,
    figH,
    dpi,
    pyPathShim,
    setPythonArtists,
    updateGraph,
    setInspectorCollapsed,
    setAppView,
    setRendering,
    setRenderError,
    notify,
  } = props;

  const [liveSplitPanels, setLiveSplitPanels] = useState<Record<string, LiveSplitPanel[]>>({});
  const [selectedLiveSplitPanelId, setSelectedLiveSplitPanelId] = useState<string | null>(null);

  const moveLiveSplitPanel = (graphId: string, panelId: string, x: number, y: number) => {
    setLiveSplitPanels((groups) => ({
      ...groups,
      [graphId]: (groups[graphId] ?? []).map((panel) =>
        panel.id === panelId ? { ...panel, x: snapDashboardValue(x), y: snapDashboardValue(y) } : panel
      ),
    }));
  };

  const resizeLiveSplitPanel = (graphId: string, panelId: string, w: number, h: number) => {
    setLiveSplitPanels((groups) => ({
      ...groups,
      [graphId]: (groups[graphId] ?? []).map((panel) =>
        panel.id === panelId
          ? { ...panel, w: snapDashboardSize(w, 180), h: snapDashboardSize(h, 140) }
          : panel
      ),
    }));
  };

  const updateLiveSplitPanel = (graphId: string, panelId: string, patch: Partial<LiveSplitPanel>) => {
    setLiveSplitPanels((groups) => ({
      ...groups,
      [graphId]: (groups[graphId] ?? []).map((panel) =>
        panel.id === panelId
          ? {
              ...panel,
              ...patch,
              x: patch.x !== undefined ? snapDashboardValue(patch.x) : panel.x,
              y: patch.y !== undefined ? snapDashboardValue(patch.y) : panel.y,
              w: patch.w !== undefined ? snapDashboardSize(patch.w, 180) : panel.w,
              h: patch.h !== undefined ? snapDashboardSize(patch.h, 140) : panel.h,
            }
          : panel
      ),
    }));
  };

  const removeLiveSplitPanel = (graphId: string, panelId: string) => {
    setLiveSplitPanels((groups) => ({
      ...groups,
      [graphId]: (groups[graphId] ?? []).filter((panel) => panel.id !== panelId),
    }));
    setSelectedLiveSplitPanelId((selected) => (selected === panelId ? null : selected));
  };

  const clearLiveSplitPanels = (graphId = activeGraphId) => {
    setLiveSplitPanels((groups) => {
      const next = { ...groups };
      delete next[graphId];
      return next;
    });
    setSelectedLiveSplitPanelId(null);
  };

  const addRenderedPythonPanelsToLivePreview = async (
    panels: Array<{
      title: string;
      graphTitle?: string;
      axisIndex?: number;
      xLabel?: string;
      yLabel?: string;
      data: string;
    }>,
    sourceName: string
  ) => {
    const panelWidth = 392;
    const panelHeight = 292;
    const columns = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(panels.length))));
    const createdPanels: LiveSplitPanel[] = panels.map((panel, index) => ({
      id: `live-split-${activeGraphId}-${Date.now()}-${index}`,
      sourceGraphId: activeGraphId,
      sourceName,
      title: panel.title || `${sourceName} ${index + 1}`,
      axisIndex: panel.axisIndex ?? index,
      xLabel: panel.xLabel ?? activeGraph.spec.xLabel ?? "",
      yLabel: panel.yLabel ?? activeGraph.spec.yLabel ?? "",
      graphTitle: panel.graphTitle ?? activeGraph.spec.title ?? "",
      hideTitle: false,
      hideXLabel: false,
      hideYLabel: false,
      hideLegend: false,
      xScale: "linear" as const,
      yScale: "linear" as const,
      traceColor: "",
      lineWidth: 0,
      markerSize: 0,
      data: panel.data,
      x: snapDashboardValue(24 + (index % columns) * (panelWidth + 32)),
      y: snapDashboardValue(24 + Math.floor(index / columns) * (panelHeight + 56)),
      w: snapDashboardSize(panelWidth, 180),
      h: snapDashboardSize(panelHeight, 140),
    }));
    setLiveSplitPanels((groups) => ({ ...groups, [activeGraphId]: createdPanels }));
    setSelectedLiveSplitPanelId(createdPanels[0]?.id ?? null);
    setInspectorCollapsed(false);
    setAppView("workspace");
    const baseCode = stripIrisSplitOverrides(graphStates[activeGraphId]?.pythonCodeOverride || pythonCode);
    const splitCode =
      baseCode +
      splitPanelOverrideCode(createdPanels) +
      splitPanelLayoutOverrideCode(createdPanels) +
      pythonArtistOverrideCode(activeGraph.artistOverrides);
    const composite = await renderTimeout(
      renderPythonPlot({
        code:
          pyPathShim(Boolean(activeGraph.scriptBacked || activeGraph.loadedPythonScriptName)) +
          splitCode,
        format: "png",
        width: figW,
        height: figH,
        dpi,
      }),
      "Python composite render"
    ).catch(() => null);
    setPythonArtists((current) => ({
      ...current,
      [activeGraphId]: composite?.artists ?? [],
    }));
    updateGraph(activeGraphId, {
      showBottom: false,
      scriptBacked: true,
      mode: "python",
      pythonCodeOverride: splitCode,
      pythonCodeDirty: true,
      pythonImage: composite?.success && composite.data ? composite.data : null,
    });
    notify(
      `Split ${createdPanels.length} panels in Live Preview. No new dashboard items or graph assets were created.`
    );
  };

  const splitActiveCompositeScript = async () => {
    await executeSplitActiveCompositeScript({
      activeGraphId,
      activeGraph,
      activeGraphDataset,
      graphStates,
      workspaceTabs,
      pythonCode,
      figW,
      figH,
      dpi,
      pyPathShim,
      setRendering,
      setRenderError,
      notify,
      addRenderedPythonPanelsToLivePreview,
    });
  };

  const applyLiveSplitGraphDetailEdits = async (
    panels: LiveSplitPanel[],
    artistOverrides: Record<string, PythonArtistEdit> = activeGraph.artistOverrides
  ) => {
    await executeApplyLiveSplitGraphDetailEdits(
      {
        activeGraphId,
        activeGraph,
        graphStates,
        pythonCode,
        figW,
        figH,
        dpi,
        pyPathShim,
        setRendering,
        setRenderError,
        notify,
        setPythonArtists,
        updateGraph,
        setLiveSplitPanels,
      },
      panels,
      artistOverrides
    );
  };

  return {
    liveSplitPanels,
    setLiveSplitPanels,
    selectedLiveSplitPanelId,
    setSelectedLiveSplitPanelId,
    moveLiveSplitPanel,
    resizeLiveSplitPanel,
    updateLiveSplitPanel,
    removeLiveSplitPanel,
    clearLiveSplitPanels,
    addRenderedPythonPanelsToLivePreview,
    splitActiveCompositeScript,
    applyLiveSplitGraphDetailEdits,
  };
}
