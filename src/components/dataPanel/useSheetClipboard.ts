import React, { useState, useRef } from "react";
import { Dataset } from "../../types";
import {
  CellValue,
  InternalClipboard,
  PasteDialogState,
  RangeBounds,
  Selection,
} from "./types";
import {
  clearRangeInRows,
  clipboardMatrixFromEvent,
  htmlTableMatrix,
  matrixToDelimited,
  matrixToHtmlTable,
  normalizeMatrix,
  parseDelimitedMatrix,
  transposeMatrix,
} from "./matrixUtils";

interface UseSheetClipboardProps {
  dataset: Dataset;
  hasGrid: boolean;
  selectionRange: RangeBounds;
  selected: Selection;
  applyDatasetEdit: (next: Dataset) => void;
  recalcTypes: (rows: Dataset["rows"], columns?: string[]) => Dataset["types"];
  setSelected: React.Dispatch<React.SetStateAction<Selection>>;
  setSelectionAnchor: React.Dispatch<React.SetStateAction<Selection>>;
  nextColumnNameFrom: (columns: string[]) => string;
}

export function useSheetClipboard({
  dataset,
  hasGrid,
  selectionRange,
  selected,
  applyDatasetEdit,
  recalcTypes,
  setSelected,
  setSelectionAnchor,
  nextColumnNameFrom,
}: UseSheetClipboardProps) {
  const internalClipboardRef = useRef<InternalClipboard>(null);
  const [copiedRange, setCopiedRange] = useState<(RangeBounds & { cut: boolean }) | null>(null);
  const [pasteDialog, setPasteDialog] = useState<PasteDialogState>({ open: false, transpose: false, start: { r: 0, c: 0 }, text: "" });

  const isInCopiedRange = (r: number, c: number) => (
    !!copiedRange && r >= copiedRange.r1 && r <= copiedRange.r2 && c >= copiedRange.c1 && c <= copiedRange.c2
  );

  const selectedRangeMatrix = (): CellValue[][] => {
    if (!hasGrid) return [];
    return Array.from({ length: selectionRange.r2 - selectionRange.r1 + 1 }, (_, rOffset) => {
      const row = dataset.rows[selectionRange.r1 + rOffset];
      return dataset.columns
        .slice(selectionRange.c1, selectionRange.c2 + 1)
        .map((col) => row?.[col] ?? "");
    });
  };

  const selectedRangeText = () => {
    return matrixToDelimited(selectedRangeMatrix(), "	");
  };

  const clearSelectedCells = () => {
    const rows = dataset.rows.map((row, rIndex) => {
      if (rIndex < selectionRange.r1 || rIndex > selectionRange.r2) return row;
      const next = { ...row };
      dataset.columns.forEach((col, cIndex) => {
        if (cIndex >= selectionRange.c1 && cIndex <= selectionRange.c2) next[col] = null;
      });
      return next;
    });
    applyDatasetEdit({ ...dataset, rows, types: recalcTypes(rows) });
  };

  const copySelectedCells = async () => {
    if (!hasGrid) return;
    const text = selectedRangeText();
    const matrix = selectedRangeMatrix();
    const html = matrixToHtmlTable(matrix);
    const source = { ...selectionRange };
    internalClipboardRef.current = { matrix, text, html, cut: false, source };
    setCopiedRange({ ...source, cut: false });
    try {
      if ("ClipboardItem" in window && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": new Blob([text], { type: "text/plain" }),
            "text/html": new Blob([html], { type: "text/html" }),
          }),
        ]);
      } else {
        await navigator.clipboard?.writeText(text);
      }
    } catch {
      await navigator.clipboard?.writeText(text).catch(() => undefined);
    }
  };

  const cutSelectedCells = async () => {
    if (!hasGrid) return;
    const text = selectedRangeText();
    const matrix = selectedRangeMatrix();
    const html = matrixToHtmlTable(matrix);
    const source = { ...selectionRange };
    internalClipboardRef.current = { matrix, text, html, cut: true, source };
    setCopiedRange({ ...source, cut: true });
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      // Keep internal cut buffer
    }
  };

  const applyClipboardMatrix = (matrix: CellValue[][], start: Selection = { r: selectionRange.r1, c: selectionRange.c1 }, cutSource?: RangeBounds) => {
    const normalized = normalizeMatrix(matrix);
    if (!normalized.length) return;
    const safeStart = {
      r: Math.max(0, start.r),
      c: Math.max(0, start.c),
    };
    const requiredCols = safeStart.c + Math.max(0, ...normalized.map((row) => row.length));
    const columns = [...dataset.columns];
    while (columns.length < requiredCols) {
      const name = nextColumnNameFrom(columns);
      columns.push(name);
    }
    const requiredRows = safeStart.r + normalized.length;
    const rows = Array.from({ length: Math.max(dataset.rows.length, requiredRows) }, (_, index) => ({
      ...(dataset.rows[index] ?? Object.fromEntries(columns.map((c) => [c, null]))),
    }));
    normalized.forEach((rowValues, rOffset) => {
      rowValues.forEach((val, cOffset) => {
        const col = columns[safeStart.c + cOffset];
        if (col && rows[safeStart.r + rOffset]) {
          rows[safeStart.r + rOffset][col] = val === "" ? null : val;
        }
      });
    });
    const pastedRange = {
      r1: safeStart.r,
      r2: safeStart.r + normalized.length - 1,
      c1: safeStart.c,
      c2: safeStart.c + (normalized[0]?.length ?? 1) - 1,
    };
    if (cutSource) {
      const sameRange = cutSource.r1 === pastedRange.r1 && cutSource.r2 === pastedRange.r2 && cutSource.c1 === pastedRange.c1 && cutSource.c2 === pastedRange.c2;
      if (!sameRange) clearRangeInRows(rows, columns, cutSource);
      internalClipboardRef.current = null;
      setCopiedRange(null);
    }
    const maxRow = Math.max(0, rows.length - 1);
    const maxCol = Math.max(0, columns.length - 1);
    const anchor = { r: Math.max(0, Math.min(maxRow, safeStart.r)), c: Math.max(0, Math.min(maxCol, safeStart.c)) };
    const end = {
      r: Math.max(0, Math.min(maxRow, safeStart.r + normalized.length - 1)),
      c: Math.max(0, Math.min(maxCol, safeStart.c + (normalized[0]?.length ?? 1) - 1)),
    };
    applyDatasetEdit({
      ...dataset,
      columns,
      rows,
      types: recalcTypes(rows, columns),
    });
    setSelectionAnchor(anchor);
    setSelected(end);
  };

  const readClipboardMatrix = async (allowInternalFallback = true): Promise<CellValue[][]> => {
    try {
      if (navigator.clipboard?.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          if (item.types.includes("text/html")) {
            const html = await (await item.getType("text/html")).text();
            const matrix = htmlTableMatrix(html);
            if (matrix.length) return matrix;
          }
        }
        for (const item of items) {
          if (item.types.includes("text/plain")) {
            const text = await (await item.getType("text/plain")).text();
            const matrix = parseDelimitedMatrix(text);
            if (matrix.length) return matrix;
          }
        }
      }
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        const matrix = parseDelimitedMatrix(text);
        if (matrix.length) return matrix;
      }
    } catch {
      // Permission blocked
    }
    if (allowInternalFallback && internalClipboardRef.current?.matrix.length) {
      return internalClipboardRef.current.matrix;
    }
    return [];
  };

  const pasteFromClipboard = async (transpose = false, start: Selection = { r: selected.r, c: selected.c }) => {
    const matrix = await readClipboardMatrix();
    if (!matrix.length) {
      setPasteDialog({ open: true, transpose, start, text: "" });
      return;
    }
    const internal = internalClipboardRef.current;
    const output = transpose ? transposeMatrix(matrix) : matrix;
    applyClipboardMatrix(output, start, internal?.cut ? internal.source : undefined);
  };

  const submitPasteDialog = () => {
    const matrix = parseDelimitedMatrix(pasteDialog.text);
    if (!matrix.length) return;
    const output = pasteDialog.transpose ? transposeMatrix(matrix) : matrix;
    applyClipboardMatrix(output, pasteDialog.start);
    setPasteDialog((state) => ({ ...state, open: false, text: "" }));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData("text/plain");
    const matrix = clipboardMatrixFromEvent(e.clipboardData);
    if (!text && !matrix.length) return;
    e.preventDefault();
    applyClipboardMatrix(matrix, { r: selectionRange.r1, c: selectionRange.c1 }, internalClipboardRef.current?.cut ? internalClipboardRef.current.source : undefined);
  };

  return {
    internalClipboardRef,
    copiedRange,
    setCopiedRange,
    pasteDialog,
    setPasteDialog,
    isInCopiedRange,
    clearSelectedCells,
    copySelectedCells,
    cutSelectedCells,
    selectedRangeText,
    selectedRangeMatrix,
    applyClipboardMatrix,
    readClipboardMatrix,
    pasteFromClipboard,
    submitPasteDialog,
    handlePaste,
  };
}
