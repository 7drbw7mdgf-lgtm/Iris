import { Dataset } from "../../types";

export type CellValue = string | number | null;
export type Selection = { r: number; c: number };
export type RangeBounds = { r1: number; r2: number; c1: number; c2: number };
export type SortState = { column: string; direction: "asc" | "desc" };
export type SheetContextMenu = { x: number; y: number; r: number; c: number; kind: "cell" | "row" | "column" | "corner" } | null;
export type ResizeDrag = { column: string; startX: number; startWidth: number };
export type CellFormat = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  bg?: string;
  color?: string;
  align?: "left" | "center" | "right";
  numFormat?: "general" | "number" | "currency" | "percent" | "scientific";
  decimals?: number;
};
export type FillDrag = { source: RangeBounds; target: RangeBounds } | null;
export type InternalClipboard = { matrix: CellValue[][]; text: string; html: string; cut: boolean; source?: RangeBounds } | null;
export type PasteDialogState = { open: boolean; transpose: boolean; start: Selection; text: string };

export function formatCellValue(raw: CellValue, format?: CellFormat): string {
  if (raw === null || raw === undefined || raw === "") return "";
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(/,/g, ""));
  if (Number.isFinite(n) && typeof raw === "number") {
    const decimals = format?.decimals ?? (format?.numFormat === "currency" || format?.numFormat === "number" ? 2 : undefined);
    switch (format?.numFormat) {
      case "currency":
        return `$${n.toLocaleString(undefined, { minimumFractionDigits: decimals ?? 2, maximumFractionDigits: decimals ?? 2 })}`;
      case "percent":
        return `${(n * 100).toLocaleString(undefined, { minimumFractionDigits: decimals ?? 1, maximumFractionDigits: decimals ?? 1 })}%`;
      case "scientific":
        return n.toExponential(decimals ?? 2);
      case "number":
        return n.toLocaleString(undefined, { minimumFractionDigits: decimals ?? 2, maximumFractionDigits: decimals ?? 2 });
      default:
        return decimals !== undefined ? n.toFixed(decimals) : String(raw);
    }
  }
  return String(raw);
}

export function columnLetter(index: number): string {
  let n = Math.max(0, index) + 1;
  let label = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

export interface LinkedGraphInfo {
  id: string;
  title: string;
  chartType?: string;
  xVar?: string;
  yVar?: string;
}

export interface DataPanelProps {
  dataset: Dataset;
  onImportFile: (file: File) => void;
  onEdit: (ds: Dataset) => void;
  onCreateGraphFromCode?: (code: string) => Promise<void> | void;
  collapsed: boolean;
  showAllRows?: boolean;
  showFields?: boolean;
  linkedGraphs?: LinkedGraphInfo[];
  activeGraphId?: string;
  onOpenGraph?: (graphId: string) => void;
  onCreateGraphFromColumns?: (xCol?: string, yCol?: string) => void;
  onAssignColumnToShelf?: (col: string, shelf: "x" | "y" | "color") => void;
}
