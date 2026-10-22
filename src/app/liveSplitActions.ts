import { Dataset, FriendlyRenderIssue } from "../types";
import { renderPythonPlot, splitPythonFigurePanels, PythonArtist } from "../tauri";
import { LiveSplitPanel, GraphState, WorkspaceTab } from "./types";
import { extractPythonGraphCandidates } from "./scriptSyncPython";
import { stripIrisSplitOverrides } from "./graphStateUtils";
import { splitPanelOverrideCode, splitPanelLayoutOverrideCode } from "./splitPanelUtils";
import { pythonArtistOverrideCode, PythonArtistEdit } from "../pythonArtistOverrides";
import { renderTimeout } from "./hooks/useScriptRenderer";
import { friendlyRenderIssue } from "./renderErrorUtils";

export interface SplitCompositeContext {
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
  setRendering: (rendering: boolean) => void;
  setRenderError: (error: FriendlyRenderIssue | null) => void;
  notify: (msg: string) => void;
  addRenderedPythonPanelsToLivePreview: (
    panels: Array<{
      title: string;
      graphTitle?: string;
      axisIndex?: number;
      xLabel?: string;
      yLabel?: string;
      data: string;
    }>,
    sourceName: string
  ) => Promise<void>;
}

export async function executeSplitActiveCompositeScript(ctx: SplitCompositeContext) {
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
    setRendering,
    setRenderError,
    notify,
    addRenderedPythonPanelsToLivePreview,
  } = ctx;

  const current = graphStates[activeGraphId] ?? activeGraph;
  const tabTitle =
    workspaceTabs.find((tab) => tab.id === activeGraphId)?.title ||
    "Composite script";
  if (current.graphLibrary === "ggplot2" || current.loadedRScriptName) {
    notify("Split is currently available for Python composite scripts.");
    return;
  }
  const rawCode = stripIrisSplitOverrides(current.pythonCodeOverride || pythonCode);
  if (!rawCode.trim()) {
    notify("No Python script available to split.");
    return;
  }
  const codeForSplit =
    pyPathShim(Boolean(current.scriptBacked || current.loadedPythonScriptName)) +
    rawCode;
  const sourceName = current.loadedPythonScriptName || tabTitle;
  const candidates = extractPythonGraphCandidates(
    sourceName,
    rawCode,
    activeGraphDataset
  );
  if (
    !current.scriptBacked &&
    !current.loadedPythonScriptName &&
    candidates.length > 1
  ) {
    setRendering(true);
    try {
      const rendered = await Promise.all(
        candidates.map(async (candidate, index) => {
          try {
            const codeForPanel =
              pyPathShim(
                Boolean(current.scriptBacked || current.loadedPythonScriptName)
              ) + candidate.code;
            const result = await renderTimeout(
              renderPythonPlot({
                code: codeForPanel,
                format: "png",
                width: figW,
                height: figH,
                dpi,
              }),
              "Python render"
            );
            return result.success && result.data
              ? {
                  title: candidate.title || `${sourceName} ${index + 1}`,
                  graphTitle: candidate.inferredSpec.title || "",
                  xLabel: candidate.inferredSpec.xLabel || "",
                  yLabel: candidate.inferredSpec.yLabel || "",
                  data: result.data,
                }
              : null;
          } catch {
            return null;
          }
        })
      );
      const panels = rendered.filter(
        (p): p is { title: string; graphTitle: string; xLabel: string; yLabel: string; data: string } => !!p
      );
      if (panels.length > 1) {
        await addRenderedPythonPanelsToLivePreview(panels, sourceName);
      } else {
        notify("Could not render enough panels to split in Live Preview.");
      }
    } finally {
      setRendering(false);
    }
    return;
  }
  setRendering(true);
  try {
    const result = await splitPythonFigurePanels({ code: codeForSplit, dpi });
    if (result.success && result.panels.length > 1) {
      await addRenderedPythonPanelsToLivePreview(result.panels, sourceName);
    } else {
      setRenderError(
        friendlyRenderIssue(
          result.stderr ||
            "Iris could not detect multiple subplot panels in this script.",
          "Python"
        )
      );
      notify("Could not split this composite script.");
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    setRenderError(friendlyRenderIssue(message, "Python"));
    notify("Could not split this composite script.");
  } finally {
    setRendering(false);
  }
}

