import { Dataset } from "../../types";
import { CellValue, RangeBounds } from "./types";

export function incrementText(value: CellValue, step: number): CellValue {
  const text = String(value ?? "");
  const match = text.match(/^(.*?)(-?\d+(?:\.\d+)?)$/);
  if (!match) return value;
  const next = Number(match[2]) + step;
  return `${match[1]}${Number.isInteger(next) ? next : Number(next.toFixed(8))}`;
}

export function translateFormula(value: CellValue, rowDelta: number, colDelta: number): CellValue {
  if (typeof value !== "string" || !value.trim().startsWith("=")) return value;
  return value.replace(/(\$?)([A-Z]+)(\$?)(\d+)/gi, (_match, colFixed: string, letters: string, rowFixed: string, row: string) => {
    const isColFixed = colFixed === "$";
    const isRowFixed = rowFixed === "$";
    const colNumber = [...letters.toUpperCase()].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
    const nextCol = Math.max(1, colNumber + (isColFixed ? 0 : colDelta));
    const nextRow = Math.max(1, Number(row) + (isRowFixed ? 0 : rowDelta));
    let nextLetters = "";
    let n = nextCol;
    while (n > 0) {
      nextLetters = String.fromCharCode(65 + ((n - 1) % 26)) + nextLetters;
      n = Math.floor((n - 1) / 26);
    }
    return `${isColFixed ? "$" : ""}${nextLetters}${isRowFixed ? "$" : ""}${nextRow}`;
  });
}

export function fillValueForCell(
  dataset: Dataset,
  source: RangeBounds,
  target: RangeBounds,
  r: number,
  c: number,
): CellValue {
  const sourceRows = source.r2 - source.r1 + 1;
  const sourceCols = source.c2 - source.c1 + 1;
  const sourceCol = dataset.columns[source.c1 + ((c - target.c1) % sourceCols)];
  const sourceRow = source.r1 + ((r - target.r1) % sourceRows);
  const sourceValue = sourceRow >= 0 && sourceCol ? dataset.rows[sourceRow]?.[sourceCol] ?? null : null;
  if (typeof sourceValue === "string" && sourceValue.trim().startsWith("=")) {
    return translateFormula(sourceValue, r - sourceRow, c - (source.c1 + ((c - target.c1) % sourceCols)));
  }

  if (sourceCols === 1 && sourceRows > 1) {
    const values = Array.from({ length: sourceRows }, (_, i) => dataset.rows[source.r1 + i]?.[dataset.columns[source.c1]]);
    const nums = values.map((value) => Number(value));
    const offset = r - source.r1;
    if (nums.every(Number.isFinite)) {
      const downStep = nums.length > 1 ? nums[nums.length - 1] - nums[nums.length - 2] : 0;
      const upStep = nums.length > 1 ? nums[1] - nums[0] : downStep;
      if (offset < 0) return nums[0] + offset * upStep;
      return nums[Math.min(offset, nums.length - 1)] + Math.max(0, offset - nums.length + 1) * downStep;
    }
  }

  if (sourceRows === 1 && sourceCols > 1) {
    const values = Array.from({ length: sourceCols }, (_, i) => dataset.rows[source.r1]?.[dataset.columns[source.c1 + i]]);
    const nums = values.map((value) => Number(value));
    const offset = c - source.c1;
    if (nums.every(Number.isFinite)) {
      const rightStep = nums.length > 1 ? nums[nums.length - 1] - nums[nums.length - 2] : 0;
      const leftStep = nums.length > 1 ? nums[1] - nums[0] : rightStep;
      if (offset < 0) return nums[0] + offset * leftStep;
      return nums[Math.min(offset, nums.length - 1)] + Math.max(0, offset - nums.length + 1) * rightStep;
    }
  }

  if (sourceRows === 1 && sourceCols === 1) {
    const base = dataset.rows[source.r1]?.[dataset.columns[source.c1]] ?? null;
    const numeric = Number(base);
    const offset = Math.max(r - source.r1, c - source.c1);
    if (Number.isFinite(numeric)) return numeric + offset;
    return incrementText(base, offset);
  }

  const wrappedRow = source.r1 + ((((r - target.r1) % sourceRows) + sourceRows) % sourceRows);
  const wrappedCol = dataset.columns[source.c1 + ((((c - target.c1) % sourceCols) + sourceCols) % sourceCols)];
  return wrappedCol ? dataset.rows[wrappedRow]?.[wrappedCol] ?? null : sourceCol ? dataset.rows[sourceRow]?.[sourceCol] ?? null : null;
}
