import React from "react";
import { Dataset } from "../../types";
import { ExcelFunctionDef } from "../../excelFormula";
import {
  CellFormat,
  PasteDialogState,
  RangeBounds,
  Selection,
  SheetContextMenu,
} from "./types";
import { htmlTableMatrix, matrixToDelimited } from "./matrixUtils";

interface DataPanelModalsProps {
  contextMenu: SheetContextMenu;
  setContextMenu: (menu: SheetContextMenu) => void;
  dataset: Dataset;
  handleQuickPlot: (col?: string) => void;
  onAssignColumnToShelf?: (col: string, shelf: "x" | "y" | "color") => void;
  copySelectedCells: () => void;
  cutSelectedCells: () => void;
  selectionRange: RangeBounds;
  pasteFromClipboard: (transpose?: boolean, start?: Selection) => void;
  insertRowAbove: (r: number) => void;
  addRow: (r: number) => void;
  deleteRow: (r: number) => void;
  insertColumnAt: (c: number, side: "left" | "right") => void;
  autoFitColumn: (col: string) => void;
  deleteColumn: (col: string) => void;
  setColumnType: (col: string, type: Dataset["types"][string]) => void;
  toggleSelectionFormat: (format: keyof CellFormat, value?: any) => void;
  fillMissing: (mode: "blank" | "zero" | "na" | "mean") => void;
  clearSelectedCells: () => void;
  pasteDialog: PasteDialogState;
  setPasteDialog: React.Dispatch<React.SetStateAction<PasteDialogState>>;
  submitPasteDialog: () => void;
  fxModalOpen: boolean;
  setFxModalOpen: (open: boolean) => void;
  fxSearchTerm: string;
  setFxSearchTerm: (term: string) => void;
  fxCategory: string;
  setFxCategory: (cat: string) => void;
  filteredFunctions: ExcelFunctionDef[];
  selectedFx: ExcelFunctionDef;
  setSelectedFx: (fn: ExcelFunctionDef) => void;
  insertFunctionTemplate: (fn: string) => void;
}

