import { useState, useCallback } from "react";
import { save } from "@tauri-apps/plugin-dialog";
import Plotly from "plotly.js-dist-min";
import { Dataset, FriendlyRenderIssue } from "../../types";
import { renderPlot, renderPythonPlot, writeBase64File } from "../../tauri";
import { buildFigure } from "../../plotlyGen";
import {
  ExportDialogState,
  GraphState,
  CLOSED_EXPORT_DIALOG,
} from "../types";
import { dataUrlToBase64 } from "../exportUtils";
import { applyComponentColorOverrides } from "../graphMetaUtils";
import { friendlyRenderIssue, friendlyRenderAlert } from "../renderErrorUtils";
import { renderTimeout } from "./useScriptRenderer";

export interface UseExportFigureProps {
  activeGraph: GraphState;
  activeGraphDataset: Dataset;
  dataset: Dataset;
  figW: number;
  figH: number;
  dpi: number;
  isPlotlyLibrary: boolean;
  isAltairLibrary: boolean;
  generatedCode: string;
  rRenderCode: () => string;
  pyRenderCode: () => string;
  setExportSettings: React.Dispatch<
    React.SetStateAction<{ width: number; height: number; dpi: number }>
  >;
  setRenderError: (error: FriendlyRenderIssue | null) => void;
  showExportSuccess: (path: string) => void;
}

