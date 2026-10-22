import React from "react";
import { Dataset } from "../../types";
import { Selection } from "./types";

interface UseSheetKeyboardProps {
  hasGrid: boolean;
  dataset: Dataset;
  selected: Selection;
  editing: Selection | null;
  selectCell: (r: number, c: number, extend?: boolean) => void;
  selectAllCells: () => void;
  addRow: (after?: number) => void;
  startEdit: (r: number, c: number, val: any) => void;
  clearSelectedCells: () => void;
  copySelectedCells: () => void;
  cutSelectedCells: () => void;
  undoCellOperation: () => void;
  redoCellOperation: () => void;
  setEditing: (sel: Selection | null) => void;
  setDraft: (draft: string) => void;
}

export function useSheetKeyboard({
  hasGrid,
  dataset,
  selected,
  editing,
  selectCell,
  selectAllCells,
  addRow,
  startEdit,
  clearSelectedCells,
  copySelectedCells,
  cutSelectedCells,
  undoCellOperation,
  redoCellOperation,
  setEditing,
  setDraft,
}: UseSheetKeyboardProps) {
  const moveSelection = (dr: number, dc: number, extendRows = false, extendRange = false) => {
    if (!hasGrid) return;
    const nextR = Math.max(0, Math.min(dataset.rows.length - 1, selected.r + dr));
    const nextC = Math.max(0, Math.min(dataset.columns.length - 1, selected.c + dc));
    if (extendRows && selected.r === dataset.rows.length - 1 && dr > 0) {
      addRow();
      selectCell(dataset.rows.length, nextC, extendRange);
      return;
    }
    selectCell(nextR, nextC, extendRange);
  };

  const handleGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!hasGrid || editing) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
      e.preventDefault();
      selectAllCells();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "v") return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) redoCellOperation();
      else undoCellOperation();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
      e.preventDefault();
      redoCellOperation();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      moveSelection(-1, 0, false, e.shiftKey);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      moveSelection(1, 0, false, e.shiftKey);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveSelection(0, -1, false, e.shiftKey);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      moveSelection(0, 1, false, e.shiftKey);
    } else if (e.key === "Tab") {
      e.preventDefault();
      moveSelection(0, e.shiftKey ? -1 : 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      moveSelection(e.shiftKey ? -1 : 1, 0, true, false);
    } else if (e.key === "F2") {
      e.preventDefault();
      startEdit(selected.r, selected.c, dataset.rows[selected.r]?.[dataset.columns[selected.c]] ?? null);
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      clearSelectedCells();
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "c") {
      e.preventDefault();
      copySelectedCells();
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "x") {
      e.preventDefault();
      cutSelectedCells();
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      setEditing(selected);
      setDraft(e.key);
    }
  };

  return {
    moveSelection,
    handleGridKeyDown,
  };
}
