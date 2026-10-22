import React, { useState, useRef, useEffect } from "react";
import { Dataset } from "../../types";
import { FillDrag, RangeBounds } from "./types";
import { fillValueForCell } from "./fillFormulaUtils";

interface UseSheetFillDragProps {
  dataset: Dataset;
  selectionRange: RangeBounds;
  applyDatasetEdit: (next: Dataset) => void;
  recalcTypes: (rows: Dataset["rows"], columns?: string[]) => Dataset["types"];
  selectRange: (range: RangeBounds) => void;
}

export function useSheetFillDrag({
  dataset,
  selectionRange,
  applyDatasetEdit,
  recalcTypes,
  selectRange,
}: UseSheetFillDragProps) {
  const [fillDrag, setFillDrag] = useState<FillDrag>(null);
  const fillDragRef = useRef<FillDrag>(null);

  useEffect(() => {
    fillDragRef.current = fillDrag;
  }, [fillDrag]);

  const isInFillPreview = (r: number, c: number) => {
    if (!fillDrag) return false;
    return r >= fillDrag.target.r1 && r <= fillDrag.target.r2 && c >= fillDrag.target.c1 && c <= fillDrag.target.c2;
  };

  const fillRangeFromSource = (source: RangeBounds, target: RangeBounds) => {
    const sourceRows = source.r2 - source.r1 + 1;
    const sourceCols = source.c2 - source.c1 + 1;
    if (sourceRows <= 0 || sourceCols <= 0) return;
    const rows = dataset.rows.map((row) => ({ ...row }));
    for (let r = target.r1; r <= target.r2; r++) {
      for (let c = target.c1; c <= target.c2; c++) {
        const col = dataset.columns[c];
        if (!col || !rows[r]) continue;
        rows[r][col] = fillValueForCell(dataset, source, target, r, c);
      }
    }
    applyDatasetEdit({ ...dataset, rows, types: recalcTypes(rows) });
    selectRange(target);
  };

  const fillSelection = (direction: "down" | "right") => {
    const source = selectionRange;
    if (direction === "down" && source.r2 > source.r1) {
      const target = { ...source, r1: source.r1 + 1 };
      fillRangeFromSource({ ...source, r2: source.r1 }, target);
      return;
    }
    if (direction === "right" && source.c2 > source.c1) {
      const target = { ...source, c1: source.c1 + 1 };
      fillRangeFromSource({ ...source, c2: source.c1 }, target);
    }
  };

  const startFillHandleDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const drag = { source: selectionRange, target: selectionRange };
    fillDragRef.current = drag;
    setFillDrag(drag);
    const pointerId = e.pointerId;
    e.currentTarget.setPointerCapture?.(pointerId);
    const move = (event: PointerEvent) => {
      const el = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      const cell = el?.closest<HTMLTableCellElement>("td[data-row][data-col]");
      if (!cell || !cell.dataset.row || !cell.dataset.col) return;
      const r = Number(cell.dataset.row);
      const c = Number(cell.dataset.col);
      updateFillTarget(r, c);
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      completeFillDrag();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  const updateFillTarget = (r: number, c: number) => {
    const active = fillDragRef.current;
    if (!active) return;
    const next = {
      source: active.source,
      target: {
        r1: Math.min(active.source.r1, r),
        r2: Math.max(active.source.r2, r),
        c1: Math.min(active.source.c1, c),
        c2: Math.max(active.source.c2, c),
      },
    };
    fillDragRef.current = next;
    setFillDrag(next);
  };

  const completeFillDrag = () => {
    const active = fillDragRef.current;
    if (!active) return;
    fillDragRef.current = null;
    setFillDrag(null);
    fillRangeFromSource(active.source, active.target);
  };

  return {
    fillDrag,
    setFillDrag,
    fillDragRef,
    isInFillPreview,
    fillRangeFromSource,
    fillSelection,
    startFillHandleDrag,
    updateFillTarget,
    completeFillDrag,
  };
}