export function DataPanelModals({
  contextMenu,
  setContextMenu,
  dataset,
  handleQuickPlot,
  onAssignColumnToShelf,
  copySelectedCells,
  cutSelectedCells,
  selectionRange,
  pasteFromClipboard,
  insertRowAbove,
  addRow,
  deleteRow,
  insertColumnAt,
  autoFitColumn,
  deleteColumn,
  setColumnType,
  toggleSelectionFormat,
  fillMissing,
  clearSelectedCells,
  pasteDialog,
  setPasteDialog,
  submitPasteDialog,
  fxModalOpen,
  setFxModalOpen,
  fxSearchTerm,
  setFxSearchTerm,
  fxCategory,
  setFxCategory,
  filteredFunctions,
  selectedFx,
  setSelectedFx,
  insertFunctionTemplate,
}: DataPanelModalsProps) {
  return (
    <>
      {contextMenu && (
        <div
          className="sheet-context-menu"
          style={{
            left: Math.max(12, Math.min(contextMenu.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 240)),
            top: Math.max(12, Math.min(contextMenu.y, (typeof window !== "undefined" ? window.innerHeight : 800) - 420)),
          }}
          onClick={(e) => e.stopPropagation()}
          role="menu"
        >
          {(contextMenu.kind === "column" || contextMenu.kind === "cell") && dataset.columns[contextMenu.c] && (
            <>
              <button
                type="button"
                className="menu-accent-btn"
                onClick={() => {
                  const col = dataset.columns[contextMenu.c];
                  handleQuickPlot(col);
                  setContextMenu(null);
                }}
              >
                📊 Plot column &ldquo;{dataset.columns[contextMenu.c]}&rdquo;
              </button>
              {onAssignColumnToShelf && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onAssignColumnToShelf(dataset.columns[contextMenu.c], "x");
                      setContextMenu(null);
                    }}
                  >
                    ⚡ Set as X axis in figure
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onAssignColumnToShelf(dataset.columns[contextMenu.c], "y");
                      setContextMenu(null);
                    }}
                  >
                    ⚡ Set as Y axis in figure
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onAssignColumnToShelf(dataset.columns[contextMenu.c], "color");
                      setContextMenu(null);
                    }}
                  >
                    ⚡ Set as Color in figure
                  </button>
                </>
              )}
              <hr />
            </>
          )}
          <button type="button" onClick={() => { copySelectedCells(); setContextMenu(null); }}>Copy</button>
          <button type="button" onClick={() => { cutSelectedCells(); setContextMenu(null); }}>Cut</button>
          <button type="button" onClick={() => { const start = { r: selectionRange.r1, c: selectionRange.c1 }; setContextMenu(null); pasteFromClipboard(false, start); }}>Paste</button>
          <button type="button" onClick={() => { const start = { r: selectionRange.r1, c: selectionRange.c1 }; setContextMenu(null); pasteFromClipboard(true, start); }}>Paste transposed</button>
          <hr />
          {(contextMenu.kind === "cell" || contextMenu.kind === "row" || contextMenu.kind === "corner") && <button type="button" onClick={() => { insertRowAbove(contextMenu.r); setContextMenu(null); }}>Insert row above</button>}
          {(contextMenu.kind === "cell" || contextMenu.kind === "row" || contextMenu.kind === "corner") && <button type="button" onClick={() => { addRow(contextMenu.r); setContextMenu(null); }}>Insert row below</button>}
          {(contextMenu.kind === "cell" || contextMenu.kind === "row" || contextMenu.kind === "corner") && <button type="button" onClick={() => { deleteRow(contextMenu.r); setContextMenu(null); }}>Delete row</button>}
          <hr />
          {(contextMenu.kind === "cell" || contextMenu.kind === "column" || contextMenu.kind === "corner") && <button type="button" onClick={() => { insertColumnAt(contextMenu.c, "left"); setContextMenu(null); }}>Insert column left</button>}
          {(contextMenu.kind === "cell" || contextMenu.kind === "column" || contextMenu.kind === "corner") && <button type="button" onClick={() => { insertColumnAt(contextMenu.c, "right"); setContextMenu(null); }}>Insert column right</button>}
          {(contextMenu.kind === "column" || contextMenu.kind === "cell") && <button type="button" onClick={() => { autoFitColumn(dataset.columns[contextMenu.c]); setContextMenu(null); }}>Auto-fit column width</button>}
          {(contextMenu.kind === "cell" || contextMenu.kind === "column" || contextMenu.kind === "corner") && <button type="button" onClick={() => { deleteColumn(dataset.columns[contextMenu.c]); setContextMenu(null); }}>Delete column</button>}
          {(contextMenu.kind === "column" || contextMenu.kind === "cell") && <button type="button" onClick={() => { setColumnType(dataset.columns[contextMenu.c], "numeric"); setContextMenu(null); }}>Set column numeric</button>}
          {(contextMenu.kind === "column" || contextMenu.kind === "cell") && <button type="button" onClick={() => { setColumnType(dataset.columns[contextMenu.c], "categorical"); setContextMenu(null); }}>Set column categorical</button>}
          <hr />
          <button type="button" onClick={() => { toggleSelectionFormat("bold"); setContextMenu(null); }}>Toggle bold</button>
          <button type="button" onClick={() => { toggleSelectionFormat("italic"); setContextMenu(null); }}>Toggle italic</button>
          <button type="button" onClick={() => { toggleSelectionFormat("bg", "#fff2a8"); setContextMenu(null); }}>Highlight cells</button>
          <hr />
          <button type="button" onClick={() => { fillMissing("zero"); setContextMenu(null); }}>Fill missing with 0</button>
          <button type="button" onClick={() => { fillMissing("mean"); setContextMenu(null); }}>Fill numeric missing with mean</button>
          <hr />
          <button type="button" onClick={() => { clearSelectedCells(); setContextMenu(null); }}>Clear cells</button>
        </div>
      )}

      {pasteDialog.open && (
        <div className="sheet-paste-backdrop" role="dialog" aria-modal="true" aria-label="Paste table data" onMouseDown={() => setPasteDialog((state) => ({ ...state, open: false }))}>
          <div className="sheet-paste-dialog" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-paste-head">
              <div>
                <strong>{pasteDialog.transpose ? "Paste transposed" : "Paste table data"}</strong>
                <span>Clipboard access was blocked, so paste the cells here and Iris will place them in the selected range.</span>
              </div>
              <button className="icon-mini-btn" type="button" onClick={() => setPasteDialog((state) => ({ ...state, open: false }))} aria-label="Close paste dialog">×</button>
            </div>
            <textarea
              autoFocus
              value={pasteDialog.text}
              onChange={(e) => setPasteDialog((state) => ({ ...state, text: e.target.value }))}
              onPaste={(e) => {
                const html = e.clipboardData.getData("text/html");
                const matrix = htmlTableMatrix(html);
                if (!matrix.length) return;
                e.preventDefault();
                setPasteDialog((state) => ({ ...state, text: matrixToDelimited(matrix, "\t") }));
              }}
              placeholder={"Paste cells here, for example:\nA\tB\tC\n1\t2\t3"}
            />
            <label className="sheet-paste-check">
              <input
                type="checkbox"
                checked={pasteDialog.transpose}
                onChange={(e) => setPasteDialog((state) => ({ ...state, transpose: e.target.checked }))}
              />
              <span>Transpose rows and columns</span>
            </label>
            <div className="sheet-paste-actions">
              <button className="btn small" type="button" onClick={() => setPasteDialog((state) => ({ ...state, open: false }))}>Cancel</button>
              <button className="btn small primary" type="button" onClick={submitPasteDialog} disabled={!pasteDialog.text.trim()}>Paste</button>
            </div>
          </div>
        </div>
      )}

      {fxModalOpen && (
        <div className="fx-modal-backdrop" role="dialog" aria-modal="true" aria-label="Insert Function" onMouseDown={() => setFxModalOpen(false)}>
          <div className="fx-modal-dialog" onMouseDown={(e) => e.stopPropagation()}>
            <div className="fx-modal-head">
              <div>
                <strong>Insert Function</strong>
                <span>Search for a function or select a category to browse Excel formula functions.</span>
              </div>
              <button className="icon-mini-btn" type="button" onClick={() => setFxModalOpen(false)} aria-label="Close dialog">×</button>
            </div>

            <div className="fx-modal-search-row">
              <label>
                <span>Search for a function:</span>
                <input
                  type="text"
                  autoFocus
                  placeholder="Type a function name or description (e.g. sum, if, mean)..."
                  value={fxSearchTerm}
                  onChange={(e) => setFxSearchTerm(e.target.value)}
                />
              </label>
              <label>
                <span>Or select a category:</span>
                <select value={fxCategory} onChange={(e) => setFxCategory(e.target.value)}>
                  <option value="All">All Categories</option>
                  <option value="Math">Math &amp; Trigonometry</option>
                  <option value="Statistical">Statistical</option>
                  <option value="Logical">Logical</option>
                  <option value="Text">Text</option>
                  <option value="Lookup">Lookup &amp; Reference</option>
                  <option value="Date">Date &amp; Time</option>
                </select>
              </label>
            </div>

            <div className="fx-content-grid">
              <div className="fx-func-list-pane">
                <span className="fx-pane-title">Select a function:</span>
                <div className="fx-func-list">
                  {filteredFunctions.map((fn) => (
                    <div
                      key={fn.name}
                      className={`fx-func-item ${selectedFx?.name === fn.name ? "selected" : ""}`}
                      onClick={() => setSelectedFx(fn)}
                      onDoubleClick={() => {
                        setSelectedFx(fn);
                        insertFunctionTemplate(fn.name);
                        setFxModalOpen(false);
                      }}
                    >
                      <strong>{fn.name}</strong>
                      <span className="fx-item-cat">{fn.category}</span>
                    </div>
                  ))}
                  {filteredFunctions.length === 0 && (
                    <div className="fx-empty-msg">No matching functions found.</div>
                  )}
                </div>
              </div>

              <div className="fx-func-detail-pane">
                {selectedFx ? (
                  <>
                    <div className="fx-detail-syntax">{selectedFx.syntax}</div>
                    <div className="fx-detail-desc">{selectedFx.description}</div>
                    {selectedFx.example && (
                      <div className="fx-detail-example">
                        <strong>Example:</strong>
                        <code>{selectedFx.example}</code>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="fx-empty-msg">Select a function to view its syntax and description.</div>
                )}
              </div>
            </div>

            <div className="fx-modal-actions">
              <button className="btn small" type="button" onClick={() => setFxModalOpen(false)}>Cancel</button>
              <button
                className="btn small primary"
                type="button"
                disabled={!selectedFx}
                onClick={() => {
                  if (selectedFx) {
                    insertFunctionTemplate(selectedFx.name);
                    setFxModalOpen(false);
                  }
                }}
              >
                Insert Function
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
