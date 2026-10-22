import { useEffect, useMemo, useRef, useState } from "react";
import { Dataset, PlotSpec } from "../types";
import CodeEditor from "./CodeEditor";
import { scanCodeSyntax } from "../codeSyntaxScanner";
import {
  ScriptLanguage,
  PanelLetter,
  detectedPanelLetters,
  panelEditPrompt,
  createChatGptPrompt,
} from "./bottomPanel/promptGenerators";
interface Props {
  spec: PlotSpec;
  dataset: Dataset;
  code: string;
  codeDirty: boolean;
  pythonCode: string;
  pythonCodeDirty: boolean;
  graphLibrary: "plotly" | "ggplot2" | "matplotlib" | "seaborn" | "altair";
  pythonLibrary: "plotly" | "matplotlib" | "seaborn" | "altair";
  rLibraries: string;
  loadedRScriptName: string | null;
  loadedPythonScriptName: string | null;
  onRLibrariesChange: (libraries: string) => void;
  onCodeChange: (code: string) => void;
  onPythonCodeChange: (code: string) => void;
  onLoadRScript: (name: string, code: string) => void;
  onLoadPythonScript: (name: string, code: string) => void;
  onLoadRScriptNative?: () => Promise<boolean>;
  onLoadPythonScriptNative?: () => Promise<boolean>;
  onResetCode: () => void;
  onResetPythonCode: () => void;
  linkedFeature?: string | null;
  onHoverFeature?: (feature: string | null) => void;
  variant?: "bottom" | "full";
}

function extractCleanCode(text: string, language: ScriptLanguage): string {
  const codeBlockMatch = text.match(new RegExp(`\`\`\`(?:${language}|python|r|py)?\\s*([\\s\\S]*?)\`\`\``, "i"));
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }
  return text.trim();
}

function libraryLabel(library: Props["graphLibrary"]): string {
  if (library === "ggplot2") return "ggplot2";
  if (library === "matplotlib") return "Python: matplotlib";
  if (library === "seaborn") return "Python: seaborn";
  if (library === "altair") return "Python: Altair";
  return "Python: Plotly";
}

