import { Dataset } from "../../types";
import { CellFormat, RangeBounds, Selection } from "./types";

interface RibbonHomeTabProps {
  hasGrid: boolean;
  hasSelection: boolean;
  selected: Selection;
  cellFormats: Record<string, CellFormat>;
  formatKey: (r: number, c: number) => string;
  pasteFromClipboard: (transpose?: boolean) => void;
  cutSelectedCells: () => void;
  copySelectedCells: () => void;
  toggleSelectionFormat: (format: keyof CellFormat, value?: any) => void;
  applyAlignment: (align: "left" | "center" | "right") => void;
  applyNumberFormat: (numFormat: CellFormat["numFormat"]) => void;
  adjustDecimals: (delta: number) => void;
  addRow: (after?: number) => void;
  addColumn: () => void;
  deleteRow: (index?: number) => void;
  deleteColumn: (col?: string) => void;
  selectedColumn: string;
  dataset: Dataset;
  applyAutoSum: (funcName: "SUM" | "AVERAGE" | "COUNT" | "MAX" | "MIN") => void;
  fillSelection: (direction: "down" | "right") => void;
  selectionRange: RangeBounds;
  clearSelection: (mode: "all" | "formats" | "contents") => void;
  sortColumn: (col: string, direction: "asc" | "desc") => void;
  fillColorPickerOpen: boolean;
  setFillColorPickerOpen: (open: boolean) => void;
  textColorPickerOpen: boolean;
  setTextColorPickerOpen: (open: boolean) => void;
}

