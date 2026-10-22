import { useState, useRef, useEffect, useCallback } from "react";
import { FriendlyRenderIssue } from "../../types";
import {
  rendererStatus,
  renderPlot,
  renderPythonPlot,
  repairPythonEnv,
  installRSvglite,
  RendererStatus,
  PythonArtist,
} from "../../tauri";
import { GraphState } from "../types";
import { friendlyRenderIssue, friendlyRenderAlert } from "../renderErrorUtils";
import { rStyleOverlay } from "../../rgen";
import { pythonStyleOverlay } from "../../pgen";

export function renderTimeout<T>(
  promise: Promise<T>,
  label: string,
  seconds = 95
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${seconds} seconds.`)),
        seconds * 1000
      )
    ),
  ]);
}

export interface UseScriptRendererProps {
  activeGraph: GraphState;
  activeGraphId: string;
  updateGraph: (id: string, patch: Partial<GraphState>) => void;
  figW: number;
  figH: number;
  dpi: number;
  styleOverridesCode: boolean;
  generatedCode: string;
  pythonCode: string;
  notify?: (msg: string) => void;
}

export function useScriptRenderer(props: UseScriptRendererProps) {
  const {
    activeGraph,
    activeGraphId,
    updateGraph,
    figW,
    figH,
    dpi,
    styleOverridesCode,
    generatedCode,
    pythonCode,
    notify,
  } = props;

  const [rendering, setRendering] = useState(false);
  const [rStatus, setRStatus] = useState<{ ok: boolean; text: string }>({
    ok: true,
    text: "checking R...",
  });
  const [rendererPanelOpen, setRendererPanelOpen] = useState(false);
  const [rendererInfo, setRendererInfo] = useState<RendererStatus | null>(null);
  const [rendererError, setRendererError] = useState<string>("");
  const [rendererBusy, setRendererBusy] = useState<string>("");
  const [autoRender, setAutoRender] = useState(true);
  const [renderError, setRenderError] = useState<FriendlyRenderIssue | null>(null);
  const [loadedScriptDir, setLoadedScriptDir] = useState<string>("");
  const [pythonArtists, setPythonArtists] = useState<Record<string, PythonArtist[]>>({});
  const [selectedPythonArtist, setSelectedPythonArtist] = useState<{
    graphId: string;
    key: string;
  } | null>(null);
  const [hoveredPythonArtistKey, setHoveredPythonArtistKey] = useState<string | null>(null);
  const [splitArtistBox, setSplitArtistBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const lastAutoKeyRef = useRef<string>("");

  const escDir = (d: string) => d.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const pyPathShim = useCallback(
    (codeMode: boolean) =>
      codeMode && loadedScriptDir
        ? `import os as _iris_os\ntry:\n    _iris_os.chdir("${escDir(
            loadedScriptDir
          )}")\nexcept Exception:\n    pass\n__file__ = "${escDir(
            loadedScriptDir
          )}/loaded_script.py"\n`
        : "",
    [loadedScriptDir]
  );

  const rPathShim = useCallback(
    (codeMode: boolean) =>
      codeMode && loadedScriptDir
        ? `try(setwd("${escDir(loadedScriptDir)}"), silent = TRUE)\n`
        : "",
    [loadedScriptDir]
  );

  const rRenderCode = useCallback(() => {
    const baseCode =
      activeGraph.rCodeDirty || activeGraph.loadedRScriptName
        ? activeGraph.rCode
        : generatedCode;
    const codeMode = activeGraph.scriptBacked || !!activeGraph.loadedRScriptName;
    const withShim = rPathShim(codeMode) + baseCode;
    return styleOverridesCode && codeMode
      ? withShim + rStyleOverlay(activeGraph.spec)
      : withShim;
  }, [
    activeGraph.rCodeDirty,
    activeGraph.loadedRScriptName,
    activeGraph.rCode,
    activeGraph.scriptBacked,
    activeGraph.spec,
    generatedCode,
    rPathShim,
    styleOverridesCode,
  ]);

  const pyRenderCode = useCallback(() => {
    const codeMode =
      activeGraph.scriptBacked || !!activeGraph.loadedPythonScriptName;
    const withShim = pyPathShim(codeMode) + pythonCode;
    return styleOverridesCode && codeMode
      ? withShim + pythonStyleOverlay(activeGraph.spec)
      : withShim;
  }, [
    activeGraph.scriptBacked,
    activeGraph.loadedPythonScriptName,
    activeGraph.spec,
    pyPathShim,
    pythonCode,
    styleOverridesCode,
  ]);

  const refreshRendererStatus = useCallback(async () => {
    setRendererError("");
    setRendererInfo(null);
    try {
      const info = await Promise.race([
        rendererStatus(),
        new Promise<RendererStatus>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 12000)
        ),
      ]);
      setRendererInfo(info);
      const rOk = info.r_found && info.r_ggplot2;
      setRStatus({
        ok: rOk,
        text: rOk
          ? info.r_version || "R ready"
          : info.r_found
          ? "R found, ggplot2 missing"
          : "R not found",
      });
    } catch {
      setRendererInfo(null);
      setRendererError(
        "Couldn't reach the renderer. This needs the packaged Iris app (the backend isn't available in a browser dev preview)."
      );
    }
  }, []);

  const openRendererPanel = useCallback(() => {
    setRendererPanelOpen(true);
    void refreshRendererStatus();
  }, [refreshRendererStatus]);

  const runRendererRepair = useCallback(
    async (which: "python" | "svglite") => {
      setRendererBusy(which);
      try {
        const r =
          which === "python" ? await repairPythonEnv() : await installRSvglite();
        if (!r.success) {
          alert(
            `${
              which === "python" ? "Python environment" : "svglite install"
            } failed:\n\n${r.stderr || r.stdout}`
          );
        } else {
          notify?.(
            which === "python"
              ? "Python renderer ready."
              : "svglite installed — SVG export enabled."
          );
        }
        await refreshRendererStatus();
      } finally {
        setRendererBusy("");
      }
    },
    [notify, refreshRendererStatus]
  );

  const renderGgplot = useCallback(
    async (silent = false) => {
      setRendering(true);
      try {
        const code = rRenderCode();
        const r = await renderTimeout(
          renderPlot({ code, format: "png", width: figW, height: figH, dpi }),
          "R render"
        );
        if (r.success) {
          setRenderError(null);
          updateGraph(activeGraphId, { ggplotImage: r.data, mode: "ggplot" });
        } else {
          const issue = friendlyRenderIssue(r.stderr || "R render failed.", "R");
          setRenderError(issue);
          if (!silent) alert(friendlyRenderAlert(issue));
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        const issue = friendlyRenderIssue(message, "R");
        setRenderError(issue);
        if (!silent) alert(friendlyRenderAlert(issue));
      } finally {
        setRendering(false);
      }
    },
    [activeGraphId, dpi, figH, figW, rRenderCode, updateGraph]
  );

  const renderPython = useCallback(
    async (silent = false) => {
      setRendering(true);
      try {
        const r = await renderTimeout(
          renderPythonPlot({
            code: pyRenderCode(),
            format: "png",
            width: figW,
            height: figH,
            dpi,
          }),
          "Python render"
        );
        if (r.success) {
          setRenderError(null);
          setPythonArtists((current) => ({
            ...current,
            [activeGraphId]: r.artists ?? [],
          }));
          updateGraph(activeGraphId, { pythonImage: r.data, mode: "python" });
        } else {
          const issue = friendlyRenderIssue(
            r.stderr || "Python render failed.",
            "Python"
          );
          setRenderError(issue);
          if (!silent) alert(friendlyRenderAlert(issue));
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        const issue = friendlyRenderIssue(message, "Python");
        setRenderError(issue);
        if (!silent) alert(friendlyRenderAlert(issue));
      } finally {
        setRendering(false);
      }
    },
    [activeGraphId, dpi, figH, figW, pyRenderCode, updateGraph]
  );

  useEffect(() => {
    if (activeGraph.showBottom && !rendererInfo && !rendererError) {
      void refreshRendererStatus();
    }
  }, [activeGraph.showBottom, rendererInfo, rendererError, refreshRendererStatus]);

  return {
    rendering,
    setRendering,
    rStatus,
    setRStatus,
    rendererPanelOpen,
    setRendererPanelOpen,
    rendererInfo,
    setRendererInfo,
    rendererError,
    setRendererError,
    rendererBusy,
    setRendererBusy,
    autoRender,
    setAutoRender,
    renderError,
    setRenderError,
    loadedScriptDir,
    setLoadedScriptDir,
    pythonArtists,
    setPythonArtists,
    selectedPythonArtist,
    setSelectedPythonArtist,
    hoveredPythonArtistKey,
    setHoveredPythonArtistKey,
    splitArtistBox,
    setSplitArtistBox,
    lastAutoKeyRef,
    rRenderCode,
    pyRenderCode,
    pyPathShim,
    rPathShim,
    refreshRendererStatus,
    openRendererPanel,
    runRendererRepair,
    renderGgplot,
    renderPython,
  };
}
