import { useState, useCallback, RefObject } from "react";
import { save } from "@tauri-apps/plugin-dialog";
import { writeBase64File } from "../../tauri";
import { Dataset } from "../../types";
import {
  DashboardExportRect,
  DashboardExportFormat,
  DashboardExportDialogState,
  CLOSED_DASHBOARD_EXPORT_DIALOG,
} from "../types";
import {
  safeFileName,
  dataUrlToBase64,
  makeDashboardPdfBase64,
  captureDashboardArea,
} from "../exportUtils";

export interface UseDashboardExportProps {
  dataset: Dataset;
  dashboardCanvasRef: RefObject<HTMLDivElement | null>;
  notify?: (msg: string) => void;
  showExportSuccess?: (path: string) => void;
  setAppView?: (view: "workspace" | "dashboard") => void;
}

export function useDashboardExport(props: UseDashboardExportProps) {
  const { dataset, dashboardCanvasRef, notify, showExportSuccess, setAppView } = props;

  const [dashboardExportSelecting, setDashboardExportSelecting] = useState(false);
  const [dashboardExportSelection, setDashboardExportSelection] = useState<DashboardExportRect | null>(null);
  const [dashboardExportDrag, setDashboardExportDrag] = useState<{
    startX: number;
    startY: number;
    x: number;
    y: number;
  } | null>(null);
  const [dashboardExportDialog, setDashboardExportDialog] = useState<DashboardExportDialogState>(
    CLOSED_DASHBOARD_EXPORT_DIALOG
  );

  const beginDashboardExportSelection = () => {
    setAppView?.("dashboard");
    setDashboardExportDialog(CLOSED_DASHBOARD_EXPORT_DIALOG);
    setDashboardExportSelection(null);
    setDashboardExportDrag(null);
    setDashboardExportSelecting(true);
    notify?.("Drag over the dashboard area to export.");
  };

  const renderDashboardExportPreview = useCallback(
    async (settings = dashboardExportDialog) => {
      if (!settings.rect) return;
      setDashboardExportDialog((d) => ({ ...d, busy: true, error: "", previewData: "" }));
      try {
        const capture = await captureDashboardArea(dashboardCanvasRef.current, settings.rect);
        setDashboardExportDialog((d) => ({
          ...d,
          busy: false,
          previewData: dataUrlToBase64(capture.pngDataUrl),
          error: "",
        }));
      } catch (e) {
        setDashboardExportDialog((d) => ({ ...d, busy: false, previewData: "", error: String(e) }));
      }
    },
    [dashboardCanvasRef, dashboardExportDialog]
  );

  const finishDashboardExportSelection = async (rect?: DashboardExportRect | null) => {
    const canvas = dashboardCanvasRef.current;
    if (!canvas) return;
    const fallback: DashboardExportRect = {
      x: canvas.scrollLeft,
      y: canvas.scrollTop,
      w: Math.min(canvas.clientWidth, canvas.scrollWidth || canvas.clientWidth),
      h: Math.min(canvas.clientHeight, canvas.scrollHeight || canvas.clientHeight),
    };
    const selected = rect && rect.w >= 24 && rect.h >= 24 ? rect : fallback;
    setDashboardExportSelecting(false);
    setDashboardExportSelection(selected);
    const next: DashboardExportDialogState = {
      ...CLOSED_DASHBOARD_EXPORT_DIALOG,
      open: true,
      format: "pdf" as DashboardExportFormat,
      rect: selected,
      busy: true,
    };
    setDashboardExportDialog(next);
    await renderDashboardExportPreview(next);
  };

  const confirmDashboardExport = async () => {
    if (!dashboardExportDialog.rect || !dashboardExportDialog.previewData || dashboardExportDialog.error) return;
    const path = await save({
      title: "Export dashboard area",
      defaultPath: `${safeFileName(dataset.name || "dashboard", "dashboard")}.${dashboardExportDialog.format}`,
      filters: [
        { name: "PDF document", extensions: ["pdf"] },
        { name: "PNG image", extensions: ["png"] },
      ],
    });
    if (!path) return;
    setDashboardExportDialog((d) => ({ ...d, busy: true, error: "" }));
    try {
      const capture = await captureDashboardArea(dashboardCanvasRef.current, dashboardExportDialog.rect);
      const ext = path.split(".").pop()?.toLowerCase();
      const targetFormat: DashboardExportFormat = ext === "png" || ext === "pdf" ? ext : dashboardExportDialog.format;
      const data =
        targetFormat === "pdf"
          ? makeDashboardPdfBase64(capture.jpegDataUrl, capture.width, capture.height)
          : dataUrlToBase64(capture.pngDataUrl);
      const written = await writeBase64File(path, data);
      if (!written.success) throw new Error(written.error || "Could not save dashboard export.");
      setDashboardExportDialog(CLOSED_DASHBOARD_EXPORT_DIALOG);
      setDashboardExportSelection(null);
      showExportSuccess?.(path);
    } catch (e) {
      setDashboardExportDialog((d) => ({ ...d, busy: false, error: String(e) }));
    }
  };

  return {
    dashboardExportSelecting,
    setDashboardExportSelecting,
    dashboardExportSelection,
    setDashboardExportSelection,
    dashboardExportDrag,
    setDashboardExportDrag,
    dashboardExportDialog,
    setDashboardExportDialog,
    beginDashboardExportSelection,
    finishDashboardExportSelection,
    renderDashboardExportPreview,
    confirmDashboardExport,
  };
}