export default function BottomPanel({
  spec,
  dataset,
  code,
  codeDirty,
  pythonCode,
  pythonCodeDirty,
  graphLibrary,
  pythonLibrary,
  rLibraries,
  loadedRScriptName,
  loadedPythonScriptName,
  onRLibrariesChange,
  onCodeChange,
  onPythonCodeChange,
  onLoadRScript,
  onLoadPythonScript,
  onLoadRScriptNative,
  onLoadPythonScriptNative,
  onResetCode,
  onResetPythonCode,
  linkedFeature = null,
  onHoverFeature,
  variant = "bottom",
}: Props) {
  const activeLanguage: ScriptLanguage = graphLibrary === "ggplot2" ? "r" : "python";
  const [scriptLanguage, setScriptLanguage] = useState<ScriptLanguage>(activeLanguage);
  const scriptInputRef = useRef<HTMLInputElement>(null);
  const detectedPanels = useMemo(() => detectedPanelLetters(pythonCode), [pythonCode]);
  const [panelEditOpen, setPanelEditOpen] = useState(false);
  const [panelEditLetter, setPanelEditLetter] = useState<PanelLetter>("A");
  const [panelEditRequest, setPanelEditRequest] = useState("");
  const [panelEditCopied, setPanelEditCopied] = useState(false);

  const [chatGptOpen, setChatGptOpen] = useState(false);
  const [chatGptRequest, setChatGptRequest] = useState("");
  const [chatGptCopied, setChatGptCopied] = useState(false);
  const [chatGptPasted, setChatGptPasted] = useState(false);

  const copyChatGptPrompt = async (customReq?: string) => {
    const req = customReq !== undefined ? customReq : chatGptRequest;
    const prompt = createChatGptPrompt(scriptLanguage, currentCode, dataset, spec, req);
    await copy(prompt);
    setChatGptCopied(true);
    setTimeout(() => setChatGptCopied(false), 2200);
  };

  const pasteFromChatGpt = async () => {
    try {
      const text = await navigator.clipboard?.readText?.();
      if (!text) return;
      const clean = extractCleanCode(text, scriptLanguage);
      updateCurrentCode(clean);
      setChatGptPasted(true);
      setTimeout(() => setChatGptPasted(false), 2200);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    setScriptLanguage(activeLanguage);
  }, [activeLanguage]);

  useEffect(() => {
    if (detectedPanels.length === 0 || scriptLanguage !== "python") {
      setPanelEditOpen(false);
      return;
    }
    if (!detectedPanels.includes(panelEditLetter)) setPanelEditLetter(detectedPanels[0]);
  }, [detectedPanels, panelEditLetter, scriptLanguage]);

  const copy = (s: string) => navigator.clipboard?.writeText(s);
  const currentCode = scriptLanguage === "r" ? code : pythonCode;
  const currentDirty = scriptLanguage === "r" ? codeDirty : pythonCodeDirty;
  const loadedScriptName = scriptLanguage === "r" ? loadedRScriptName : loadedPythonScriptName;
  const currentLanguageLabel = scriptLanguage === "r" ? "R / ggplot2" : `Python / ${pythonLibrary === "plotly" ? "Plotly" : pythonLibrary === "altair" ? "Altair" : pythonLibrary === "seaborn" ? "seaborn" : "matplotlib"}`;
  const isActiveLanguage = scriptLanguage === activeLanguage;

  const syntaxAnalysis = useMemo(
    () => scanCodeSyntax(currentCode, scriptLanguage, dataset),
    [currentCode, scriptLanguage, dataset]
  );

  const updateCurrentCode = (next: string) => {
    if (scriptLanguage === "r") onCodeChange(next);
    else onPythonCodeChange(next);
  };

  const resetCurrentCode = () => {
    if (scriptLanguage === "r") onResetCode();
    else onResetPythonCode();
  };

  const loadScriptFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const name = file.name.replace(/\.[^.]+$/, "");
      const text = String(reader.result ?? "");
      if (scriptLanguage === "r") onLoadRScript(name, text);
      else onLoadPythonScript(name, text);
    };
    reader.onerror = () => alert(`Failed to read ${scriptLanguage === "r" ? "R" : "Python"} script.`);
    reader.readAsText(file);
  };

  const loadCurrentScript = async () => {
    const handled = scriptLanguage === "r"
      ? await onLoadRScriptNative?.()
      : await onLoadPythonScriptNative?.();
    if (!handled) scriptInputRef.current?.click();
  };

  const copyPanelEditPrompt = async () => {
    await copy(panelEditPrompt(panelEditLetter, panelEditRequest));
    setPanelEditCopied(true);
    window.setTimeout(() => setPanelEditCopied(false), 1600);
  };

  const insertPanelEditPrompt = () => {
    const prompt = panelEditPrompt(panelEditLetter, panelEditRequest)
      .split("\n")
      .map((line) => `# ${line}`)
      .join("\n");
    onPythonCodeChange(`${prompt}\n\n${pythonCode}`);
  };

  return (
    <div className={`bottom-panel ${variant === "full" ? "script-workbench-panel" : ""}`}>
      <div className="script-unified-head">
        <div>
          <strong>Script sheet</strong>
          <span>Write Python or R in one workspace. Iris renders using the selected language/backend.</span>
        </div>
        <div className="script-unified-controls">
          <label>
            <span>Language</span>
            <select value={scriptLanguage} onChange={(e) => setScriptLanguage(e.target.value as ScriptLanguage)}>
              <option value="python">Python</option>
              <option value="r">R</option>
            </select>
          </label>
          <button className="btn small" onClick={loadCurrentScript}>Load script</button>
          {(currentDirty || loadedScriptName) && <button className="btn small" onClick={resetCurrentCode}>Reset generated</button>}
          {scriptLanguage === "python" && detectedPanels.length > 0 && <button className="btn small" onClick={() => setPanelEditOpen((open) => !open)}>Panel edit</button>}
          <button
            className={`btn small ${chatGptOpen ? "primary" : ""}`}
            onClick={() => setChatGptOpen((open) => !open)}
            title="Open ChatGPT Assistant to edit this script"
          >
            🤖 ChatGPT
          </button>
          <button className="btn small" onClick={() => copy(currentCode)}>Copy</button>
        </div>
      </div>

      <input
        ref={scriptInputRef}
        type="file"
        accept={scriptLanguage === "r" ? ".R,.r,.Rscript,.rscript" : ".py,.python"}
        className="hidden-file-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) loadScriptFile(file);
          e.target.value = "";
        }}
      />

      <div className="script-unified-meta">
        <span className={isActiveLanguage ? "active" : ""}>{isActiveLanguage ? "Active render source" : "Available equivalent"}</span>
        <span>{currentLanguageLabel}</span>
        <span>{loadedScriptName ? `Loaded: ${loadedScriptName}` : currentDirty ? "Edited script" : `Generated from ${libraryLabel(graphLibrary)} settings`}</span>
      </div>

      <div className="script-syntax-bar" role="status" aria-label="Script syntax and reproducibility diagnostics">
        <div className="syntax-bar-status">
          {syntaxAnalysis.valid && syntaxAnalysis.contractFulfilled ? (
            <span className="syntax-tag ok" title="All brackets and quotes balanced, Iris contract met">
              ✓ Syntax & Contract Valid
            </span>
          ) : !syntaxAnalysis.valid ? (
            <span className="syntax-tag error" title={syntaxAnalysis.diagnostics.find((d) => d.severity === "error")?.message}>
              ⚠️ Syntax Issue: {syntaxAnalysis.diagnostics.find((d) => d.severity === "error")?.message}
            </span>
          ) : (
            <span className="syntax-tag warn" title={syntaxAnalysis.diagnostics[0]?.message}>
              ⚠️ Contract: {syntaxAnalysis.diagnostics[0]?.message}
            </span>
          )}

          {syntaxAnalysis.reproducibleData.canExtract ? (
            <span
              className="syntax-tag data-reproduced"
              title={`Iris parsed ${syntaxAnalysis.reproducibleData.columns.length} columns (${syntaxAnalysis.reproducibleData.columns.slice(0, 4).join(", ")}${syntaxAnalysis.reproducibleData.columns.length > 4 ? "..." : ""}) and ${syntaxAnalysis.reproducibleData.rowCount} rows from this script.`}
            >
              📊 Data in Script ({syntaxAnalysis.reproducibleData.columns.length} cols, {syntaxAnalysis.reproducibleData.rowCount} rows)
            </span>
          ) : (
            <span className="syntax-tag data-external" title="Script references active table dataset">
              🔗 Linked Table ({dataset.columns.length} cols)
            </span>
          )}
        </div>

        {syntaxAnalysis.diagnostics.some((d) => d.suggestion) && (
          <div className="syntax-bar-suggestions">
            {syntaxAnalysis.diagnostics.filter((d) => d.suggestion).map((diag, i) => (
              <span key={i} className="syntax-suggestion-pill" title={diag.message}>
                💡 {diag.suggestion}
              </span>
            ))}
          </div>
        )}
      </div>

      {scriptLanguage === "r" && (
        <label className="library-row script-library-row">
          <span>Extra R libraries</span>
          <input
            value={rLibraries}
            onChange={(e) => onRLibrariesChange(e.target.value)}
            placeholder="dplyr, ggrepel, ggpubr"
            spellCheck={false}
          />
        </label>
      )}

      {!isActiveLanguage && (
        <div className="code-library-warning">
          The active graphing backend is <strong>{libraryLabel(graphLibrary)}</strong>. Editing this sheet will switch render/export to <strong>{currentLanguageLabel}</strong>.
        </div>
      )}

      {loadedScriptName && (
        <div className="script-loaded-note">
          Loaded {scriptLanguage === "r" ? "R" : "Python"} script: <strong>{loadedScriptName}</strong>. Iris treats this as the source of truth; visual controls apply broad supported overrides where possible.
        </div>
      )}

      {chatGptOpen && (
        <div className="panel-edit-helper chatgpt-assistant-helper" role="region" aria-label="ChatGPT Studio Assistant">
          <div className="panel-edit-helper-head">
            <div className="chatgpt-head-title">
              <strong>🤖 ChatGPT Visualization Studio</strong>
              <span>Edit this {scriptLanguage === "r" ? "R (ggplot2)" : "Python"} script with ChatGPT</span>
            </div>
            <button className="icon-mini-btn" onClick={() => setChatGptOpen(false)} aria-label="Close ChatGPT Assistant">×</button>
          </div>
          <div className="chatgpt-quick-prompts">
            <span className="quick-prompt-label">Quick prompts:</span>
            {[
              "Publication polish (Nature/Science aesthetic)",
              "Add significance brackets & p-values",
              "Refine color palette & high contrast",
              "Rotate & format axis ticks cleanly",
              "Add trendline & 95% confidence interval",
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                className="chatgpt-prompt-chip"
                onClick={() => {
                  setChatGptRequest(preset);
                  void copyChatGptPrompt(preset);
                }}
                title={`Copy prompt with "${preset}"`}
              >
                {preset}
              </button>
            ))}
          </div>
          <div className="panel-edit-controls chatgpt-edit-controls">
            <textarea
              value={chatGptRequest}
              onChange={(e) => setChatGptRequest(e.target.value)}
              placeholder={`Describe how you want ChatGPT to edit this ${scriptLanguage === "r" ? "R" : "Python"} script (e.g. increase font size, change palette to viridis, add log scale)...`}
              spellCheck={false}
            />
            <div className="panel-edit-actions chatgpt-actions">
              <button className="btn small primary" type="button" onClick={() => copyChatGptPrompt()}>
                {chatGptCopied ? "✓ Copied prompt!" : "📋 Copy for ChatGPT"}
              </button>
              <button className="btn small" type="button" onClick={pasteFromChatGpt} title="Paste code from ChatGPT (markdown fences are auto-stripped)">
                {chatGptPasted ? "✓ Pasted clean code!" : "📥 Paste from ChatGPT"}
              </button>
            </div>
          </div>
        </div>
      )}

      {panelEditOpen && scriptLanguage === "python" && detectedPanels.length > 0 && (
        <div className="panel-edit-helper">
          <div className="panel-edit-helper-head">
            <strong>Single-panel edit prompt</strong>
            <span>Detected panels {detectedPanels.join(", ")}</span>
          </div>
          <div className="panel-edit-controls">
            <label>
              <span>Panel</span>
              <select value={panelEditLetter} onChange={(e) => setPanelEditLetter(e.target.value as PanelLetter)}>
                {detectedPanels.map((letter) => <option key={letter} value={letter}>Panel {letter}</option>)}
              </select>
            </label>
            <textarea
              value={panelEditRequest}
              onChange={(e) => setPanelEditRequest(e.target.value)}
              placeholder="Describe the change for this panel only..."
              spellCheck={false}
            />
            <div className="panel-edit-actions">
              <button className="btn small" onClick={copyPanelEditPrompt}>{panelEditCopied ? "Copied" : "Copy prompt"}</button>
              <button className="btn small" onClick={insertPanelEditPrompt}>Insert as script note</button>
            </div>
          </div>
        </div>
      )}

      <CodeEditor value={currentCode} language={scriptLanguage} onChange={updateCurrentCode} linkedFeature={linkedFeature} onHoverFeature={onHoverFeature} />
    </div>
  );
}
