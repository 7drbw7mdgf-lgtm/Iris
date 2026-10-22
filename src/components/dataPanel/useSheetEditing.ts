import React, { useState } from "react";
import { Dataset } from "../../types";
import { evaluateExcelFormula } from "../../excelFormula";
import { CellValue, RangeBounds, Selection } from "./types";

interface UseSheetEditingProps {
  dataset: Dataset;
  applyDatasetEdit: (next: Dataset) => void;
  recalcTypes: (rows: Dataset["rows"], columns?: string[]) => Dataset["types"];
  selected: Selection;
  setSelected: React.Dispatch<React.SetStateAction<Selection>>;
  setSelectionAnchor: React.Dispatch<React.SetStateAction<Selection>>;
  selectCell: (r: number, c: number, extend?: boolean) => void;
  selectionRange: RangeBounds;
  hasSelection: boolean;
  selectedColumn: string;
  gridRef: React.RefObject<HTMLDivElement | null>;
}

export function useSheetEditing({
  dataset,
  applyDatasetEdit,
  recalcTypes,
  selected,
  setSelected,
  setSelectionAnchor,
  selectCell,
  selectionRange,
  hasSelection,
  selectedColumn,
  gridRef,
}: UseSheetEditingProps) {
  const [editing, setEditing] = useState<Selection | null>(null);
  const [draft, setDraft] = useState("");
  const [formulaDraft, setFormulaDraft] = useState("");
  const [formulaFocused, setFormulaFocused] = useState(false);

  const coerceForColumn = (column: string, value: string): CellValue => {
    if (value === "") return null;
    if (dataset.types[column] === "numeric") {
      const n = Number(value.replace(/,/g, ""));
      return Number.isFinite(n) ? n : value;
    }
    return value;
  };

  const evaluateFormula = (raw: string, columnIndex: number, rowIndex = selected.r): CellValue => {
    const formula = raw.trim();
    if (!formula.startsWith("=")) return coerceForColumn(dataset.columns[columnIndex] ?? "", formula);
    return evaluateExcelFormula(formula, dataset, rowIndex, columnIndex);
  };

  const startEdit = (r: number, cIndex: number, value: string | number | null) => {
    selectCell(r, cIndex);
    setEditing({ r, c: cIndex });
    setDraft(value == null ? "" : String(value));
    setFormulaDraft(value == null ? "" : String(value));
  };

  const commitEdit = (nextSelection?: Selection) => {
    if (!editing) return;
    const { r, c: cIndex } = editing;
    const c = dataset.columns[cIndex];
    if (!c) return;
    const v = draft.trim().startsWith("=")
      ? evaluateFormula(draft, cIndex, r)
      : coerceForColumn(c, draft);
    const rows = dataset.rows.map((row, idx) => (idx === r ? { ...row, [c]: v } : row));
    if (nextSelection && nextSelection.r >= rows.length) {
      rows.push(Object.fromEntries(dataset.columns.map((column) => [column, null])) as Record<string, CellValue>);
    }
    applyDatasetEdit({ ...dataset, rows, types: recalcTypes(rows) });
    setEditing(null);
    if (nextSelection) {
      const next = {
        r: Math.max(0, Math.min(rows.length - 1, nextSelection.r)),
        c: Math.max(0, Math.min(dataset.columns.length - 1, nextSelection.c)),
      };
      setSelectionAnchor(next);
      setSelected(next);
    }
    window.setTimeout(() => gridRef.current?.focus(), 0);
  };

  const applyFormulaValue = (scope: "cell" | "selection" = "cell") => {
    if (!hasSelection || !selectedColumn) return;
    const rows = dataset.rows.map((row, rIndex) => {
      if (scope === "cell" && rIndex !== selected.r) return row;
      if (scope === "selection" && (rIndex < selectionRange.r1 || rIndex > selectionRange.r2)) return row;
      const next = { ...row };
      dataset.columns.forEach((col, cIndex) => {
        const target = scope === "cell"
          ? rIndex === selected.r && cIndex === selected.c
          : cIndex >= selectionRange.c1 && cIndex <= selectionRange.c2;
        if (target) next[col] = evaluateFormula(formulaDraft, cIndex, rIndex);
      });
      return next;
    });
    applyDatasetEdit({ ...dataset, rows, types: recalcTypes(rows) });
    setEditing(null);
    setFormulaFocused(false);
    window.setTimeout(() => gridRef.current?.focus(), 0);
  };

  return {
    editing,
    setEditing,
    draft,
    setDraft,
    formulaDraft,
    setFormulaDraft,
    formulaFocused,
    setFormulaFocused,
    startEdit,
    commitEdit,
    applyFormulaValue,
  };
}
