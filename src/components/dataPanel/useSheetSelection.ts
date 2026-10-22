import { useState } from "react";
import { Dataset } from "../../types";
import { RangeBounds, Selection, columnLetter } from "./types";

interface UseSheetSelectionProps {
  dataset: Dataset;
  hasGrid: boolean;
  selectedColumn: string;
}

export function useSheetSelection({
  dataset,
  hasGrid,
  selectedColumn,
}: UseSheetSelectionProps) {
  const [selected, setSelected] = useState<Selection>({ r: 0, c: 0 });
  const [selectionAnchor, setSelectionAnchor] = useState<Selection>({ r: 0, c: 0 });
  const [dragSelecting, setDragSelecting] = useState(false);

  const selectionRange: RangeBounds = {
    r1: Math.min(selectionAnchor.r, selected.r),
    r2: Math.max(selectionAnchor.r, selected.r),
    c1: Math.min(selectionAnchor.c, selected.c),
    c2: Math.max(selectionAnchor.c, selected.c),
  };

  const selectedCellCount = (selectionRange.r2 - selectionRange.r1 + 1) * (selectionRange.c2 - selectionRange.c1 + 1);
  const hasSelection = hasGrid && dataset.rows.length > 0;
  const formatKey = (r: number, c: number) => `${r}:${c}`;
  const activeCellValue = selectedColumn ? dataset.rows[selected.r]?.[selectedColumn] ?? "" : "";
  const cellAddress = (cell: Selection) => `${columnLetter(cell.c)}${cell.r + 1}`;
  const selectedRangeAddress = selectionRange.r1 === selectionRange.r2 && selectionRange.c1 === selectionRange.c2
    ? cellAddress(selected)
    : `${cellAddress({ r: selectionRange.r1, c: selectionRange.c1 })}:${cellAddress({ r: selectionRange.r2, c: selectionRange.c2 })}`;

  const clampCell = (cell: Selection): Selection => ({
    r: Math.max(0, Math.min(Math.max(0, dataset.rows.length - 1), cell.r)),
    c: Math.max(0, Math.min(Math.max(0, dataset.columns.length - 1), cell.c)),
  });

  const selectCell = (r: number, c: number, extend = false) => {
    const next = clampCell({ r, c });
    if (!extend) setSelectionAnchor(next);
    setSelected(next);
  };

  const selectRange = (range: RangeBounds) => {
    setSelectionAnchor(clampCell({ r: range.r1, c: range.c1 }));
    setSelected(clampCell({ r: range.r2, c: range.c2 }));
  };

  const selectWholeColumn = (c: number, extend = false) => {
    if (!hasGrid) return;
    const anchor = extend ? selectionAnchor : { r: 0, c };
    setSelectionAnchor(clampCell(anchor));
    setSelected(clampCell({ r: Math.max(0, dataset.rows.length - 1), c }));
  };

  const selectWholeRow = (r: number, extend = false) => {
    if (!hasGrid) return;
    const anchor = extend ? selectionAnchor : { r, c: 0 };
    setSelectionAnchor(clampCell(anchor));
    setSelected(clampCell({ r, c: Math.max(0, dataset.columns.length - 1) }));
  };

  const selectAllCells = () => {
    if (!hasGrid) return;
    setSelectionAnchor({ r: 0, c: 0 });
    setSelected({ r: Math.max(0, dataset.rows.length - 1), c: Math.max(0, dataset.columns.length - 1) });
  };

  const isInRange = (r: number, c: number) => (
    r >= selectionRange.r1 && r <= selectionRange.r2 && c >= selectionRange.c1 && c <= selectionRange.c2
  );

  const selectionValues = hasSelection
    ? Array.from({ length: selectionRange.r2 - selectionRange.r1 + 1 }, (_, rOffset) => selectionRange.r1 + rOffset).flatMap((rIndex) => (
      dataset.columns.slice(selectionRange.c1, selectionRange.c2 + 1).map((col) => dataset.rows[rIndex]?.[col])
    ))
    : [];
  const selectionNumericValues = selectionValues
    .map((value) => (typeof value === "number" ? value : Number(String(value ?? "").replace(/,/g, ""))))
    .filter(Number.isFinite);
  const selectionFilledCount = selectionValues.filter((value) => value !== null && value !== undefined && String(value).trim() !== "").length;
  const selectionSum = selectionNumericValues.reduce((sum, value) => sum + value, 0);
  const selectionAverage = selectionNumericValues.length ? selectionSum / selectionNumericValues.length : null;
  const selectionMin = selectionNumericValues.length ? Math.min(...selectionNumericValues) : null;
  const selectionMax = selectionNumericValues.length ? Math.max(...selectionNumericValues) : null;
  const selectionSummary = selectionNumericValues.length
    ? `Count ${selectionFilledCount} · Sum ${selectionSum.toLocaleString(undefined, { maximumFractionDigits: 4 })} · Mean ${(selectionAverage ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}`
    : `Count ${selectionFilledCount}`;
  const selectedMissingCount = dataset.rows.reduce((count, row, rIndex) => {
    if (rIndex < selectionRange.r1 || rIndex > selectionRange.r2) return count;
    return count + dataset.columns.reduce((inner, col, cIndex) => {
      if (cIndex < selectionRange.c1 || cIndex > selectionRange.c2) return inner;
      const value = row[col];
      return inner + (value === null || value === "" ? 1 : 0);
    }, 0);
  }, 0);

  const selectedCols = dataset.columns.slice(selectionRange.c1, selectionRange.c2 + 1);

  return {
    selected,
    setSelected,
    selectionAnchor,
    setSelectionAnchor,
    dragSelecting,
    setDragSelecting,
    selectionRange,
    selectedCellCount,
    hasSelection,
    formatKey,
    activeCellValue,
    selectedRangeAddress,
    selectCell,
    selectRange,
    selectWholeColumn,
    selectWholeRow,
    selectAllCells,
    isInRange,
    selectionValues,
    selectionNumericValues,
    selectionFilledCount,
    selectionSum,
    selectionAverage,
    selectionMin,
    selectionMax,
    selectionSummary,
    selectedMissingCount,
    selectedCols,
  };
}
