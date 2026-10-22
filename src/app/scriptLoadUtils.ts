import { Dataset, PlotSpec } from "../types";
import { renderPlot, renderPythonPlot, PythonArtist } from "../tauri";
import { GraphState, PythonGraphCandidate, WorkspaceTab } from "./types";
import { makeGraphState, freezeAutoAxisRangesToDataset } from "./graphStateUtils";
import { inferSpecFromCode } from "./specInference";
import {
  inferRLibrariesFromCode,
  rScriptOwnsDataOrStyle,
  stripIrisSyncedBlock,
  syncRScriptWithVisualCode,
} from "./scriptSyncR";
import {
  extractPythonGraphCandidates,
  cleanImportedPythonCode,
  inferPythonLibraryFromCode,
} from "./scriptSyncPython";
import { generateR } from "../rgen";
import { renderTimeout } from "./hooks/useScriptRenderer";
import { friendlyRenderIssue } from "./renderErrorUtils";

export function graphStateFromPythonCandidate(
  candidate: PythonGraphCandidate,
  baseSpec: PlotSpec,
  title: string,
  ds: Dataset,
  sourceDataTabId: string
): GraphState {
  const inferredSpec = { ...baseSpec, ...candidate.inferredSpec, title };
  if (candidate.canSyncToVisualControls && !candidate.contractPanel) {
    return makeGraphState(ds, {
      spec: inferredSpec,
      sourceDataTabId,
      scriptBacked: false,
      graphLibrary: "plotly",
      mode: "live",
      loadedPythonScriptName: null,
      pythonCodeOverride: "",
      pythonCodeDirty: false,
      showBottom: true,
      ggplotImage: null,
      pythonImage: null,
    });
  }
  return makeGraphState(ds, {
    spec: inferredSpec,
    sourceDataTabId,
    scriptBacked: true,
    graphLibrary: candidate.library,
    mode: "python",
    loadedPythonScriptName: null,
    pythonCodeOverride: candidate.code,
    pythonCodeDirty: true,
    showBottom: true,
    ggplotImage: null,
    pythonImage: null,
  });
}

export interface ScriptLoadContext {
  activeGraphId: string;
  activeGraph: GraphState;
  activeGraphDataset: Dataset;
  sourceDataTabId: string;
  figW: number;
  figH: number;
  dpi: number;
  tabCounterRef: React.MutableRefObject<number>;
  setRendering: (rendering: boolean) => void;
  setRenderError: (error: any) => void;
  setPythonArtists: React.Dispatch<React.SetStateAction<Record<string, PythonArtist[]>>>;
  setGraphStates: React.Dispatch<React.SetStateAction<Record<string, GraphState>>>;
  setWorkspaceTabs: React.Dispatch<React.SetStateAction<WorkspaceTab[]>>;
  setActiveTabId: (id: string) => void;
  setAppView: (view: "workspace" | "dashboard") => void;
  updateGraph: (id: string, patch: Partial<GraphState>) => void;
  notify: (msg: string) => void;
}

export async function renderImportedPythonGraphs(
  graphs: { id: string; state: GraphState }[],
  ctx: Pick<
    ScriptLoadContext,
    "figW" | "figH" | "dpi" | "setRendering" | "setGraphStates" | "setPythonArtists" | "setRenderError" | "notify"
  >
) {
  const { figW, figH, dpi, setRendering, setGraphStates, setPythonArtists, setRenderError, notify } = ctx;
  const renderable = graphs.filter(
    ({ state }) => state.mode === "python" && state.pythonCodeOverride.trim()
  );
  if (renderable.length === 0) return;
  setRendering(true);
  try {
    const rendered = await Promise.all(
      renderable.map(async ({ id, state }) => {
        let result;
        try {
          result = await renderTimeout(
            renderPythonPlot({
              code: state.pythonCodeOverride,
              format: "png",
              width: figW,
              height: figH,
              dpi,
            }),
            "Python render"
          );
        } catch (error) {
          result = {
            success: false,
            data: "",
            stderr: String(error),
            format: "png",
            saved_to: null,
            artists: [],
          };
        }
        return { id, result };
      })
    );
    setGraphStates((states) => {
      const next = { ...states };
      rendered.forEach(({ id, result }) => {
        if (result.success && next[id])
          next[id] = { ...next[id], pythonImage: result.data, mode: "python" };
      });
      return next;
    });
    setPythonArtists((current) => {
      const next = { ...current };
      rendered.forEach(({ id, result }) => {
        if (result.success) next[id] = result.artists ?? [];
      });
      return next;
    });
    const failures = rendered.filter(({ result }) => !result.success);
    if (failures.length) {
      const first = failures[0].result.stderr || "Python produced no output figure.";
      const issue = friendlyRenderIssue(first, "Python");
      notify(`${failures.length} Python graph${failures.length === 1 ? "" : "s"} could not render.`);
      setRenderError(issue);
    }
  } finally {
    setRendering(false);
  }
}