export interface DetailEditsContext {
  activeGraphId: string;
  activeGraph: GraphState;
  graphStates: Record<string, GraphState>;
  pythonCode: string;
  figW: number;
  figH: number;
  dpi: number;
  pyPathShim: (codeMode: boolean) => string;
  setRendering: (rendering: boolean) => void;
  setRenderError: (error: FriendlyRenderIssue | null) => void;
  notify: (msg: string) => void;
  setPythonArtists: React.Dispatch<React.SetStateAction<Record<string, PythonArtist[]>>>;
  updateGraph: (id: string, patch: Partial<GraphState>) => void;
  setLiveSplitPanels: React.Dispatch<React.SetStateAction<Record<string, LiveSplitPanel[]>>>;
}

export async function executeApplyLiveSplitGraphDetailEdits(
  ctx: DetailEditsContext,
  panels: LiveSplitPanel[],
  artistOverrides: Record<string, PythonArtistEdit> = ctx.activeGraph.artistOverrides
) {
  const {
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
  } = ctx;

  const current = graphStates[activeGraphId] ?? activeGraph;
  if (current.graphLibrary === "ggplot2" || current.loadedRScriptName) {
    notify(
      "Split panel detail edits are currently available for Python/Matplotlib-backed panels."
    );
    return;
  }
  const rawCode = stripIrisSplitOverrides(current.pythonCodeOverride || pythonCode);
  if (!rawCode.trim()) {
    notify("No source script available for split panel edits.");
    return;
  }
  const codeMode = Boolean(current.scriptBacked || current.loadedPythonScriptName);
  const splitCode =
    rawCode +
    splitPanelOverrideCode(panels) +
    splitPanelLayoutOverrideCode(panels) +
    pythonArtistOverrideCode(artistOverrides);
  const codeForSplit = pyPathShim(codeMode) + splitCode;
  setRendering(true);
  try {
    const result = await splitPythonFigurePanels({ code: codeForSplit, dpi });
    if (!result.success || result.panels.length === 0) {
      setRenderError(
        friendlyRenderIssue(
          result.stderr || "Iris could not re-render the split panels.",
          "Python"
        )
      );
      notify("Could not apply split panel edits.");
      return;
    }
    const composite = await renderTimeout(
      renderPythonPlot({
        code: `import matplotlib.pyplot as _iris_edit_plt\ndef _iris_edit_no_close(*_args, **_kwargs):\n    pass\n_iris_edit_plt.close = _iris_edit_no_close\n${codeForSplit}`,
        format: "png",
        width: figW,
        height: figH,
        dpi,
      }),
      "Python composite render"
    );
    if (!composite.success || !composite.data) {
      setRenderError(
        friendlyRenderIssue(
          composite.stderr ||
            "Iris could not re-render the edited composite figure.",
          "Python"
        )
      );
      notify("Could not apply split panel edits.");
      return;
    }
    const renderedByAxis = new Map(
      result.panels.map((panel, index) => [panel.axisIndex ?? index, panel])
    );
    setLiveSplitPanels((groups) => ({
      ...groups,
      [activeGraphId]: panels.map((panel) => {
        const rendered = renderedByAxis.get(panel.axisIndex);
        if (!rendered) return panel;
        return {
          ...panel,
          data: rendered.data,
          title: panel.title || rendered.title,
          graphTitle: panel.hideTitle
            ? panel.graphTitle
            : panel.graphTitle || rendered.graphTitle || "",
          xLabel: panel.hideXLabel
            ? panel.xLabel
            : panel.xLabel || rendered.xLabel || "",
          yLabel: panel.hideYLabel
            ? panel.yLabel
            : panel.yLabel || rendered.yLabel || "",
        };
      }),
    }));
    setPythonArtists((current) => ({
      ...current,
      [activeGraphId]: composite.artists ?? [],
    }));
    updateGraph(activeGraphId, {
      scriptBacked: true,
      mode: "python",
      pythonCodeOverride: splitCode,
      artistOverrides,
      pythonCodeDirty: true,
      pythonImage: composite.data,
    });
    setRenderError(null);
    notify("Applied split panel graph edits.");
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    setRenderError(friendlyRenderIssue(message, "Python"));
    notify("Could not apply split panel edits.");
  } finally {
    setRendering(false);
  }
}
