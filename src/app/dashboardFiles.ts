import { DashboardItem } from "./types";
import {
  isDashboardDropFile,
  dashboardFileMime,
  smartDashboardFileSize,
  snapDashboardValue,
} from "./dashboardUtils";
import { readFileAsDataUrl } from "./exportUtils";

export function parseDashboardDropPayload(dt: DataTransfer): { graphId: string; assetId: string } {
  const plain = dt.getData("text/plain");
  const graphId = dt.getData("text/graph-tab") || dt.getData("application/x-iris-graph") || (plain.startsWith("graph:") ? plain.slice(6) : "");
  const assetId = dt.getData("text/asset-tab") || dt.getData("application/x-iris-asset") || (plain.startsWith("asset:") ? plain.slice(6) : "");
  return { graphId, assetId };
}

export async function processDroppedDashboardFiles(
  files: File[],
  canvas: HTMLElement,
  clientX: number,
  clientY: number
): Promise<DashboardItem[]> {
  const accepted = files.filter(isDashboardDropFile);
  if (accepted.length === 0) return [];

  const rect = canvas.getBoundingClientRect();
  const nextItems: DashboardItem[] = [];

  for (const [index, file] of accepted.entries()) {
    const dataUrl = await readFileAsDataUrl(file);
    const size = await smartDashboardFileSize(file, dataUrl);
    nextItems.push({
      id: `dash-file-${Date.now()}-${index}`,
      kind: "file",
      fileName: file.name,
      fileDataUrl: dataUrl,
      fileMime: dashboardFileMime(file),
      x: snapDashboardValue(clientX - rect.left - size.w / 2 + index * 24),
      y: snapDashboardValue(clientY - rect.top - size.h / 2 + index * 24),
      w: size.w,
      h: size.h,
    });
  }

  return nextItems;
}