export async function executeLoadRScript(
  name: string,
  code: string,
  ctx: ScriptLoadContext
) {
  const {
    activeGraphId,
    activeGraph,
    activeGraphDataset,
    figW,
    figH,
    dpi,
    setRendering,
    updateGraph,
    notify,
  } = ctx;
  const inferredSpec = { ...activeGraph.spec, ...inferSpecFromCode(code, activeGraphDataset) };
  const inferredLibraries = inferRLibrariesFromCode(code);
  const libraries = inferredLibraries || activeGraph.rLibraries;
  if (rScriptOwnsDataOrStyle(code, activeGraphDataset)) {
    const exactCode = stripIrisSyncedBlock(code).trim() + "\n";
    updateGraph(activeGraphId, {
      spec: inferredSpec,
      scriptBacked: true,
      graphLibrary: "ggplot2",
      mode: "ggplot",
      rLibraries: libraries,
      loadedRScriptName: null,
      rCode: exactCode,
      rCodeDirty: true,
      showBottom: true,
      ggplotImage: null,
      pythonImage: null,
    });
    notify(`Loaded ${name}. Iris will render this R graph exactly from the script.`);
    setRendering(true);
    let result;
    try {
      result = await renderTimeout(
        renderPlot({ code: exactCode, format: "png", width: figW, height: figH, dpi }),
        "R render"
      );
    } catch (error) {
      result = {
        success: false,
        data: "",
        stderr: error instanceof Error ? error.message : String(error),
        format: "png",
        saved_to: null,
      };
    } finally {
      setRendering(false);
    }
    if (result.success) {
      updateGraph(activeGraphId, { ggplotImage: result.data, mode: "ggplot" });
    } else {
      alert(`R render failed:\n\n${result.stderr || "R produced no output figure."}`);
    }
    return;
  }
  const visualCode = generateR(
    inferredSpec,
    activeGraphDataset,
    libraries.split(/[\s,]+/).filter(Boolean)
  );
  updateGraph(activeGraphId, {
    spec: inferredSpec,
    graphLibrary: "ggplot2",
    mode: "live",
    rLibraries: libraries,
    loadedRScriptName: name,
    rCode: syncRScriptWithVisualCode(code, visualCode, name),
    rCodeDirty: false,
    showBottom: true,
    ggplotImage: null,
    pythonImage: null,
  });
}

export async function executeLoadPythonScript(
  name: string,
  code: string,
  ctx: ScriptLoadContext
) {
  const {
    activeGraphId,
    activeGraph,
    activeGraphDataset,
    sourceDataTabId,
    tabCounterRef,
    setWorkspaceTabs,
    setGraphStates,
    setActiveTabId,
    setAppView,
    updateGraph,
    notify,
  } = ctx;
  const candidates = extractPythonGraphCandidates(name, code, activeGraphDataset);
  if (candidates.length <= 1) {
    const candidate = candidates[0] ?? {
      title: name,
      code: cleanImportedPythonCode(code),
      library: inferPythonLibraryFromCode(code),
      inferredSpec: inferSpecFromCode(code, activeGraphDataset),
      canSyncToVisualControls: false,
    };
    const nextGraph = graphStateFromPythonCandidate(
      candidate,
      activeGraph.spec,
      name,
      activeGraphDataset,
      sourceDataTabId
    );
    updateGraph(activeGraphId, nextGraph);
    if (nextGraph.mode === "python") {
      notify(`Loaded ${name}. Iris will render this standalone Python graph from the script.`);
      await renderImportedPythonGraphs([{ id: activeGraphId, state: nextGraph }], ctx);
    } else {
      notify(`Loaded ${name} and synced it to the visual graph controls.`);
    }
    return;
  }

  const createdGraphs = candidates.map((candidate) => {
    const n = tabCounterRef.current++;
    const id = `graph-${n}`;
    const title = candidate.title || `${name} ${n}`;
    return {
      id,
      title,
      state: {
        ...graphStateFromPythonCandidate(
          candidate,
          freezeAutoAxisRangesToDataset(activeGraph.spec, activeGraphDataset),
          title,
          activeGraphDataset,
          sourceDataTabId
        ),
        showBottom: false,
      },
    };
  });
  setWorkspaceTabs((tabs) => [
    ...tabs,
    ...createdGraphs.map(({ id, title }) => ({ id, type: "graph" as const, title })),
  ]);
  setGraphStates((states) => {
    const next = { ...states };
    createdGraphs.forEach(({ id, state }) => {
      next[id] = state;
    });
    return next;
  });
  setActiveTabId(createdGraphs[0].id);
  setAppView("workspace");
  notify(
    `Imported ${createdGraphs.length} figures from ${name}. Place them on the dashboard from Project items when ready.`
  );
  await renderImportedPythonGraphs(createdGraphs, ctx);
}
