import { ExcelFunctionDef } from "../../excelFormula";
import { CellValue, Selection } from "./types";

interface DataPanelFormulaBarProps {
  selectedRangeAddress: string;
  formulaFocused: boolean;
  editing: Selection | null;
  activeCellValue: CellValue;
  setFormulaDraft: (draft: string) => void;
  setFormulaFocused: (focused: boolean) => void;
  setEditing: (editing: Selection | null) => void;
  focusGrid: () => void;
  applyFormulaValue: (scope?: "cell" | "selection") => void;
  hasSelection: boolean;
  setFxModalOpen: (open: boolean) => void;
  formulaDraft: string;
  selectionSummary: string;
  activeFunctionHint: ExcelFunctionDef | null;
}

export function DataPanelFormulaBar({
  selectedRangeAddress,
  formulaFocused,
  editing,
  activeCellValue,
  setFormulaDraft,
  setFormulaFocused,
  setEditing,
  focusGrid,
  applyFormulaValue,
  hasSelection,
  setFxModalOpen,
  formulaDraft,
  selectionSummary,
  activeFunctionHint,
}: DataPanelFormulaBarProps) {
  return (
    <div className="sheet-formula-bar excel-formula-bar" aria-label="Spreadsheet formula bar">
      <div className="sheet-name-box" title="Name Box (Current Selection)">{selectedRangeAddress}</div>
      <div className="formula-bar-actions">
        <button
          type="button"
          className="formula-bar-btn cancel-btn"
          title="Cancel (Esc)"
          disabled={!formulaFocused && !editing}
          onClick={() => {
            setFormulaDraft(activeCellValue == null ? "" : String(activeCellValue));
            setFormulaFocused(false);
            setEditing(null);
            focusGrid();
          }}
        >
          ✕
        </button>
        <button
          type="button"
          className="formula-bar-btn enter-btn"
          title="Enter (Commit Formula)"
          onClick={() => applyFormulaValue("cell")}
          disabled={!hasSelection}
        >
          ✓
        </button>
        <button
          type="button"
          className="formula-bar-btn fx-btn"
          title="Insert Function Dialog"
          onClick={() => setFxModalOpen(true)}
        >
          fx
        </button>
      </div>
      <div className="sheet-formula-input">
        <input
          value={formulaDraft}
          onFocus={() => setFormulaFocused(true)}
          onChange={(e) => setFormulaDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyFormulaValue(e.metaKey || e.ctrlKey ? "selection" : "cell");
            } else if (e.key === "Escape") {
              e.preventDefault();
              setFormulaDraft(activeCellValue == null ? "" : String(activeCellValue));
              setFormulaFocused(false);
              focusGrid();
            }
          }}
          placeholder="Enter value or formula, e.g. =SUM(A1:A10), =AVERAGE(B1:B10), =IF(A1>50, &quot;Pass&quot;, &quot;Fail&quot;)"
        />
      </div>
      <div className="sheet-selection-summary" title="Selection summary">{selectionSummary}</div>

      {/* Floating Live Function Syntax Tooltip */}
      {activeFunctionHint && (
        <div className="sheet-function-hint" role="tooltip">
          <div className="hint-head">
            <span className="hint-fx">fx</span>
            <span className="hint-syntax">{activeFunctionHint.syntax}</span>
          </div>
          <div className="hint-desc">{activeFunctionHint.description}</div>
        </div>
      )}
    </div>
  );
}
