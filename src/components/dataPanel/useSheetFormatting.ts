import React from "react";
import { Dataset } from "../../types";
import { evaluateExcelFormula } from "../../excelFormula";
import { CellFormat, CellValue, RangeBounds, Selection, columnLetter } from "./types";

interface UseSheetFormattingProps {
  dataset: Dataset;
  selectionRange: RangeBounds;
  selectedColumn: string;
  selected: Selection;
  applyDatasetEdit: (next: Dataset) => void;
  recalcTypes: (rows: Dataset["rows"], columns?: string[]) => Dataset["types"];
  cellFormats: Record<string, CellFormat>;
  setCellFormats: React.Dispatch<React.SetStateAction<Record<string, CellFormat>>>;
  formatKey: (r: number, c: number) => string;
  clearSelectedCells: () => void;
  selectCell: (r: number, c: number, extend?: boolean) => void;
  setFormulaDraft: (draft: string) => void;
  hasSelection: boolean;
}

export function useSheetFormatting({
  dataset,
  selectionRange,
  selectedColumn,
  selected,
  applyDatasetEdit,
  recalcTypes,
  setCellFormats,
  formatKey,
  clearSelectedCells,
  selectCell,
  setFormulaDraft,
  hasSelection,
}: UseSheetFormattingProps) {
  const toggleSelectionFormat = (format: keyof CellFormat, value?: any) => {
    setCellFormats((current) => {
      const next = { ...current };
      for (let r = selectionRange.r1; r <= selectionRange.r2; r++) {
        for (let c = selectionRange.c1; c <= selectionRange.c2; c++) {
          const key = formatKey(r, c);
          const existing = next[key] ?? {};
          next[key] = value !== undefined ? { ...existing, [format]: value } : { ...existing, [format]: !existing[format] };
        }
      }
      return next;
    });
  };

  const applyNumberFormat = (numFormat: CellFormat["numFormat"]) => {
    toggleSelectionFormat("numFormat", numFormat);
  };

  const adjustDecimals = (delta: number) => {
    setCellFormats((current) => {
      const next = { ...current };
      for (let r = selectionRange.r1; r <= selectionRange.r2; r++) {
        for (let c = selectionRange.c1; c <= selectionRange.c2; c++) {
          const key = formatKey(r, c);
          const existing = next[key] ?? {};
          const curDecimals = existing.decimals ?? 2;
          const nextDecimals = Math.max(0, Math.min(10, curDecimals + delta));
          next[key] = { ...existing, decimals: nextDecimals, numFormat: existing.numFormat || "number" };
        }
      }
      return next;
    });
  };

  const applyAlignment = (align: "left" | "center" | "right") => {
    toggleSelectionFormat("align", align);
  };

  const clearSelection = (mode: "all" | "formats" | "contents") => {
    if (mode === "all" || mode === "formats") {
      setCellFormats((current) => {
        const next = { ...current };
        for (let r = selectionRange.r1; r <= selectionRange.r2; r++) {
          for (let c = selectionRange.c1; c <= selectionRange.c2; c++) {
            delete next[formatKey(r, c)];
          }
        }
        return next;
      });
    }
    if (mode === "all" || mode === "contents") {
      clearSelectedCells();
    }
  };

  const applyAutoSum = (funcName: "SUM" | "AVERAGE" | "COUNT" | "MAX" | "MIN") => {
    if (!hasSelection || !selectedColumn) return;
    const startCell = `${columnLetter(selectionRange.c1)}${selectionRange.r1 + 1}`;
    const endCell = `${columnLetter(selectionRange.c2)}${selectionRange.r2 + 1}`;
    const rangeStr = startCell === endCell ? startCell : `${startCell}:${endCell}`;
    const formula = `=${funcName}(${rangeStr})`;
    const targetRow = selectionRange.r2 === selectionRange.r1 ? selected.r : selectionRange.r2 + 1;
    let rows = [...dataset.rows];
    if (targetRow >= rows.length) {
      rows.push(Object.fromEntries(dataset.columns.map((c) => [c, null])) as Record<string, CellValue>);
    }
    const val = evaluateExcelFormula(formula, dataset, targetRow, selected.c);
    rows = rows.map((r, rIdx) => (rIdx === targetRow ? { ...r, [selectedColumn]: val } : r));
    applyDatasetEdit({ ...dataset, rows, types: recalcTypes(rows) });
    selectCell(targetRow, selected.c);
    setFormulaDraft(formula);
  };

  const insertFunctionTemplate = (fnName: string) => {
    const startCell = `${columnLetter(selectionRange.c1)}${selectionRange.r1 + 1}`;
    const endCell = `${columnLetter(selectionRange.c2)}${selectionRange.r2 + 1}`;
    const rangeStr = startCell === endCell ? startCell : `${startCell}:${endCell}`;
    const formula = `=${fnName}(${rangeStr})`;
    setFormulaDraft(formula);
    const input = document.querySelector<HTMLInputElement>(".sheet-formula-input input");
    input?.focus();
  };

  const fillMissing = (mode: "blank" | "zero" | "na" | "mean") => {
    const rows = dataset.rows.map((row) => ({ ...row }));
    for (let r = selectionRange.r1; r <= selectionRange.r2; r++) {
      for (let c = selectionRange.c1; c <= selectionRange.c2; c++) {
        const col = dataset.columns[c];
        if (!col || !rows[r]) continue;
        const current = rows[r][col];
        if (current !== null && current !== "") continue;
        if (mode === "blank") rows[r][col] = null;
        if (mode === "zero") rows[r][col] = 0;
        if (mode === "na") rows[r][col] = "NA";
        if (mode === "mean") {
          const values = dataset.rows.map((row) => Number(row[col])).filter(Number.isFinite);
          rows[r][col] = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
        }
      }
    }
    applyDatasetEdit({ ...dataset, rows, types: recalcTypes(rows) });
  };

  const isInvalidCell = (r: number, c: number) => {
    const col = dataset.columns[c];
    const value = dataset.rows[r]?.[col];
    if (!col || value == null || value === "" || dataset.types[col] !== "numeric") return false;
    return typeof value !== "number" && !Number.isFinite(Number(String(value).replace(/,/g, "")));
  };

  return {
    toggleSelectionFormat,
    applyNumberFormat,
    adjustDecimals,
    applyAlignment,
    clearSelection,
    applyAutoSum,
    insertFunctionTemplate,
    fillMissing,
    isInvalidCell,
  };
}
