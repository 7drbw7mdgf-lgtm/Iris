import { PythonArtistEdit, stripPythonArtistOverrides, pythonArtistOverrideCode } from "../pythonArtistOverrides";
import { renderPythonPlot, PythonArtist } from "../tauri";
import { GraphState, LiveSplitPanel } from "./types";
import { renderTimeout } from "./hooks/useScriptRenderer";
import { friendlyRenderIssue } from "./renderErrorUtils";

export interface ApplyArtistEditContext {
  activeGraphId: string;
  activeGraph: GraphState;
  graphStates: Record<string, GraphState>;
  pythonCode: string;
  activeLiveSplitPanels: LiveSplitPanel[];
  figW: number;
  figH: number;
  dpi: number;
  pyPathShim: (codeMode: boolean) => string;
  applyLiveSplitGraphDetailEdits: (
    panels: LiveSplitPanel[],
    overrides: Record<string, PythonArtistEdit>
  ) => Promise<void>;
  setRendering: (rendering: boolean) => void;
  setRenderError: (error: any) => void;
  setPythonArtists: React.Dispatch<React.SetStateAction<Record<string, PythonArtist[]>>>;
  updateGraph: (id: string, patch: Partial<GraphState>) => void;
  notify: (msg: string) => void;
}

export async function executeApplyPythonArtistEdit(
  ctx: ApplyArtistEditContext,
  key: string,
  edit: PythonArtistEdit | null
) {
  const {
    activeGraphId,
    activeGraph,
    graphStates,
    pythonCode,
    activeLiveSplitPanels,
    figW,
    figH,
    dpi,
    pyPathShim,
    applyLiveSplitGraphDetailEdits,
    setRendering,
    setRenderError,
    setPythonArtists,
    updateGraph,
    notify,
  } = ctx;

  const current = graphStates[activeGraphId] ?? activeGraph;
  const artistOverrides = { ...current.artistOverrides };
  if (edit === null) delete artistOverrides[key];
  else
    artistOverrides[key] = Object.fromEntries(
      Object.entries(edit).filter(
        ([, value]) =>
          value !== undefined &&
          !(typeof value === "number" && !Number.isFinite(value))
      )
    ) as PythonArtistEdit;

  if (activeLiveSplitPanels.length) {
    await applyLiveSplitGraphDetailEdits(activeLiveSplitPanels, artistOverrides);
    return;
  }

  const sourceCode = stripPythonArtistOverrides(
    current.pythonCodeOverride || pythonCode
  );
  const editedCode = sourceCode + pythonArtistOverrideCode(artistOverrides);
  setRendering(true);
  try {
    const result = await renderTimeout(
      renderPythonPlot({
        code:
          pyPathShim(
            Boolean(current.scriptBacked || current.loadedPythonScriptName)
          ) + editedCode,
        format: "png",
        width: figW,
        height: figH,
        dpi,
      }),
      "Python artist render"
    );
    if (!result.success || !result.data) {
      setRenderError(
        friendlyRenderIssue(
          result.stderr || "Could not apply artist edits.",
          "Python"
        )
      );
      return;
    }
    setPythonArtists((artists) => ({
      ...artists,
      [activeGraphId]: result.artists ?? [],
    }));
    updateGraph(activeGraphId, {
      artistOverrides,
      pythonCodeOverride: editedCode,
      pythonCodeDirty: true,
      scriptBacked: true,
      mode: "python",
      pythonImage: result.data,
    });
    setRenderError(null);
    notify(
      edit === null
        ? "Restored source artist styling."
        : "Applied artist edits."
    );
  } catch (error) {
    setRenderError(
      friendlyRenderIssue(
        error instanceof Error ? error.message : String(error),
        "Python"
      )
    );
  } finally {
    setRendering(false);
  }
}
