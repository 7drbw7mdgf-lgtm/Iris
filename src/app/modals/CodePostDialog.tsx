import React from "react";
import { CodePostDialogState, CLOSED_CODE_POST_DIALOG } from "../types";

export interface CodePostDialogProps {
  dialog: CodePostDialogState;
  setDialog: React.Dispatch<React.SetStateAction<CodePostDialogState>>;
  onCreateGraph: () => void;
  onClose?: () => void;
}

export function CodePostDialog({
  dialog,
  setDialog,
  onCreateGraph,
  onClose = () => setDialog(CLOSED_CODE_POST_DIALOG),
}: CodePostDialogProps) {
  if (!dialog.open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Create graph from code">
      <div className="export-preview-modal code-post-modal">
        <div className="export-preview-head">
          <div>
            <div className="view-eyebrow">Code To Graph</div>
            <h2>Create graph from posted code</h2>
            <p>Paste R ggplot2 or Python plotting code. Iris makes a fast live preview first; backend render is optional.</p>
          </div>
          <button className="icon-mini-btn" onClick={onClose} aria-label="Close code graph dialog">
            ×
          </button>
        </div>
        <div className="code-post-form">
          <div className="dual">
            <label className="tk-field">
              <span>Graph title</span>
              <input value={dialog.title} onChange={(e) => setDialog((d) => ({ ...d, title: e.target.value }))} />
            </label>
            <label className="tk-field">
              <span>Code type</span>
              <select
                value={dialog.language}
                onChange={(e) => setDialog((d) => ({ ...d, language: e.target.value as "r" | "python", error: "" }))}
              >
                <option value="r">R / ggplot2</option>
                <option value="python">Python</option>
              </select>
            </label>
          </div>
          <label className="code-post-render-toggle">
            <input
              type="checkbox"
              checked={dialog.renderNow}
              onChange={(e) => setDialog((d) => ({ ...d, renderNow: e.target.checked }))}
            />
            Also run the slower R/Python renderer now
          </label>
          <textarea
            className="code code-post-textarea"
            value={dialog.code}
            onChange={(e) => {
              const code = e.target.value;
              const looksPython = /\b(import|from)\s+\w+|px\.|sns\.|plt\./i.test(code);
              const looksR = /\bggplot\s*\(|geom_|library\s*\(/i.test(code);
              setDialog((d) => ({
                ...d,
                code,
                language: looksPython && !looksR ? "python" : looksR ? "r" : d.language,
                error: "",
              }));
            }}
            placeholder={
              dialog.language === "r"
                ? "library(ggplot2)\n# create a plot object named p, or print a ggplot\np <- ggplot(df, aes(Sepal.Length, Sepal.Width)) + geom_point()"
                : "import matplotlib.pyplot as plt\n# create fig/ax or a plotly figure named fig"
            }
            spellCheck={false}
          />
          {dialog.error && <div className="export-error">{dialog.error}</div>}
          <div className="export-preview-actions">
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
            <button className="btn primary" disabled={dialog.busy} onClick={onCreateGraph}>
              {dialog.busy ? "Creating..." : "Create Graph"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
