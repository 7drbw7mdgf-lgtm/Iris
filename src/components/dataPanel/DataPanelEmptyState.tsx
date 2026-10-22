import { Selection } from "./types";

interface DataPanelEmptyStateProps {
  startMode: "choose" | "code";
  setStartMode: (mode: "choose" | "code") => void;
  createStarterTable: () => void;
  pasteFromClipboard: (transpose?: boolean, start?: Selection) => void;
  codeText: string;
  setCodeText: (text: string) => void;
  codeError: string;
  setCodeError: (error: string) => void;
  onCreateGraphFromCode?: (code: string) => Promise<void> | void;
  applyCodeData: () => void;
}

export function DataPanelEmptyState({
  startMode,
  setStartMode,
  createStarterTable,
  pasteFromClipboard,
  codeText,
  setCodeText,
  codeError,
  setCodeError,
  onCreateGraphFromCode,
  applyCodeData,
}: DataPanelEmptyStateProps) {
  return (
    <div className="data-start-panel">
      {startMode === "choose" ? (
        <>
          <div className="data-start-copy">
            <strong>Start a data table</strong>
            <span>Create a blank spreadsheet or paste code that contains tabular data. Use Open in the top bar, or drop a file here, to import CSV, TSV, TXT, or Excel data.</span>
          </div>
          <div className="data-start-actions">
            <button className="data-start-card" type="button" onClick={createStarterTable}>
              <strong>Create table</strong>
              <span>Begin with editable column headings and empty rows.</span>
            </button>
            <button className="data-start-card" type="button" onClick={() => pasteFromClipboard(false, { r: 0, c: 0 })}>
              <strong>Paste table</strong>
              <span>Paste CSV, TSV, or copied spreadsheet cells into a new sheet.</span>
            </button>
            <button className="data-start-card" type="button" onClick={() => setStartMode("code")}>
              <strong>Start from code</strong>
              <span>Extract data from Python/R code into this sheet.</span>
            </button>
          </div>
        </>
      ) : (
        <div className="data-code-import">
          <div className="data-start-copy">
            <strong>Paste code with data</strong>
            <span>Render the script directly as a graph, or extract its data into this editable table first. Iris can read embedded CSV strings, compressed base64 CSV, Python DataFrames, R data.frames, and row dictionaries.</span>
          </div>
          <textarea
            value={codeText}
            onChange={(e) => {
              setCodeText(e.target.value);
              setCodeError("");
            }}
            spellCheck={false}
            placeholder={'Example:\nimport pandas as pd\ndf = pd.DataFrame({"Dose": [0, 1, 2], "Response": [4.2, 5.1, 6.8], "Group": ["A", "A", "B"]})'}
          />
          {codeError && <div className="data-code-error">{codeError}</div>}
          <div className="data-code-actions">
            <button className="btn small" type="button" onClick={() => setStartMode("choose")}>Back</button>
            <button className="btn small" type="button" onClick={() => onCreateGraphFromCode?.(codeText)} disabled={!codeText.trim() || !onCreateGraphFromCode}>Render graph from code</button>
            <button className="btn small primary" type="button" onClick={applyCodeData} disabled={!codeText.trim()}>Parse data into table</button>
          </div>
        </div>
      )}
    </div>
  );
}
