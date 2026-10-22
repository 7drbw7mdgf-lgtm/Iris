import React from "react";
import { Dataset } from "../../types";
import {
  CellFormat,
  CellValue,
  FillDrag,
  formatCellValue,
  RangeBounds,
  ResizeDrag,
  Selection,
  SheetContextMenu,
  SortState,
} from "./types";
import { clipboardMatrixFromEvent } from "./matrixUtils";
import { GridHeader } from "./GridHeader";

interface DataPanelGridProps {
  gridRef: React.RefObject<HTMLDivElement | null>;
  tableRef: React.RefObject<HTMLTableElement | null>;
  handleGridKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  setDragSelecting: (selecting: boolean) => void;
  completeFillDrag: () => void;
  activeTableView: "table" | "curve" | "residual" | "outliers";
  setActiveTableView: (view: "table" | "curve" | "residual" | "outliers") => void;
  tableTitle: string;
  tableViewLabel: string;
  tableWidth: number;
  tableZoom: number;
  dataset: Dataset;
  columnWidth: (col: string) => number;
  selectAllCells: () => void;
  setContextMenu: (menu: SheetContextMenu) => void;
  selectionRange: RangeBounds;
  selectWholeColumn: (c: number, extend?: boolean) => void;
  selectWholeRow: (r: number, extend?: boolean) => void;
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
  displayRows: Array<{ row: Record<string, any>; originalIndex: number }>;
  cellFormats: Record<string, CellFormat>;
  formatKey: (r: number, c: number) => string;
  isInRange: (r: number, c: number) => boolean;
  isInCopiedRange: (r: number, c: number) => boolean;
  copiedRange: (RangeBounds & { cut: boolean }) | null;
  isInFillPreview: (r: number, c: number) => boolean;
  isInvalidCell: (r: number, c: number) => boolean;
  fillDrag: FillDrag;
  updateFillTarget: (r: number, c: number) => void;
  dragSelecting: boolean;
  startEdit: (r: number, c: number, val: any) => void;
  editing: Selection | null;
  draft: string;
  setDraft: (d: string) => void;
  setFormulaDraft: (d: string) => void;
  commitEdit: (nextSelection?: Selection) => void;
  setEditing: (e: Selection | null) => void;
  applyClipboardMatrix: (matrix: CellValue[][], start: Selection) => void;
  startFillHandleDrag: (e: React.PointerEvent<HTMLButtonElement>) => void;
  preview: Dataset["rows"];
}

