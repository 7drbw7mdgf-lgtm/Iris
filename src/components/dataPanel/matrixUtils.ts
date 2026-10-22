import { Dataset } from "../../types";
import { CellValue, RangeBounds } from "./types";

export function normalizeMatrix(matrix: CellValue[][]): CellValue[][] {
  const nonEmpty = matrix.filter((row) => row.some((value) => String(value ?? "").trim() !== ""));
  const width = Math.max(0, ...nonEmpty.map((row) => row.length));
  if (!width) return [];
  return nonEmpty.map((row) => Array.from({ length: width }, (_, index) => row[index] ?? ""));
}

export function parseDelimitedMatrix(text: string): CellValue[][] {
  const cleaned = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n$/, "");
  if (!cleaned.trim()) return [];
  const firstLine = cleaned.split("\n", 1)[0] ?? "";
  const delimiter = cleaned.includes("\t") ? "\t" : firstLine.includes(";") && !firstLine.includes(",") ? ";" : firstLine.includes(",") ? "," : "\t";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    const next = cleaned[i + 1];
    if (quoted) {
      if (ch === "\"" && next === "\"") {
        cell += "\"";
        i++;
      } else if (ch === "\"") {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === "\"") {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  rows.push(row);
  return normalizeMatrix(rows);
}

export function htmlTableMatrix(html: string): CellValue[][] {
  if (!html.trim()) return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const tableRows = Array.from(doc.querySelectorAll("tr"));
  if (!tableRows.length) return [];
  const matrix: CellValue[][] = [];
  const rowSpans: Array<{ value: CellValue; remaining: number }> = [];
  tableRows.forEach((tr) => {
    const row: CellValue[] = [];
    let cIndex = 0;
    const flushSpans = () => {
      while (rowSpans[cIndex]?.remaining) {
        row[cIndex] = rowSpans[cIndex].value;
        rowSpans[cIndex].remaining -= 1;
        cIndex += 1;
      }
    };
    Array.from(tr.querySelectorAll("th,td")).forEach((cell) => {
      flushSpans();
      const value = cell.textContent?.trim() ?? "";
      const colSpan = Math.max(1, Number(cell.getAttribute("colspan")) || 1);
      const rowSpan = Math.max(1, Number(cell.getAttribute("rowspan")) || 1);
      for (let offset = 0; offset < colSpan; offset++) {
        row[cIndex + offset] = value;
        if (rowSpan > 1) rowSpans[cIndex + offset] = { value, remaining: rowSpan - 1 };
      }
      cIndex += colSpan;
    });
    flushSpans();
    matrix.push(row);
  });
  return normalizeMatrix(matrix);
}

export function clipboardMatrixFromEvent(data: DataTransfer): CellValue[][] {
  const html = data.getData("text/html");
  const htmlMatrix = htmlTableMatrix(html);
  if (htmlMatrix.length) return htmlMatrix;
  return parseDelimitedMatrix(data.getData("text/plain"));
}

export function transposeMatrix(matrix: CellValue[][]): CellValue[][] {
  return normalizeMatrix(
    Array.from({ length: Math.max(0, ...matrix.map((row) => row.length)) }, (_, cIndex) => matrix.map((row) => row[cIndex] ?? "")),
  );
}

export function clearRangeInRows(rows: Dataset["rows"], columns: string[], range: RangeBounds): void {
  for (let r = range.r1; r <= range.r2; r++) {
    if (!rows[r]) continue;
    for (let c = range.c1; c <= range.c2; c++) {
      const col = columns[c];
      if (col) rows[r][col] = null;
    }
  }
}

export function matrixToDelimited(matrix: CellValue[][], delimiter = "\t"): string {
  return matrix.map((row) => row.map((value) => {
    const text = String(value ?? "");
    if (!text.includes(delimiter) && !/[\n"]/.test(text)) return text;
    return `"${text.replace(/"/g, "\"\"")}"`;
  }).join(delimiter)).join("\n");
}

export function matrixToHtmlTable(matrix: CellValue[][]): string {
  const escapeHtml = (text: string) => text.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[ch] || ch));
  return `<table>${matrix.map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(String(value ?? ""))}</td>`).join("")}</tr>`).join("")}</table>`;
}

export function computeDisplayRows(
  preview: Dataset["rows"],
  sort: { column: string; direction: "asc" | "desc" } | null,
  types: Dataset["types"]
): Array<{ row: Dataset["rows"][0]; originalIndex: number }> {
  const rows = preview.map((row, originalIndex) => ({ row, originalIndex }));
  if (!sort) return rows;
  const multiplier = sort.direction === "asc" ? 1 : -1;
  const isNumeric = types[sort.column] === "numeric";
  return [...rows].sort((a, b) => {
    const av = a.row[sort.column];
    const bv = b.row[sort.column];
    if (av == null && bv == null) return a.originalIndex - b.originalIndex;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (isNumeric) {
      const an = typeof av === "number" ? av : Number(String(av).replace(/,/g, ""));
      const bn = typeof bv === "number" ? bv : Number(String(bv).replace(/,/g, ""));
      if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return (an - bn) * multiplier;
    }
    return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" }) * multiplier;
  });
}
