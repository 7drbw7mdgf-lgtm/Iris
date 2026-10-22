import React, { useState, useRef, useEffect } from "react";
import { Dataset } from "../../types";
import { parseDatasetFromCode } from "../../sampleData";
import { CellValue, ResizeDrag, Selection, SortState } from "./types";

interface UseSheetTableOpsProps {
  dataset: Dataset;
  applyDatasetEdit: (next: Dataset) => void;
  recalcTypes: (rows: Dataset["rows"], columns?: string[]) => Dataset["types"];
  selected: Selection;
  setSelected: React.Dispatch<React.SetStateAction<Selection>>;
  setSelectionAnchor: React.Dispatch<React.SetStateAction<Selection>>;
  selectedColumn: string;
  codeText: string;
  setCodeError: (error: string) => void;
}

export function useSheetTableOps({
  dataset,
  applyDatasetEdit,
  recalcTypes,
  selected,
  setSelected,
  setSelectionAnchor,
  selectedColumn,
  codeText,
  setCodeError,
}: UseSheetTableOpsProps) {
  const [sort, setSort] = useState<SortState | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [columnDrafts, setColumnDrafts] = useState<Record<string, string>>({});
  const [dragCol, setDragCol] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const resizeDragRef = useRef<ResizeDrag | null>(null);

  useEffect(() => {
    if (sort && !dataset.columns.includes(sort.column)) setSort(null);
  }, [dataset.columns, sort]);

  useEffect(() => {
    setColumnWidths((current) => {
      const next: Record<string, number> = {};
      dataset.columns.forEach((column) => {
        next[column] = current[column] ?? 128;
      });
      return next;
    });
  }, [dataset.columns]);

  const columnWidth = (column: string) => columnWidths[column] ?? 128;
  const tableWidth = 42 + dataset.columns.reduce((sum, column) => sum + columnWidth(column), 0);

  const reorderColumn = (src: string, dst: string) => {
    if (src === dst) return;
    const cols = dataset.columns.filter((c) => c !== src);
    const insertAt = cols.indexOf(dst);
    cols.splice(insertAt, 0, src);
    applyDatasetEdit({ ...dataset, columns: cols });
  };

  const nextColumnNameFrom = (columns: string[]) => {
    let index = columns.length + 1;
    let name = `Column ${index}`;
    while (columns.includes(name)) {
      index += 1;
      name = `Column ${index}`;
    }
    return name;
  };

  const nextColumnName = () => nextColumnNameFrom(dataset.columns);

  const addRow = (after = dataset.rows.length - 1) => {
    const empty = Object.fromEntries(dataset.columns.map((c) => [c, null])) as Record<string, CellValue>;
    const rows = [...dataset.rows];
    rows.splice(Math.max(0, after + 1), 0, empty);
    applyDatasetEdit({ ...dataset, rows, types: recalcTypes(rows) });
    setSelected({ r: Math.max(0, after + 1), c: selected.c });
    setSelectionAnchor({ r: Math.max(0, after + 1), c: selected.c });
  };

  const deleteRow = (index = selected.r) => {
    if (!dataset.rows.length) return;
    const rows = dataset.rows.filter((_, i) => i !== index);
    applyDatasetEdit({ ...dataset, rows, types: recalcTypes(rows) });
    const next = { r: Math.max(0, Math.min(rows.length - 1, selected.r)), c: selected.c };
    setSelected(next);
    setSelectionAnchor(next);
  };

  const insertRowAbove = (index = selected.r) => {
    const empty = Object.fromEntries(dataset.columns.map((c) => [c, null])) as Record<string, CellValue>;
    const rows = [...dataset.rows];
    rows.splice(Math.max(0, index), 0, empty);
    applyDatasetEdit({ ...dataset, rows, types: recalcTypes(rows) });
    setSelected({ r: Math.max(0, index), c: selected.c });
    setSelectionAnchor({ r: Math.max(0, index), c: selected.c });
  };

  const addColumn = () => {
    const name = nextColumnName();
    const columns = [...dataset.columns, name];
    const rows = dataset.rows.length
      ? dataset.rows.map((row) => ({ ...row, [name]: null }))
      : Array.from({ length: 8 }, () => ({ [name]: null } as Record<string, CellValue>));
    applyDatasetEdit({ ...dataset, columns, rows, types: recalcTypes(rows, columns) });
    setSelected({ r: selected.r, c: columns.length - 1 });
    setSelectionAnchor({ r: selected.r, c: columns.length - 1 });
  };

  const insertColumnAt = (index: number, side: "left" | "right") => {
    const name = nextColumnName();
    const columns = [...dataset.columns];
    const insertAt = Math.max(0, Math.min(columns.length, index + (side === "right" ? 1 : 0)));
    columns.splice(insertAt, 0, name);
    const rows = dataset.rows.length
      ? dataset.rows.map((row) => ({ ...row, [name]: null }))
      : Array.from({ length: 8 }, () => ({ [name]: null } as Record<string, CellValue>));
    applyDatasetEdit({ ...dataset, columns, rows, types: recalcTypes(rows, columns) });
    setSelected({ r: selected.r, c: insertAt });
    setSelectionAnchor({ r: selected.r, c: insertAt });
  };

  const createStarterTable = () => {
    const columns = ["Column 1", "Column 2", "Column 3"];
    const rows = Array.from({ length: 8 }, () => Object.fromEntries(columns.map((c) => [c, null])) as Record<string, CellValue>);
    applyDatasetEdit({ ...dataset, columns, rows, types: recalcTypes(rows, columns) });
  };

  const applyCodeData = () => {
    try {
      const parsed = parseDatasetFromCode(dataset.name || "Code table", codeText);
      applyDatasetEdit(parsed);
      setCodeError("");
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : "Failed to parse data from code");
    }
  };

  const deleteColumn = (column = selectedColumn) => {
    if (dataset.columns.length <= 1) return;
    const columns = dataset.columns.filter((c) => c !== column);
    const rows = dataset.rows.map((row) => {
      const next = { ...row };
      delete next[column];
      return next;
    });
    const types = { ...dataset.types };
    delete types[column];
    applyDatasetEdit({ ...dataset, columns, rows, types });
    const next = { r: Math.max(0, Math.min(rows.length - 1, selected.r)), c: Math.max(0, Math.min(columns.length - 1, selected.c)) };
    setSelected(next);
    setSelectionAnchor(next);
  };

  const renameColumn = (oldName: string, nextNameRaw: string) => {
    const nextName = nextNameRaw.trim();
    if (!nextName || nextName === oldName) {
      setColumnDrafts((d) => {
        const copy = { ...d };
        delete copy[oldName];
        return copy;
      });
      return;
    }
    const columns = dataset.columns.map((c) => (c === oldName ? nextName : c));
    const rows = dataset.rows.map((row) => {
      const next = { ...row, [nextName]: row[oldName] };
      delete next[oldName];
      return next;
    });
    const types = { ...dataset.types, [nextName]: dataset.types[oldName] };
    delete types[oldName];
    applyDatasetEdit({ ...dataset, columns, rows, types });
    setColumnDrafts((d) => {
      const copy = { ...d };
      delete copy[oldName];
      return copy;
    });
  };

  const setColumnType = (column: string, type: Dataset["types"][string]) => {
    const rows = dataset.rows.map((row) => {
      const value = row[column];
      if (value == null || value === "") return row;
      const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
      if (type === "numeric") {
        return { ...row, [column]: Number.isFinite(n) ? n : value };
      }
      return { ...row, [column]: String(value) };
    });
    applyDatasetEdit({ ...dataset, rows, types: { ...dataset.types, [column]: type } });
  };

  const toggleSort = (column: string) => {
    setSort((current) => {
      if (current?.column === column && current.direction === "asc") return { column, direction: "desc" };
      if (current?.column === column && current.direction === "desc") return null;
      return { column, direction: "asc" };
    });
  };

  const sortColumn = (column: string, direction: "asc" | "desc") => {
    setSort({ column, direction });
  };

  const startColumnResize = (e: React.PointerEvent<HTMLButtonElement>, column: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidth(column);
    resizeDragRef.current = { column, startX, startWidth };
    const pointerId = e.pointerId;
    e.currentTarget.setPointerCapture?.(pointerId);
    const move = (event: PointerEvent) => {
      const active = resizeDragRef.current;
      if (!active) return;
      const width = Math.max(64, Math.min(420, active.startWidth + event.clientX - active.startX));
      setColumnWidths((current) => ({ ...current, [active.column]: width }));
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      resizeDragRef.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  const autoFitColumn = (column: string) => {
    const headerWidth = Math.max(96, column.length * 8 + 48);
    const sampleWidth = dataset.rows
      .slice(0, 40)
      .reduce((max, row) => Math.max(max, String(row[column] ?? "").length * 8 + 24), 0);
    setColumnWidths((current) => ({ ...current, [column]: Math.max(64, Math.min(360, Math.max(headerWidth, sampleWidth))) }));
  };

  return {
    sort,
    setSort,
    toggleSort,
    sortColumn,
    columnWidths,
    setColumnWidths,
    columnWidth,
    tableWidth,
    columnDrafts,
    setColumnDrafts,
    dragCol,
    setDragCol,
    overCol,
    setOverCol,
    reorderColumn,
    nextColumnName,
    nextColumnNameFrom,
    addRow,
    deleteRow,
    insertRowAbove,
    addColumn,
    insertColumnAt,
    createStarterTable,
    applyCodeData,
    deleteColumn,
    renameColumn,
    setColumnType,
    startColumnResize,
    autoFitColumn,
    resizeDragRef,
  };
}