export function DataPanelGrid({
  gridRef,
  tableRef,
  handleGridKeyDown,
  handlePaste,
  setDragSelecting,
  completeFillDrag,
  activeTableView,
  setActiveTableView,
  tableTitle,
  tableViewLabel,
  tableWidth,
  tableZoom,
  dataset,
  columnWidth,
  selectAllCells,
  setContextMenu,
  selectionRange,
  selectWholeColumn,
  selectWholeRow,
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
  displayRows,
  cellFormats,
  formatKey,
  isInRange,
  isInCopiedRange,
  copiedRange,
  isInFillPreview,
  isInvalidCell,
  fillDrag,
  updateFillTarget,
  dragSelecting,
  startEdit,
  editing,
  draft,
  setDraft,
  setFormulaDraft,
  commitEdit,
  setEditing,
  applyClipboardMatrix,
  startFillHandleDrag,
  preview,
}: DataPanelGridProps) {
  return (
    <div
      className="table-wrap spreadsheet-wrap"
      ref={gridRef}
      tabIndex={0}
      onKeyDown={handleGridKeyDown}
      onPaste={handlePaste}
      onMouseLeave={() => setDragSelecting(false)}
      onMouseUp={() => {
        setDragSelecting(false);
        completeFillDrag();
      }}
      aria-label="Editable spreadsheet"
    >
      <div className="prism-table-tabs">
        <button className={`prism-table-tab ${activeTableView === "table" ? "active" : ""}`} type="button" onClick={() => setActiveTableView("table")}>
          <span className="prism-table-icon" aria-hidden="true" />
          <span>{tableTitle}</span>
          <span className="prism-tab-close" aria-hidden="true">x</span>
        </button>
        <button className={`prism-table-tab ${activeTableView === "outliers" ? "active alt" : "alt"}`} type="button" onClick={() => setActiveTableView("outliers")}>
          <span className="prism-table-icon" aria-hidden="true" />
          <span>Outliers</span>
          <span className="prism-tab-close" aria-hidden="true">x</span>
        </button>
        <details className="prism-view-menu">
          <summary aria-label="Choose table view">▾</summary>
          <div className="prism-view-menu-popover">
            <button type="button" className={activeTableView === "table" ? "active" : ""} onClick={() => setActiveTableView("table")}><span>{activeTableView === "table" ? "✓" : ""}</span> Table of data</button>
            <button type="button" className={activeTableView === "curve" ? "active" : ""} onClick={() => setActiveTableView("curve")}><span>{activeTableView === "curve" ? "✓" : ""}</span> Curve</button>
            <button type="button" className={activeTableView === "residual" ? "active" : ""} onClick={() => setActiveTableView("residual")}><span>{activeTableView === "residual" ? "✓" : ""}</span> Residual plot</button>
            <button type="button" className={activeTableView === "outliers" ? "active" : ""} onClick={() => setActiveTableView("outliers")}><span>{activeTableView === "outliers" ? "✓" : ""}</span> Outliers</button>
          </div>
        </details>
      </div>
      {activeTableView !== "table" && (
        <div className="prism-view-note">
          <strong>{tableViewLabel}</strong>
          <span>This view is linked to the table. Add analysis output here when a fit or outlier test is run.</span>
        </div>
      )}
      <table className="data-table spreadsheet-table" ref={tableRef} style={{ minWidth: tableWidth, zoom: tableZoom !== 100 ? `${tableZoom}%` : undefined }}>
        <colgroup>
          <col style={{ width: 42 }} />
          {dataset.columns.map((column) => <col key={column} style={{ width: columnWidth(column) }} />)}
        </colgroup>
        <GridHeader
          dataset={dataset}
          selectAllCells={selectAllCells}
          setContextMenu={setContextMenu}
          selectionRange={selectionRange}
          selectWholeColumn={selectWholeColumn}
          resizeDragRef={resizeDragRef}
          setDragCol={setDragCol}
          setOverCol={setOverCol}
          dragCol={dragCol}
          overCol={overCol}
          reorderColumn={reorderColumn}
          columnDrafts={columnDrafts}
          setColumnDrafts={setColumnDrafts}
          selectCell={selectCell}
          selected={selected}
          renameColumn={renameColumn}
          sort={sort}
          toggleSort={toggleSort}
          startColumnResize={startColumnResize}
          autoFitColumn={autoFitColumn}
        />
        <tbody>
          {displayRows.map(({ row: r, originalIndex }) => (
            <tr key={originalIndex}>
              <th
                className={`row-index ${originalIndex >= selectionRange.r1 && originalIndex <= selectionRange.r2 ? "selected-row" : ""}`}
                onClick={(e) => selectWholeRow(originalIndex, e.shiftKey)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  selectWholeRow(originalIndex);
                  setContextMenu({ x: e.clientX, y: e.clientY, r: originalIndex, c: 0, kind: "row" });
                }}
              >
                {originalIndex + 1}
              </th>
              {dataset.columns.map((c, cIndex) => {
                const fmt = cellFormats[formatKey(originalIndex, cIndex)];
                return (
                  <td
                    key={c}
                    data-row={originalIndex}
                    data-col={cIndex}
                    className={`editable-cell ${isInRange(originalIndex, cIndex) ? "selected-range-cell" : ""} ${isInCopiedRange(originalIndex, cIndex) ? copiedRange?.cut ? "cut-range-cell" : "copied-range-cell" : ""} ${isInFillPreview(originalIndex, cIndex) ? "fill-preview-cell" : ""} ${selected.r === originalIndex && selected.c === cIndex ? "selected-cell" : ""} ${isInvalidCell(originalIndex, cIndex) ? "invalid-cell" : ""} ${fmt?.bold ? "cell-bold" : ""} ${fmt?.italic ? "cell-italic" : ""} ${fmt?.underline ? "cell-underline" : ""} ${fmt?.strike ? "cell-strike" : ""}`}
                    style={{
                      backgroundColor: fmt?.bg,
                      color: fmt?.color,
                      textAlign: fmt?.align ?? (dataset.types[c] === "numeric" ? "right" : "left"),
                      fontWeight: fmt?.bold ? 700 : undefined,
                      fontStyle: fmt?.italic ? "italic" : undefined,
                      textDecoration: [fmt?.underline ? "underline" : "", fmt?.strike ? "line-through" : ""].filter(Boolean).join(" ") || undefined,
                    }}
                    tabIndex={-1}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      if (fillDrag) return;
                      gridRef.current?.focus();
                      setDragSelecting(true);
                      selectCell(originalIndex, cIndex, e.shiftKey);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      gridRef.current?.focus();
                      if (!isInRange(originalIndex, cIndex)) selectCell(originalIndex, cIndex);
                      setContextMenu({ x: e.clientX, y: e.clientY, r: originalIndex, c: cIndex, kind: "cell" });
                    }}
                    onMouseEnter={() => {
                      if (fillDrag) updateFillTarget(originalIndex, cIndex);
                      if (dragSelecting) selectCell(originalIndex, cIndex, true);
                    }}
                    onDoubleClick={() => startEdit(originalIndex, cIndex, r[c])}
                  >
                    {editing && editing.r === originalIndex && editing.c === cIndex ? (
                      <input
                        className="cell-edit"
                        autoFocus
                        value={draft}
                        onChange={(e) => {
                          setDraft(e.target.value);
                          setFormulaDraft(e.target.value);
                        }}
                        onBlur={() => commitEdit()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            commitEdit({ r: originalIndex + 1, c: cIndex });
                          } else if (e.key === "Tab") {
                            e.preventDefault();
                            commitEdit({ r: originalIndex, c: Math.max(0, Math.min(dataset.columns.length - 1, cIndex + (e.shiftKey ? -1 : 1))) });
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            setEditing(null);
                          }
                        }}
                        onPaste={(e) => {
                          const matrix = clipboardMatrixFromEvent(e.clipboardData);
                          const isRangePaste = matrix.length > 1 || (matrix[0]?.length ?? 0) > 1;
                          if (!isRangePaste) return;
                          e.preventDefault();
                          setEditing(null);
                          applyClipboardMatrix(matrix, { r: originalIndex, c: cIndex });
                        }}
                      />
                    ) : (
                      <>
                        {formatCellValue(r[c], fmt)}
                        {selected.r === originalIndex && selected.c === cIndex && (
                          <button className="cell-fill-handle" type="button" aria-label="Fill handle" onPointerDown={startFillHandleDrag} />
                        )}
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {dataset.rows.length > preview.length && (
        <div className="muted small center">…{dataset.rows.length - preview.length} more rows</div>
      )}
    </div>
  );
}
