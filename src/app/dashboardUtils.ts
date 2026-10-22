import { DashboardItem, GraphState, AssetState, DashboardExportRect, AssetPanelPosition } from "./types";
import { imageDataUrlSize } from "./exportUtils";

export const DASHBOARD_GRID_SIZE = 24;
export const DASHBOARD_MIN_CARD_WIDTH = 312;
export const DASHBOARD_MIN_CARD_HEIGHT = 240;
export const ASSET_PANEL_GRID_SIZE = 16;
export const ASSET_PANEL_WIDTH = 460;
export const ASSET_PANEL_HEIGHT = 330;
export const ASSET_DASHBOARD_PANEL_WIDTH = 320;
export const ASSET_DASHBOARD_PANEL_HEIGHT = 238;

export const snapDashboardValue = (value: number) =>
  Math.max(0, Math.round(value / DASHBOARD_GRID_SIZE) * DASHBOARD_GRID_SIZE);

export const snapDashboardSize = (value: number, min: number) =>
  Math.max(min, Math.round(value / DASHBOARD_GRID_SIZE) * DASHBOARD_GRID_SIZE);

export const snapAssetPanelValue = (value: number) =>
  Math.max(0, Math.round(value / ASSET_PANEL_GRID_SIZE) * ASSET_PANEL_GRID_SIZE);

export const saneDashboardNumber = (value: number, fallback: number) =>
  Number.isFinite(value) ? value : fallback;

export const saneAssetPanelGap = (value: number | undefined) =>
  Math.max(0, Math.min(96, Number.isFinite(value) ? Number(value) : 18));

export const saneAssetPanelScale = (value: number | undefined) =>
  Math.max(0.45, Math.min(1.8, Number.isFinite(value) ? Number(value) : 1));

export function defaultAssetPanelPosition(index: number, compact = false, gap = compact ? 18 : 24): AssetPanelPosition {
  const width = compact ? ASSET_DASHBOARD_PANEL_WIDTH : ASSET_PANEL_WIDTH;
  const height = compact ? ASSET_DASHBOARD_PANEL_HEIGHT : ASSET_PANEL_HEIGHT;
  const columns = compact ? 2 : 3;
  return {
    x: 16 + (index % columns) * (width + gap),
    y: 16 + Math.floor(index / columns) * (height + gap),
    scale: 1,
  };
}

export function assetPanelCanvasSize(
  count: number,
  compact = false,
  gap = compact ? 18 : 24,
  positions: AssetPanelPosition[] = []
): { width: number; height: number } {
  const width = compact ? ASSET_DASHBOARD_PANEL_WIDTH : ASSET_PANEL_WIDTH;
  const height = compact ? ASSET_DASHBOARD_PANEL_HEIGHT : ASSET_PANEL_HEIGHT;
  const columns = compact ? 2 : 3;
  const rows = Math.max(1, Math.ceil(count / columns));
  const freeformBounds = positions.reduce(
    (bounds, position) => {
      const scale = saneAssetPanelScale(position.scale);
      return {
        width: Math.max(bounds.width, position.x + width * scale + 32),
        height: Math.max(bounds.height, position.y + height * scale + 32),
      };
    },
    { width: 0, height: 0 }
  );
  return {
    width: Math.max(32 + Math.min(count, columns) * width + Math.max(0, Math.min(count, columns) - 1) * gap, freeformBounds.width),
    height: Math.max(32 + rows * height + Math.max(0, rows - 1) * gap, freeformBounds.height),
  };
}

