import { useState, MutableRefObject } from "react";
import { Dataset } from "../../types";

export interface DataPanelHistoryOptions {
  dataset: Dataset;
  onEdit: (dataset: Dataset) => void;
  gridRef: MutableRefObject<HTMLDivElement | null>;
}

export function useDataPanelHistory({
  dataset,
  onEdit,
  gridRef,
}: DataPanelHistoryOptions) {
  const [localUndoStack, setLocalUndoStack] = useState<Dataset[]>([]);
  const [localRedoStack, setLocalRedoStack] = useState<Dataset[]>([]);

  const applyDatasetEdit = (next: Dataset, trackUndo = true) => {
    if (trackUndo) {
      setLocalUndoStack((stack) => [...stack.slice(-30), dataset]);
      setLocalRedoStack([]);
    }
    onEdit(next);
  };

  const undoCellOperation = () => {
    const previous = localUndoStack[localUndoStack.length - 1];
    if (!previous) return;
    setLocalUndoStack((stack) => stack.slice(0, -1));
    setLocalRedoStack((stack) => [...stack.slice(-30), dataset]);
    onEdit(previous);
    window.setTimeout(() => gridRef.current?.focus(), 0);
  };

  const redoCellOperation = () => {
    const next = localRedoStack[localRedoStack.length - 1];
    if (!next) return;
    setLocalRedoStack((stack) => stack.slice(0, -1));
    setLocalUndoStack((stack) => [...stack.slice(-30), dataset]);
    onEdit(next);
    window.setTimeout(() => gridRef.current?.focus(), 0);
  };

  return {
    applyDatasetEdit,
    undoCellOperation,
    redoCellOperation,
  };
}
