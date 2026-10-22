import { useState, MutableRefObject, Dispatch, SetStateAction } from "react";
import { Dataset, defaultSpec } from "../../types";
import { renderPlot, renderPythonPlot } from "../../tauri";
import {
  CodePostDialogState,
  CLOSED_CODE_POST_DIALOG,
  GraphState,
  GraphLibrary,
  WorkspaceTab,
} from "../types";
import { makeGraphState } from "../graphStateUtils";
import { inferSpecFromCode } from "../specInference";
import { inferPythonLibraryFromCode } from "../scriptSyncPython";
import { renderTimeout } from "./useScriptRenderer";
import { friendlyRenderIssue, friendlyRenderAlert } from "../renderErrorUtils";

export interface UseCodePostDialogProps {
  activeGraphDataset: Dataset;
  sourceDataTabId: string;
  tabCounterRef: MutableRefObject<number>;
  figW: number;
  figH: number;
  dpi: number;
  setWorkspaceTabs: Dispatch<SetStateAction<WorkspaceTab[]>>;
  setGraphStates: Dispatch<SetStateAction<Record<string, GraphState>>>;
  setActiveTabId: (id: string) => void;
  setAppView: (view: "workspace" | "dashboard") => void;
  setRendering: (rendering: boolean) => void;
  setRenderError: (error: any) => void;
  notify: (msg: string) => void;
}

export function useCodePostDialog(props: UseCodePostDialogProps) {
  const {
    activeGraphDataset,
    sourceDataTabId,
    tabCounterRef,
    figW,
    figH,
    dpi,
    setWorkspaceTabs,
    setGraphStates,
    setActiveTabId,
    setAppView,
    setRendering,
    setRenderError,
    notify,
  } = props;

  const [codePostDialog, setCodePostDialog] = useState<CodePostDialogState>(
    CLOSED_CODE_POST_DIALOG
  );

  const createGraphFromCodePayload = async (
    codeRaw: string,
    titleRaw: string,
    language: "r" | "python",
    renderNow: boolean
  ) => {
    const code = codeRaw.trim();
    if (!code) return { success: false, error: "Paste R or Python code first." };
    const n = tabCounterRef.current++;
    const id = `graph-${n}`;
    const title = titleRaw.trim() || `Code Graph ${n}`;
    const isPython = language === "python";
    const graphLibrary: GraphLibrary = isPython
      ? inferPythonLibraryFromCode(code)
      : "ggplot2";
    const inferredSpec = {
      ...defaultSpec(activeGraphDataset),
      ...inferSpecFromCode(code, activeGraphDataset),
      title,
    };
    const nextGraph = makeGraphState(
      activeGraphDataset,
      isPython
        ? {
            spec: inferredSpec,
            sourceDataTabId,
            scriptBacked: true,
            graphLibrary,
            mode: "python",
            pythonCodeOverride: code,
            pythonCodeDirty: true,
            loadedPythonScriptName: null,
            showBottom: true,
          }
        : {
            spec: inferredSpec,
            sourceDataTabId,
            scriptBacked: true,
            graphLibrary: "ggplot2",
            mode: "ggplot",
            rCode: code,
            rCodeDirty: true,
            loadedRScriptName: title,
            showBottom: true,
          }
    );
    setWorkspaceTabs((tabs) => [...tabs, { id, type: "graph", title }]);
    setGraphStates((states) => ({ ...states, [id]: nextGraph }));
    setActiveTabId(id);
    setAppView("workspace");
    if (!renderNow) {
      notify(
        `Created ${title} with fast live preview. Use Render for final code output.`
      );
      return { success: true, id, title };
    }
    setRendering(true);
    let result;
    try {
      result = isPython
        ? await renderTimeout(
            renderPythonPlot({
              code,
              format: "png",
              width: figW,
              height: figH,
              dpi,
            }),
            "Python render"
          )
        : await renderTimeout(
            renderPlot({ code, format: "png", width: figW, height: figH, dpi }),
            "R render"
          );
    } catch (e) {
      result = {
        success: false,
        data: "",
        stderr: e instanceof Error ? e.message : String(e),
        format: "png",
        saved_to: null,
      };
    } finally {
      setRendering(false);
    }
    if (result.success) {
      setGraphStates((states) => ({
        ...states,
        [id]: isPython
          ? { ...states[id], pythonImage: result.data, mode: "python" }
          : { ...states[id], ggplotImage: result.data, mode: "ggplot" },
      }));
      notify(`Created and rendered ${title}.`);
      return { success: true, id, title };
    }
    const issue = friendlyRenderIssue(
      result.stderr ||
        "Render failed. The code-backed figure was still created so you can edit the script.",
      isPython ? "Python" : "R"
    );
    setRenderError(issue);
    return { success: false, id, title, error: friendlyRenderAlert(issue) };
  };

  const createGraphFromPostedCode = async () => {
    const code = codePostDialog.code.trim();
    if (!code) {
      setCodePostDialog((d) => ({ ...d, error: "Paste R or Python code first." }));
      return;
    }
    setCodePostDialog((d) => ({ ...d, busy: d.renderNow, error: "" }));
    const result = await createGraphFromCodePayload(
      code,
      codePostDialog.title,
      codePostDialog.language,
      codePostDialog.renderNow
    );
    setCodePostDialog((d) => ({ ...d, busy: false }));
    if (result.success) {
      setCodePostDialog(CLOSED_CODE_POST_DIALOG);
    } else {
      setCodePostDialog((d) => ({
        ...d,
        error:
          result.error ||
          "Render failed. The code-backed figure was still created so you can edit the script.",
      }));
    }
  };

  const createGraphDirectlyFromDataCode = async (code: string) => {
    const looksPython =
      /\b(import|from)\s+\w+|px\.|sns\.|plt\.|pd\.DataFrame|base64\.b64decode|zlib\.decompress/i.test(
        code
      );
    const looksR = /\bggplot\s*\(|geom_|library\s*\(|data\.frame\s*\(/i.test(code);
    const language: "r" | "python" =
      looksPython && !looksR ? "python" : looksR ? "r" : "python";
    const result = await createGraphFromCodePayload(
      code,
      "Code graph",
      language,
      true
    );
    if (!result.success) alert(result.error);
  };

  return {
    codePostDialog,
    setCodePostDialog,
    createGraphFromCodePayload,
    createGraphFromPostedCode,
    createGraphDirectlyFromDataCode,
  };
}
