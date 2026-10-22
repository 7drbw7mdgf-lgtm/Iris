import * as Papa from "papaparse";
import * as XLSX from "xlsx";
import type { Dataset } from "./types";

type Cell = string | number | null;

export function coerceCell(value: unknown): Cell {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value).trim();
  if (!raw) return null;
  const normalised = raw.replace(/,/g, "");
  const n = Number(normalised);
  return !isNaN(n) && /^[-+]?(\d+(\.\d*)?|\.\d+)(e[-+]?\d+)?$/i.test(normalised) ? n : raw;
}

export function uniqueColumns(values: unknown[]): string[] {
  const seen = new Map<string, number>();
  return values.map((value, i) => {
    const base = String(value ?? "").trim() || `Column ${i + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  });
}

export function rowLooksLikeHeader(row: string[], nextRows: string[][]): boolean {
  if (!row.length) return false;
  const nonEmpty = row.filter((v) => v.trim()).length;
  if (nonEmpty < Math.max(2, Math.ceil(row.length * 0.5))) return false;
  const textCells = row.filter((v) => isNaN(Number(v.replace(/,/g, "")))).length;
  const nextNumeric = nextRows
    .flat()
    .filter((v) => v.trim() && !isNaN(Number(v.replace(/,/g, "")))).length;
  return textCells >= Math.ceil(nonEmpty * 0.5) || nextNumeric >= nonEmpty;
}

export function detectDelimiter(lines: string[]): string | "whitespace" {
  const candidates = ["\t", ",", ";", "|"];
  let best = { delimiter: ",", score: 0 };
  for (const delimiter of candidates) {
    const counts = lines.map((line) => line.split(delimiter).length).filter((count) => count > 1);
    if (!counts.length) continue;
    const common = counts.sort((a, b) => a - b)[Math.floor(counts.length / 2)];
    const consistency = counts.filter((count) => Math.abs(count - common) <= 1).length;
    const score = common * consistency;
    if (score > best.score) best = { delimiter, score };
  }
  if (best.score > 0) return best.delimiter;

  const whitespaceRows = lines
    .map((line) => line.trim().split(/\s{2,}|\s+/).filter(Boolean).length)
    .filter((count) => count > 1);
  return whitespaceRows.length >= Math.max(2, Math.floor(lines.length * 0.5)) ? "whitespace" : ",";
}

export function parseTextRows(text: string): string[][] {
  const cleaned = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleaned.split("\n").map((line) => line.trimEnd()).filter((line) => line.trim());
  if (!lines.length) return [];
  const delimiter = detectDelimiter(lines);

  if (delimiter === "whitespace") {
    return lines.map((line) => line.trim().split(/\s{2,}|\s+/));
  }

  const parsed = Papa.parse<string[]>(cleaned, {
    delimiter,
    skipEmptyLines: true,
    fastMode: false,
  });
  return parsed.data.map((row) => row.map((cell) => cell ?? ""));
}

export function inferDatasetFromRows(name: string, rawRows: string[][]): Dataset {
  if (!rawRows.length) {
    return { name, columns: [], types: {}, rows: [] };
  }

  const sampleNext = rawRows.slice(1, 10);
  const hasHeader = rowLooksLikeHeader(rawRows[0], sampleNext);
  const rawHeaders = hasHeader ? rawRows[0] : rawRows[0].map((_, i) => `Column ${i + 1}`);
  const columns = uniqueColumns(rawHeaders);
  const dataRows = hasHeader ? rawRows.slice(1) : rawRows;

  const coercedRows = dataRows.map((row) =>
    columns.map((_, i) => coerceCell(row[i]))
  );

  const types: Record<string, "numeric" | "categorical"> = {};
  columns.forEach((col, idx) => {
    let numericCount = 0;
    let textCount = 0;
    coercedRows.forEach((row) => {
      const val = row[idx];
      if (typeof val === "number") numericCount++;
      else if (typeof val === "string" && val.trim()) textCount++;
    });
    types[col] = numericCount >= textCount ? "numeric" : "categorical";
  });

  const objectRows = coercedRows.map((row) => {
    const obj: Record<string, Cell> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });

  return { name, columns, types, rows: objectRows };
}

export function parseDelimitedText(name: string, text: string): Dataset {
  const rawRows = parseTextRows(text);
  return inferDatasetFromRows(name, rawRows);
}

export function parseWorkbookArrayBuffer(name: string, buffer: ArrayBuffer): Dataset {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rawMatrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false });
  const stringRows = rawMatrix.map((row) => (row ?? []).map((v) => String(v ?? "")));
  return inferDatasetFromRows(name || sheetName || "Imported Sheet", stringRows);
}

export function parseWorkbook(name: string, data: ArrayBuffer): Dataset {
  const workbook = XLSX.read(data, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames.find((sheet) => {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheet], { header: 1, blankrows: false });
    return rows.some((row) => row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== ""));
  });
  if (!sheetName) return { name, columns: [], types: {}, rows: [] };
  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, blankrows: false, raw: false });
  const stringRows = rows.map((r) => (r ?? []).map((v) => String(v ?? "")));
  return inferDatasetFromRows(`${name} — ${sheetName}`, stringRows);
}