export function RibbonHomeTab({
  hasGrid,
  hasSelection,
  selected,
  cellFormats,
  formatKey,
  pasteFromClipboard,
  cutSelectedCells,
  copySelectedCells,
  toggleSelectionFormat,
  applyAlignment,
  applyNumberFormat,
  adjustDecimals,
  addRow,
  addColumn,
  deleteRow,
  deleteColumn,
  selectedColumn,
  dataset,
  applyAutoSum,
  fillSelection,
  selectionRange,
  clearSelection,
  sortColumn,
  fillColorPickerOpen,
  setFillColorPickerOpen,
  textColorPickerOpen,
  setTextColorPickerOpen,
}: RibbonHomeTabProps) {
  return (
    <>
      <div className="sheet-ribbon-group" aria-label="Clipboard">
        <div className="ribbon-btn-cluster">
          <button className="sheet-tool-btn" type="button" onClick={() => pasteFromClipboard(false)} disabled={!hasGrid} title="Paste clipboard into selected cell">Paste</button>
          <button className="sheet-tool-btn" type="button" onClick={cutSelectedCells} disabled={!hasSelection} title="Cut selected cells">Cut</button>
          <button className="sheet-tool-btn" type="button" onClick={copySelectedCells} disabled={!hasSelection} title="Copy selected cells">Copy</button>
        </div>
        <span className="ribbon-group-label">Clipboard</span>
      </div>

      <div className="sheet-ribbon-group" aria-label="Font">
        <div className="ribbon-btn-cluster">
          <button className={`sheet-tool-btn sheet-tool-icon ${cellFormats[formatKey(selected.r, selected.c)]?.bold ? "active" : ""}`} type="button" onClick={() => toggleSelectionFormat("bold")} disabled={!hasSelection} title="Bold"><b>B</b></button>
          <button className={`sheet-tool-btn sheet-tool-icon italic ${cellFormats[formatKey(selected.r, selected.c)]?.italic ? "active" : ""}`} type="button" onClick={() => toggleSelectionFormat("italic")} disabled={!hasSelection} title="Italic"><i>I</i></button>
          <button className={`sheet-tool-btn sheet-tool-icon ${cellFormats[formatKey(selected.r, selected.c)]?.underline ? "active" : ""}`} type="button" onClick={() => toggleSelectionFormat("underline")} disabled={!hasSelection} title="Underline"><u>U</u></button>
          <button className={`sheet-tool-btn sheet-tool-icon ${cellFormats[formatKey(selected.r, selected.c)]?.strike ? "active" : ""}`} type="button" onClick={() => toggleSelectionFormat("strike")} disabled={!hasSelection} title="Strikethrough"><s>S</s></button>

          {/* Fill Color Picker */}
          <div className="ribbon-color-picker-wrap">
            <button
              className="sheet-tool-btn color-dropdown-btn"
              type="button"
              onClick={() => setFillColorPickerOpen(!fillColorPickerOpen)}
              disabled={!hasSelection}
              title="Fill Color"
            >
              <span className="color-icon-bucket">🎨</span>
              <span className="color-indicator-bar" style={{ backgroundColor: cellFormats[formatKey(selected.r, selected.c)]?.bg || "#fff2a8" }} />
              <span className="dropdown-caret">▾</span>
            </button>
            {fillColorPickerOpen && (
              <div className="color-palette-popover" onClick={() => setFillColorPickerOpen(false)}>
                <div className="palette-title">Theme Colors</div>
                <div className="palette-grid">
                  {[
                    { label: "Yellow", color: "#fff2a8" },
                    { label: "Green", color: "#d9ead3" },
                    { label: "Blue", color: "#cfe2f3" },
                    { label: "Red", color: "#f4cccc" },
                    { label: "Orange", color: "#fce5cd" },
                    { label: "Purple", color: "#ead1dc" },
                    { label: "Lime", color: "#e2efda" },
                    { label: "Cyan", color: "#d0e0e3" },
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      className="color-swatch-btn"
                      style={{ backgroundColor: c.color }}
                      onClick={() => toggleSelectionFormat("bg", c.color)}
                      title={c.label}
                    />
                  ))}
                </div>
                <button type="button" className="clear-color-btn" onClick={() => toggleSelectionFormat("bg", "")}>No Fill</button>
              </div>
            )}
          </div>

          {/* Text Color Picker */}
          <div className="ribbon-color-picker-wrap">
            <button
              className="sheet-tool-btn color-dropdown-btn"
              type="button"
              onClick={() => setTextColorPickerOpen(!textColorPickerOpen)}
              disabled={!hasSelection}
              title="Font Color"
            >
              <span className="color-icon-text">A</span>
              <span className="color-indicator-bar" style={{ backgroundColor: cellFormats[formatKey(selected.r, selected.c)]?.color || "#111" }} />
              <span className="dropdown-caret">▾</span>
            </button>
            {textColorPickerOpen && (
              <div className="color-palette-popover" onClick={() => setTextColorPickerOpen(false)}>
                <div className="palette-title">Font Colors</div>
                <div className="palette-grid">
                  {[
                    { label: "Dark Red", color: "#c00000" },
                    { label: "Green", color: "#375623" },
                    { label: "Blue", color: "#1f4e78" },
                    { label: "Purple", color: "#7030a0" },
                    { label: "Orange", color: "#c65911" },
                    { label: "Dark Gray", color: "#595959" },
                    { label: "Black", color: "#000000" },
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      className="color-swatch-btn"
                      style={{ backgroundColor: c.color }}
                      onClick={() => toggleSelectionFormat("color", c.color)}
                      title={c.label}
                    />
                  ))}
                </div>
                <button type="button" className="clear-color-btn" onClick={() => toggleSelectionFormat("color", "")}>Automatic</button>
              </div>
            )}
          </div>
        </div>
        <span className="ribbon-group-label">Font</span>
      </div>

      <div className="sheet-ribbon-group" aria-label="Alignment">
        <div className="ribbon-btn-cluster">
          <button className={`sheet-tool-btn ${cellFormats[formatKey(selected.r, selected.c)]?.align === "left" ? "active" : ""}`} type="button" onClick={() => applyAlignment("left")} disabled={!hasSelection} title="Align Left">Left</button>
          <button className={`sheet-tool-btn ${cellFormats[formatKey(selected.r, selected.c)]?.align === "center" ? "active" : ""}`} type="button" onClick={() => applyAlignment("center")} disabled={!hasSelection} title="Align Center">Center</button>
          <button className={`sheet-tool-btn ${cellFormats[formatKey(selected.r, selected.c)]?.align === "right" ? "active" : ""}`} type="button" onClick={() => applyAlignment("right")} disabled={!hasSelection} title="Align Right">Right</button>
        </div>
        <span className="ribbon-group-label">Alignment</span>
      </div>

      <div className="sheet-ribbon-group" aria-label="Number">
        <div className="ribbon-btn-cluster">
          <select
            className="sheet-tool-select number-format-select"
            value={cellFormats[formatKey(selected.r, selected.c)]?.numFormat || "general"}
            onChange={(e) => applyNumberFormat(e.target.value as any)}
            disabled={!hasSelection}
            title="Number Format"
          >
            <option value="general">General</option>
            <option value="number">Number (1,234.56)</option>
            <option value="currency">Currency ($1,234.56)</option>
            <option value="percent">Percentage (%)</option>
            <option value="scientific">Scientific (E+00)</option>
          </select>
          <button className="sheet-tool-btn" type="button" onClick={() => adjustDecimals(1)} disabled={!hasSelection} title="Increase Decimal Places (.00 ➔ .000)">.00+</button>
          <button className="sheet-tool-btn" type="button" onClick={() => adjustDecimals(-1)} disabled={!hasSelection} title="Decrease Decimal Places (.000 ➔ .00)">.00-</button>
        </div>
        <span className="ribbon-group-label">Number</span>
      </div>

      <div className="sheet-ribbon-group" aria-label="Cells">
        <div className="ribbon-btn-cluster">
          <button className="sheet-tool-btn" type="button" onClick={() => addRow(selected.r)} disabled={dataset.columns.length === 0} title="Insert Row Below">+ Row</button>
          <button className="sheet-tool-btn" type="button" onClick={addColumn} title="Insert Column Right">+ Column</button>
          <button className="sheet-tool-btn" type="button" onClick={() => deleteRow()} disabled={dataset.rows.length === 0} title="Delete Row">Del Row</button>
          <button className="sheet-tool-btn" type="button" onClick={() => deleteColumn()} disabled={dataset.columns.length <= 1} title="Delete Column">Del Col</button>
        </div>
        <span className="ribbon-group-label">Cells</span>
      </div>

      <div className="sheet-ribbon-group" aria-label="Editing">
        <div className="ribbon-btn-cluster">
          <details className="ribbon-dropdown-menu">
            <summary className="sheet-tool-btn ribbon-summary-btn" title="AutoSum">∑ AutoSum ▾</summary>
            <div className="ribbon-dropdown-popover">
              <button type="button" onClick={() => applyAutoSum("SUM")}><strong>∑ Sum</strong><span>Adds the numbers</span></button>
              <button type="button" onClick={() => applyAutoSum("AVERAGE")}><strong>Average</strong><span>Calculates mean</span></button>
              <button type="button" onClick={() => applyAutoSum("COUNT")}><strong>Count Numbers</strong><span>Counts numeric cells</span></button>
              <button type="button" onClick={() => applyAutoSum("MAX")}><strong>Max</strong><span>Finds maximum</span></button>
              <button type="button" onClick={() => applyAutoSum("MIN")}><strong>Min</strong><span>Finds minimum</span></button>
            </div>
          </details>

          <details className="ribbon-dropdown-menu">
            <summary className="sheet-tool-btn ribbon-summary-btn" title="Fill">Fill ▾</summary>
            <div className="ribbon-dropdown-popover">
              <button type="button" onClick={() => fillSelection("down")} disabled={!hasSelection || selectionRange.r1 === selectionRange.r2}>Fill Down</button>
              <button type="button" onClick={() => fillSelection("right")} disabled={!hasSelection || selectionRange.c1 === selectionRange.c2}>Fill Right</button>
            </div>
          </details>

          <details className="ribbon-dropdown-menu">
            <summary className="sheet-tool-btn ribbon-summary-btn" title="Clear">Clear ▾</summary>
            <div className="ribbon-dropdown-popover">
              <button type="button" onClick={() => clearSelection("all")}>Clear All</button>
              <button type="button" onClick={() => clearSelection("formats")}>Clear Formats</button>
              <button type="button" onClick={() => clearSelection("contents")}>Clear Contents</button>
            </div>
          </details>

          <button className="sheet-tool-btn" type="button" onClick={() => sortColumn(selectedColumn, "asc")} disabled={!selectedColumn} title="Sort Ascending A-Z">A-Z</button>
          <button className="sheet-tool-btn" type="button" onClick={() => sortColumn(selectedColumn, "desc")} disabled={!selectedColumn} title="Sort Descending Z-A">Z-A</button>
        </div>
        <span className="ribbon-group-label">Editing</span>
      </div>
    </>
  );
}