export function useExportFigure(props: UseExportFigureProps) {
  const {
    activeGraph,
    activeGraphDataset,
    dataset,
    figW,
    figH,
    dpi,
    isPlotlyLibrary,
    isAltairLibrary,
    generatedCode,
    rRenderCode,
    pyRenderCode,
    setExportSettings,
    setRenderError,
    showExportSuccess,
  } = props;

  const [exportDialog, setExportDialog] = useState<ExportDialogState>(
    CLOSED_EXPORT_DIALOG
  );

  const renderPlotlyExportData = async (
    format: "png" | "svg",
    width: number,
    height: number,
    dpiVal: number
  ): Promise<string> => {
    const { data, layout } = buildFigure(
      activeGraph.spec,
      activeGraphDataset
    );
    const styledData = applyComponentColorOverrides(
      data,
      activeGraph.componentColors
    );
    const widthPx = Math.round(width * dpiVal);
    const heightPx = Math.round(height * dpiVal);
    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "-10000px";
    host.style.top = "0";
    host.style.width = `${widthPx}px`;
    host.style.height = `${heightPx}px`;
    document.body.appendChild(host);
    try {
      await Plotly.newPlot(
        host,
        styledData,
        { ...layout, width: widthPx, height: heightPx } as any,
        { displaylogo: false } as any
      );
      const url = await (Plotly as any).toImage(host, {
        format,
        width: widthPx,
        height: heightPx,
        scale: 1,
      });
      return dataUrlToBase64(url);
    } finally {
      Plotly.purge(host);
      host.remove();
    }
  };

  const renderExportPreview = useCallback(
    async (settings = exportDialog) => {
      if (isAltairLibrary && !activeGraph.scriptBacked) {
        setExportDialog((d) => ({
          ...d,
          busy: false,
          error:
            "Altair export preview needs an Altair-specific renderer. Use the Python Code tab for now.",
          previewData: "",
        }));
        return;
      }
      setExportDialog((d) => ({ ...d, busy: true, error: "", previewData: "" }));
      try {
        const previewFormat: "png" | "svg" =
          settings.format === "svg" ? "svg" : "png";
        if (isPlotlyLibrary && !activeGraph.scriptBacked) {
          if (settings.format === "pdf")
            throw new Error(
              "Live Plotly export supports PNG and SVG. Choose SVG for vector output, or switch to ggplot2/Python for PDF."
            );
          const data = await renderPlotlyExportData(
            previewFormat,
            settings.width,
            settings.height,
            settings.dpi
          );
          setExportDialog((d) => ({
            ...d,
            busy: false,
            previewData: data,
            previewFormat,
            error: "",
          }));
          return;
        }
        const rCodeForRender = rRenderCode();
        const result =
          activeGraph.graphLibrary !== "ggplot2"
            ? await renderTimeout(
                renderPythonPlot({
                  code: pyRenderCode(),
                  format: previewFormat,
                  width: settings.width,
                  height: settings.height,
                  dpi: settings.dpi,
                }),
                "Python export preview"
              )
            : await renderTimeout(
                renderPlot({
                  code: rCodeForRender,
                  format: previewFormat,
                  width: settings.width,
                  height: settings.height,
                  dpi: settings.dpi,
                }),
                "R export preview"
              );
        if (!result.success)
          throw new Error(result.stderr || "Renderer did not produce a preview.");
        setExportDialog((d) => ({
          ...d,
          busy: false,
          previewData: result.data,
          previewFormat,
          error: "",
        }));
      } catch (e) {
        setExportDialog((d) => ({
          ...d,
          busy: false,
          previewData: "",
          error: String(e),
        }));
      }
    },
    [
      activeGraph.graphLibrary,
      activeGraph.scriptBacked,
      exportDialog,
      isAltairLibrary,
      isPlotlyLibrary,
      pyRenderCode,
      rRenderCode,
    ]
  );

  const openExportDialog = async () => {
    if (isAltairLibrary && !activeGraph.scriptBacked) {
      alert(
        "Altair code generation is available, but image export needs the Python packages altair and vl-convert-python installed."
      );
      return;
    }
    const next: ExportDialogState = {
      ...CLOSED_EXPORT_DIALOG,
      open: true,
      format: "png",
      width: figW,
      height: figH,
      dpi,
      busy: true,
    };
    setExportDialog(next);
    await renderExportPreview(next);
  };

  const confirmExportFigure = async () => {
    if (!exportDialog.previewData && !exportDialog.error) return;
    if (
      isPlotlyLibrary &&
      !activeGraph.scriptBacked &&
      exportDialog.format === "pdf"
    ) {
      setExportDialog((d) => ({
        ...d,
        error:
          "Live Plotly export supports PNG and SVG. Choose SVG for vector output.",
      }));
      return;
    }
    const path = await save({
      title: "Export figure",
      defaultPath: `${(
        activeGraph.spec.title ||
        activeGraph.loadedRScriptName ||
        dataset.name ||
        "figure"
      ).replace(/\s+/g, "_")}.${exportDialog.format}`,
      filters: [
        { name: "PNG image", extensions: ["png"] },
        { name: "PDF document", extensions: ["pdf"] },
        { name: "SVG vector", extensions: ["svg"] },
      ],
    });
    if (!path) return;
    const ext = path.split(".").pop()?.toLowerCase() || "png";
    setExportSettings({
      width: exportDialog.width,
      height: exportDialog.height,
      dpi: exportDialog.dpi,
    });
    if (isPlotlyLibrary && !activeGraph.scriptBacked) {
      try {
        if (ext === "pdf")
          throw new Error("Live Plotly export supports PNG and SVG.");
        const format = ext === "svg" ? "svg" : "png";
        const data =
          exportDialog.previewFormat === format && exportDialog.previewData
            ? exportDialog.previewData
            : await renderPlotlyExportData(
                format,
                exportDialog.width,
                exportDialog.height,
                exportDialog.dpi
              );
        const written = await writeBase64File(path, data);
        if (written.success) showExportSuccess(path);
        else alert("Export failed:\n\n" + written.error);
      } catch (e) {
        alert("Plotly export failed:\n\n" + e);
      }
      setExportDialog(CLOSED_EXPORT_DIALOG);
      return;
    }
    setExportDialog((d) => ({ ...d, busy: true, error: "" }));
    const rCodeForRender =
      activeGraph.rCodeDirty || activeGraph.loadedRScriptName
        ? activeGraph.rCode
        : generatedCode;
    try {
      const r =
        activeGraph.graphLibrary !== "ggplot2"
          ? await renderTimeout(
              renderPythonPlot({
                code: pyRenderCode(),
                format: ext,
                width: exportDialog.width,
                height: exportDialog.height,
                dpi: exportDialog.dpi,
                savePath: path,
              }),
              "Python export"
            )
          : await renderTimeout(
              renderPlot({
                code: rCodeForRender,
                format: ext,
                width: exportDialog.width,
                height: exportDialog.height,
                dpi: exportDialog.dpi,
                savePath: path,
              }),
              "R export"
            );
      if (r.success) {
        showExportSuccess(r.saved_to || path);
        setExportDialog(CLOSED_EXPORT_DIALOG);
      } else {
        const issue = friendlyRenderIssue(
          r.stderr || "Export failed.",
          activeGraph.graphLibrary !== "ggplot2" ? "Python" : "R"
        );
        setRenderError(issue);
        setExportDialog((d) => ({ ...d, error: friendlyRenderAlert(issue) }));
      }
    } catch (e) {
      const issue = friendlyRenderIssue(
        e instanceof Error ? e.message : String(e),
        activeGraph.graphLibrary !== "ggplot2" ? "Python" : "R"
      );
      setRenderError(issue);
      setExportDialog((d) => ({ ...d, error: friendlyRenderAlert(issue) }));
    } finally {
      setExportDialog((d) => ({ ...d, busy: false }));
    }
  };

  return {
    exportDialog,
    setExportDialog,
    renderPlotlyExportData,
    renderExportPreview,
    openExportDialog,
    confirmExportFigure,
  };
}