export function normalizeDashboardItem(item: DashboardItem): DashboardItem {
  const kind = item.kind ?? (item.fileDataUrl ? "file" : item.assetId ? "asset" : item.graphId ? "graph" : "text");
  const isPanelLabel = kind === "text" && item.textTitle === "Panel label";
  const fallbackWidth = kind === "text" ? (isPanelLabel ? 72 : 360) : kind === "file" ? 420 : 552;
  const fallbackHeight = kind === "text" ? (isPanelLabel ? 48 : 72) : kind === "file" ? 320 : 360;
  const minWidth = kind === "text" ? (isPanelLabel ? 48 : 72) : kind === "file" ? 96 : DASHBOARD_MIN_CARD_WIDTH;
  const minHeight = kind === "text" ? (isPanelLabel ? 48 : 24) : kind === "file" ? 96 : DASHBOARD_MIN_CARD_HEIGHT;
  return {
    ...item,
    kind,
    x: snapDashboardValue(saneDashboardNumber(item.x, 24)),
    y: snapDashboardValue(saneDashboardNumber(item.y, 24)),
    w: snapDashboardSize(saneDashboardNumber(item.w, fallbackWidth), minWidth),
    h: snapDashboardSize(saneDashboardNumber(item.h, fallbackHeight), minHeight),
    textTitle: item.textTitle ?? (kind === "text" ? "Textbox" : undefined),
    text: item.text ?? (kind === "text" ? "Figure legend. Describe the key comparison, n, test, and visual encoding here." : undefined),
    textSize: saneDashboardNumber(item.textSize ?? NaN, 13),
    textFontFamily: item.textFontFamily ?? "Helvetica",
    textColor: item.textColor ?? "#1f2937",
    textAlign: item.textAlign ?? "left",
    bold: item.bold ?? false,
    italic: item.italic ?? false,
    panelLabel: item.panelLabel ?? "",
    fileName: item.fileName,
    fileDataUrl: item.fileDataUrl,
    fileMime: item.fileMime,
    splitSourceGraphId: item.splitSourceGraphId,
    splitSourceName: item.splitSourceName,
  };
}

export function visibleDashboardItems(
  items: DashboardItem[],
  graphs: Record<string, GraphState>,
  assets: Record<string, AssetState>,
  fallbackGraphId: string
): DashboardItem[] {
  const validItems = items
    .map(normalizeDashboardItem)
    .filter((item) => {
      if (item.kind === "text") return true;
      if (item.kind === "file") return !!item.fileDataUrl;
      return item.kind === "asset" ? !!item.assetId && !!assets[item.assetId] : !!item.graphId && !!graphs[item.graphId];
    });

  if (validItems.length > 0 || items.length === 0 || !graphs[fallbackGraphId]) return validItems;
  return [{ id: "dash-recovered", kind: "graph", graphId: fallbackGraphId, x: 24, y: 24, w: 552, h: 360 }];
}

export function dashboardRectsIntersect(a: DashboardExportRect, b: DashboardExportRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function dashboardFileMime(file: File): string {
  const name = file.name.toLowerCase();
  if (file.type) return file.type;
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".tif") || name.endsWith(".tiff")) return "image/tiff";
  return "";
}

export function isDashboardDropFile(file: File): boolean {
  const mime = dashboardFileMime(file);
  return mime === "application/pdf" || ["image/png", "image/jpeg", "image/tiff"].includes(mime);
}

export async function smartDashboardFileSize(file: File, dataUrl: string): Promise<{ w: number; h: number }> {
  const mime = dashboardFileMime(file);
  const maxW = 640;
  const maxH = 460;
  if (mime.startsWith("image/")) {
    const size = await imageDataUrlSize(dataUrl);
    if (size && size.width > 0 && size.height > 0) {
      const scale = Math.min(maxW / size.width, maxH / size.height, 1);
      return {
        w: snapDashboardSize(Math.max(144, size.width * scale), 96),
        h: snapDashboardSize(Math.max(120, size.height * scale), 96),
      };
    }
  }
  if (mime === "application/pdf") return { w: snapDashboardSize(420, 96), h: snapDashboardSize(540, 96) };
  return { w: snapDashboardSize(360, 96), h: snapDashboardSize(280, 96) };
}
