import { Dataset } from "../../types";
import { Selection, SortState } from "./types";

interface RibbonOtherTabsProps {
  activeRibbonTab: "insert" | "formulas" | "data";
  handleQuickPlot: () => void;
  addRow: (after?: number) => void;
  insertRowAbove: (index?: number) => void;
  addColumn: () => void;
  selected: Selection;
  dataset: Dataset;
  setFxModalOpen: (open: boolean) => void;
  applyAutoSum: (funcName: "SUM" | "AVERAGE" | "COUNT" | "MAX" | "MIN") => void;
  insertFunctionTemplate: (fn: string) => void;
  applyFormulaValue: (scope?: "cell" | "selection") => void;
  sortColumn: (col: string, direction: "asc" | "desc") => void;
  selectedColumn: string;
  sort: SortState | null;
  setSort: (s: SortState | null) => void;
  fillMissing: (mode: "blank" | "zero" | "na" | "mean") => void;
  hasSelection: boolean;
  setColumnType: (col: string, type: Dataset["types"][string]) => void;
  autoFitColumn: (col: string) => void;
}

export function RibbonOtherTabs({
  activeRibbonTab,
  handleQuickPlot,
  addRow,
  insertRowAbove,
  addColumn,
  selected,
  dataset,
  setFxModalOpen,
  applyAutoSum,
  insertFunctionTemplate,
  applyFormulaValue,
  sortColumn,
  selectedColumn,
  sort,
  setSort,
  fillMissing,
  hasSelection,
  setColumnType,
  autoFitColumn,
}: RibbonOtherTabsProps) {
  return (
    <>
      {activeRibbonTab === "insert" && (
        <>
          <div className="sheet-ribbon-group" aria-label="Charts">
            <div className="ribbon-btn-cluster">
              <button className="sheet-tool-btn primary-excel-btn" type="button" onClick={() => handleQuickPlot()} title="Create a figure from selection">
                📊 Quick Plot Figure
              </button>
            </div>
            <span className="ribbon-group-label">Charts</span>
          </div>

          <div className="sheet-ribbon-group" aria-label="Tables">
            <div className="ribbon-btn-cluster">
              <button className="sheet-tool-btn" type="button" onClick={() => addRow(selected.r)} disabled={dataset.columns.length === 0}>+ Row Below</button>
              <button className="sheet-tool-btn" type="button" onClick={() => insertRowAbove(selected.r)} disabled={dataset.columns.length === 0}>+ Row Above</button>
              <button className="sheet-tool-btn" type="button" onClick={addColumn}>+ Column</button>
            </div>
            <span className="ribbon-group-label">Tables</span>
          </div>

          <div className="sheet-ribbon-group" aria-label="Function">
            <div className="ribbon-btn-cluster">
              <button className="sheet-tool-btn fx-dialog-btn" type="button" onClick={() => setFxModalOpen(true)} title="Insert Function">
                <strong>fx</strong> Insert Function
              </button>
            </div>
            <span className="ribbon-group-label">Function</span>
          </div>
        </>
      )}

      {activeRibbonTab === "formulas" && (
        <>
          <div className="sheet-ribbon-group" aria-label="Function Library">
            <div className="ribbon-btn-cluster">
              <button className="sheet-tool-btn fx-dialog-btn" type="button" onClick={() => setFxModalOpen(true)} title="Browse all Excel functions">
                <strong>fx</strong> Insert Function
              </button>
              <details className="ribbon-dropdown-menu">
                <summary className="sheet-tool-btn ribbon-summary-btn">∑ AutoSum ▾</summary>
                <div className="ribbon-dropdown-popover">
                  <button type="button" onClick={() => applyAutoSum("SUM")}>SUM</button>
                  <button type="button" onClick={() => applyAutoSum("AVERAGE")}>AVERAGE</button>
                  <button type="button" onClick={() => applyAutoSum("COUNT")}>COUNT</button>
                  <button type="button" onClick={() => applyAutoSum("MAX")}>MAX</button>
                  <button type="button" onClick={() => applyAutoSum("MIN")}>MIN</button>
                </div>
              </details>

              <details className="ribbon-dropdown-menu">
                <summary className="sheet-tool-btn ribbon-summary-btn">📐 Math & Trig ▾</summary>
                <div className="ribbon-dropdown-popover">
                  {["SUM", "PRODUCT", "ROUND", "ROUNDUP", "ROUNDDOWN", "ABS", "SQRT", "POWER", "MOD", "INT", "CEILING", "FLOOR"].map((fn) => (
                    <button key={fn} type="button" onClick={() => insertFunctionTemplate(fn)}>{fn}</button>
                  ))}
                </div>
              </details>

              <details className="ribbon-dropdown-menu">
                <summary className="sheet-tool-btn ribbon-summary-btn">📊 Statistical ▾</summary>
                <div className="ribbon-dropdown-popover">
                  {["AVERAGE", "MEDIAN", "MIN", "MAX", "COUNT", "COUNTA", "STDEV", "VAR", "MODE", "LARGE", "SMALL", "PERCENTILE"].map((fn) => (
                    <button key={fn} type="button" onClick={() => insertFunctionTemplate(fn)}>{fn}</button>
                  ))}
                </div>
              </details>

              <details className="ribbon-dropdown-menu">
                <summary className="sheet-tool-btn ribbon-summary-btn">❓ Logical ▾</summary>
                <div className="ribbon-dropdown-popover">
                  {["IF", "IFS", "AND", "OR", "NOT", "IFERROR", "IFNA", "COUNTIF", "SUMIF", "AVERAGEIF"].map((fn) => (
                    <button key={fn} type="button" onClick={() => insertFunctionTemplate(fn)}>{fn}</button>
                  ))}
                </div>
              </details>

              <details className="ribbon-dropdown-menu">
                <summary className="sheet-tool-btn ribbon-summary-btn">🔤 Text ▾</summary>
                <div className="ribbon-dropdown-popover">
                  {["CONCAT", "LEFT", "RIGHT", "MID", "UPPER", "LOWER", "PROPER", "TRIM", "LEN", "SUBSTITUTE", "EXACT"].map((fn) => (
                    <button key={fn} type="button" onClick={() => insertFunctionTemplate(fn)}>{fn}</button>
                  ))}
                </div>
              </details>

              <details className="ribbon-dropdown-menu">
                <summary className="sheet-tool-btn ribbon-summary-btn">🔍 Lookup ▾</summary>
                <div className="ribbon-dropdown-popover">
                  {["VLOOKUP", "INDEX", "MATCH", "CHOOSE"].map((fn) => (
                    <button key={fn} type="button" onClick={() => insertFunctionTemplate(fn)}>{fn}</button>
                  ))}
                </div>
              </details>

              <details className="ribbon-dropdown-menu">
                <summary className="sheet-tool-btn ribbon-summary-btn">📅 Date & Time ▾</summary>
                <div className="ribbon-dropdown-popover">
                  {["TODAY", "NOW", "YEAR", "MONTH", "DAY"].map((fn) => (
                    <button key={fn} type="button" onClick={() => insertFunctionTemplate(fn)}>{fn}</button>
                  ))}
                </div>
              </details>
            </div>
            <span className="ribbon-group-label">Function Library</span>
          </div>

          <div className="sheet-ribbon-group" aria-label="Calculation">
            <div className="ribbon-btn-cluster">
              <button className="sheet-tool-btn" type="button" onClick={() => applyFormulaValue("cell")} title="Recalculate formulas">
                🔄 Recalculate
              </button>
            </div>
            <span className="ribbon-group-label">Calculation</span>
          </div>
        </>
      )}

      {activeRibbonTab === "data" && (
        <>
          <div className="sheet-ribbon-group" aria-label="Sort & Filter">
            <div className="ribbon-btn-cluster">
              <button className="sheet-tool-btn" type="button" onClick={() => sortColumn(selectedColumn, "asc")} disabled={!selectedColumn} title="Sort Ascending A-Z">Sort A to Z</button>
              <button className="sheet-tool-btn" type="button" onClick={() => sortColumn(selectedColumn, "desc")} disabled={!selectedColumn} title="Sort Descending Z-A">Sort Z to A</button>
              {sort && <button className="sheet-tool-btn" type="button" onClick={() => setSort(null)} title="Clear Sort">Clear Sort</button>}
            </div>
            <span className="ribbon-group-label">Sort & Filter</span>
          </div>

          <div className="sheet-ribbon-group" aria-label="Data Tools">
            <div className="ribbon-btn-cluster">
              <select
                className="sheet-tool-select"
                value=""
                onChange={(e) => {
                  const mode = e.target.value as "blank" | "zero" | "na" | "mean";
                  if (mode) fillMissing(mode);
                  e.currentTarget.value = "";
                }}
                disabled={!hasSelection}
                title="Missing-value tools"
              >
                <option value="">Missing Values...</option>
                <option value="zero">Fill with 0</option>
                <option value="mean">Fill with Column Mean</option>
                <option value="na">Fill with NA</option>
                <option value="blank">Set Blank</option>
              </select>

              {selectedColumn && (
                <select
                  className="sheet-tool-select"
                  value={dataset.types[selectedColumn] ?? "categorical"}
                  onChange={(e) => setColumnType(selectedColumn, e.target.value as Dataset["types"][string])}
                  title="Column data type"
                >
                  <option value="numeric">Type: Numeric</option>
                  <option value="categorical">Type: Categorical</option>
                </select>
              )}

              <button className="sheet-tool-btn" type="button" onClick={() => autoFitColumn(selectedColumn)} disabled={!selectedColumn} title="Auto-fit column width to content">Auto-fit Width</button>
            </div>
            <span className="ribbon-group-label">Data Tools</span>
          </div>
        </>
      )}
    </>
  );
}
