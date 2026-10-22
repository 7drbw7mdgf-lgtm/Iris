import React from "react";
import { Dataset } from "../../types";
import {
  columnLetter,
  RangeBounds,
  ResizeDrag,
  Selection,
  SheetContextMenu,
  SortState,
} from "./types";

interface GridHeaderProps {
  dataset: Dataset;
  selectAllCells: () => void;
  setContextMenu: (menu: SheetContextMenu) => void;
  selectionRange: RangeBounds;
  selectWholeColumn: (c: number, extend?: boolean) => void;
  resizeDragRef: React.RefObject<ResizeDrag | null>;
  setDragCol: (col: string | null) => void;
  setOverCol: (col: string | null) => void;
  dragCol: string | null;
  overCol: string | null;
  reorderColumn: (src: string, dst: string) => void;
  columnDrafts: Record<string, string>;
  setColumnDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  selectCell: (r: number, c: number, extend?: boolean) => void;
  selected: Selection;
  renameColumn: (oldName: string, newName: string) => void;
  sort: SortState | null;
  toggleSort: (col: string) => void;
  startColumnResize: (e: React.PointerEvent<HTMLButtonElement>, col: string) => void;
  autoFitColumn: (col: string) => void;
}

export function GridHeader({
  dataset,
  selectAllCells,
  setContextMenu,
  selectionRange,
  selectWholeColumn,
  resizeDragRef,
  setDragCol,
  setOverCol,
  dragCol,
  overCol,
  reorderColumn,
  columnDrafts,
  setColumnDrafts,
  selectCell,
  selected,
  renameColumn,
  sort,
  toggleSort,
  startColumnResize,
  autoFitColumn,
}: GridHeaderProps) {
  return (
    <thead>
      <tr className="sheet-letter-row">
        <th
          className="row-index corner-cell prism-corner"
          onClick={selectAllCells}
          onContextMenu={(e) => {
            e.preventDefault();
            selectAllCells();
            setContextMenu({ x: e.clientX, y: e.clientY, r: 0, c: 0, kind: "corner" });
          }}
        />
        {dataset.columns.map((c, cIndex) => (
          <th
            key={`${c}-letter`}
            className={`sheet-letter-cell ${cIndex >= selectionRange.c1 && cIndex <= selectionRange.c2 ? "selected-col" : ""}`}
            onClick={(e) => selectWholeColumn(cIndex, e.shiftKey)}
            onContextMenu={(e) => {
              e.preventDefault();
              selectWholeColumn(cIndex);
              setContextMenu({ x: e.clientX, y: e.clientY, r: 0, c: cIndex, kind: "column" });
            }}
          >
            {columnLetter(cIndex)}
          </th>
        ))}
      </tr>
      <tr>
        <th
          className="row-index corner-cell column-title-corner"
          onClick={selectAllCells}
          onContextMenu={(e) => {
            e.preventDefault();
            selectAllCells();
            setContextMenu({ x: e.clientX, y: e.clientY, r: 0, c: 0, kind: "corner" });
          }}
        />
        {dataset.columns.map((c, cIndex) => (
          <th
            key={c}
            className={cIndex >= selectionRange.c1 && cIndex <= selectionRange.c2 ? "selected-col" : ""}
            draggable
            onClick={(e) => selectWholeColumn(cIndex, e.shiftKey)}
            onContextMenu={(e) => {
              e.preventDefault();
              selectWholeColumn(cIndex);
              setContextMenu({ x: e.clientX, y: e.clientY, r: 0, c: cIndex, kind: "column" });
            }}
            onDragStart={(e) => {
              if (resizeDragRef.current) {
                e.preventDefault();
                return;
              }
              e.dataTransfer.setData("text/column", c);
              e.dataTransfer.setData("text/plain", c);
              e.dataTransfer.effectAllowed = "copyMove";
              setDragCol(c);
            }}
            onDragEnd={() => {
              setDragCol(null);
              setOverCol(null);
            }}
            onDragOver={(e) => {
              if (dragCol && dragCol !== c) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setOverCol(c);
              }
            }}
            onDrop={(e) => {
              if (dragCol && dragCol !== c) {
                e.preventDefault();
                reorderColumn(dragCol, c);
              }
              setDragCol(null);
              setOverCol(null);
            }}
          >
            <div className={`sheet-column-head ${overCol === c ? "reorder-over" : ""}`}>
              <input
                value={columnDrafts[c] ?? c}
                onChange={(e) => setColumnDrafts((d) => ({ ...d, [c]: e.target.value }))}
                onFocus={() => {
                  setColumnDrafts((d) => ({ ...d, [c]: d[c] ?? c }));
                  selectCell(selected.r, cIndex);
                }}
                onBlur={() => renameColumn(c, columnDrafts[c] ?? c)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  } else if (e.key === "Escape") {
                    setColumnDrafts((d) => ({ ...d, [c]: c }));
                    e.currentTarget.blur();
                  }
                }}
                title="Rename column"
              />
              <span className={`type-dot ${dataset.types[c]}`} title={dataset.types[c]} />
              <button
                type="button"
                className={`sheet-sort-btn ${sort?.column === c ? "active" : ""}`}
                title={
                  sort?.column === c
                    ? sort.direction === "desc"
                      ? `Sorted high to low. Click to sort ${c} low to high.`
                      : `Sorted low to high. Click to clear sort.`
                    : `Sort ${c} high to low`
                }
                aria-label={`Toggle sort for ${c}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSort(c);
                }}
              >
                {sort?.column === c ? (sort.direction === "desc" ? "↓" : "↑") : "↕"}
              </button>
              <button
                type="button"
                className="sheet-resize-handle"
                aria-label={`Resize ${c}`}
                title={`Resize ${c}`}
                onPointerDown={(e) => startColumnResize(e, c)}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  autoFitColumn(c);
                }}
              />
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}
