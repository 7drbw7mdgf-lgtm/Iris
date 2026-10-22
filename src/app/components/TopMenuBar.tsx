import { RefObject, Dispatch, SetStateAction } from "react";
import { FriendlyRenderIssue } from "../../types";
import { RendererStatus } from "../../tauri";
import { AppView, WorkspaceTab, GraphState, TabType } from "../types";

export interface TopMenuBarProps {
  openProject: () => void;
  setSaveProjectDialogOpen: (open: boolean) => void;
  undoData: () => void;
  redoData: () => void;
  undoStackLength: number;
  redoStackLength: number;
  clearDatasetAndGraphs: () => void;
  openInputRef: RefObject<HTMLInputElement | null>;
  openFileFromPicker: (file: File) => void;
  activeTab?: WorkspaceTab;
  appView: AppView;
  setAppView: (view: AppView) => void;
  sourceDataTabId?: string | null;
  firstDataTabId?: string | null;
  setActiveTabId: (id: string) => void;
  setRailSheetFilter: (filter: TabType) => void;
  activeGraphId: string;
  activeGraph: GraphState;
  updateGraph: (id: string, update: Partial<GraphState>) => void;
  isPythonLibrary: boolean;
  isRLibrary: boolean;
  isPlotlyLibrary: boolean;
  isAltairLibrary: boolean;
  autoRender: boolean;
  setAutoRender: (auto: boolean) => void;
  styleOverridesCode: boolean;
  setStyleOverridesCode: (overrides: boolean) => void;
  canRenderSelected: boolean;
  renderGgplot: () => void;
  renderPython: () => void;
  renderButtonLabel: string;
  codeFigureLinking: boolean;
  setCodeFigureLinking: Dispatch<SetStateAction<boolean>>;
  setLinkedCodeFeature: (feat: any) => void;
  canExportSelected: boolean;
  openExportDialog: () => void;
  beginDashboardExportSelection: () => void;
  renderError: FriendlyRenderIssue | null;
  openRendererPanel: () => void;
  rStatus: { ok: boolean; text: string };
  rendererInfo: RendererStatus | null;
  rendererError: string;
  rendererBusy: string;
  refreshRendererStatus: () => void;
  runRendererRepair: (which: "python" | "svglite") => void;
  setSettingsModalOpen: (open: boolean) => void;
  theme: string;
  toggleTheme: () => void;
}

export function TopMenuBar(props: TopMenuBarProps) {
  const {
    openProject,
    setSaveProjectDialogOpen,
    undoData,
    redoData,
    undoStackLength,
    redoStackLength,
    clearDatasetAndGraphs,
    openInputRef,
    openFileFromPicker,
    activeTab,
    appView,
    setAppView,
    sourceDataTabId,
    firstDataTabId,
    setActiveTabId,
    setRailSheetFilter,
    activeGraphId,
    activeGraph,
    updateGraph,
    isPythonLibrary,
    isRLibrary,
    isPlotlyLibrary,
    isAltairLibrary,
    autoRender,
    setAutoRender,
    styleOverridesCode,
    setStyleOverridesCode,
    canRenderSelected,
    renderGgplot,
    renderPython,
    renderButtonLabel,
    codeFigureLinking,
    setCodeFigureLinking,
    setLinkedCodeFeature,
    canExportSelected,
    openExportDialog,
    beginDashboardExportSelection,
    renderError,
    openRendererPanel,
    rStatus,
    rendererInfo,
    rendererError,
    rendererBusy,
    refreshRendererStatus,
    runRendererRepair,
    setSettingsModalOpen,
    theme,
    toggleTheme,
  } = props;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand">
          <span className="brand-mark">❀</span>
          <span className="brand-name">Iris R Graphing Studio</span>
        </div>
        <div className="topbar-file-group" aria-label="Project file actions">
          <button className="btn small topbar-file-btn" type="button" onClick={openProject} title="Open an Iris .is project, data table, or script">
            Open
          </button>
          <button className="btn small primary topbar-file-btn" type="button" onClick={() => setSaveProjectDialogOpen(true)} title="Save this workspace as an Iris .is project">
            Save
          </button>
        </div>
        <div className="topbar-history-group" aria-label="Undo and redo">
          <button className="history-btn icon-only" type="button" onClick={undoData} disabled={undoStackLength === 0} aria-label="Undo data edit" title="Undo data edit">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7H5v4" /><path d="M5 11a7 7 0 1 0 2.05-4.95L5 8" /></svg>
          </button>
          <button className="history-btn icon-only" type="button" onClick={redoData} disabled={redoStackLength === 0} aria-label="Redo data edit" title="Redo data edit">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 7h4v4" /><path d="M19 11a7 7 0 1 1-2.05-4.95L19 8" /></svg>
          </button>
        </div>
        <div className="topbar-edit-group" aria-label="Workspace actions">
          <button className="btn" onClick={clearDatasetAndGraphs} title="Clear loaded data and reset all graphs">Clear</button>
        </div>
        <input
          ref={openInputRef as any}
          type="file"
          accept=".is,.iris,.csv,.tsv,.txt,.xls,.xlsx,.xlsm,.xlsb,.py,.R,.r,.Rscript,.rscript"
          className="hidden-file-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) openFileFromPicker(file);
            e.target.value = "";
          }}
        />
      </div>
      <div className="topbar-center">
        <div className="command-tabs" aria-label="Primary workspace mode">
          <button
            type="button"
            className={activeTab?.type === "data" && appView !== "dashboard" ? "active" : ""}
            onClick={() => {
              setAppView("workspace");
              const targetTabId = sourceDataTabId || firstDataTabId;
              if (targetTabId) {
                setActiveTabId(targetTabId);
                setRailSheetFilter("data");
              }
            }}
            title="Spreadsheet data table (⌘1)"
          >
            <span aria-hidden="true">📋</span> Spreadsheet
          </button>
          <button
            type="button"
            className={activeTab?.type === "graph" && !activeGraph.showBottom && appView !== "dashboard" ? "active" : ""}
            onClick={() => {
              setAppView("workspace");
              setActiveTabId(activeGraphId);
              setRailSheetFilter("graph");
              updateGraph(activeGraphId, { showBottom: false, mode: activeGraph.scriptBacked ? activeGraph.mode : "live" });
            }}
            title="Visual graph canvas and shelves (⌘2)"
          >
            <span aria-hidden="true">📊</span> Graph Studio
          </button>
          <button
            type="button"
            className={activeTab?.type === "graph" && activeGraph.showBottom && appView !== "dashboard" ? "active" : ""}
            onClick={() => {
              setAppView("workspace");
              setActiveTabId(activeGraphId);
              setRailSheetFilter("graph");
              updateGraph(activeGraphId, { showBottom: true });
            }}
            title="Python & R code editor (⌘3)"
          >
            <span aria-hidden="true">💻</span> Code
          </button>
          <button
            type="button"
            className={appView === "dashboard" ? "active" : ""}
            onClick={() => setAppView("dashboard")}
            title="Multi-figure composite dashboard (⌘4)"
          >
            <span aria-hidden="true">📑</span> Dashboard
          </button>
        </div>
      </div>
      <div className="topbar-right">
        {(activeGraph.loadedPythonScriptName || activeGraph.loadedRScriptName) && (
          <span className="status-pill pill-code" title={`Code-backed figure: Iris runs the loaded script (${activeGraph.loadedPythonScriptName || activeGraph.loadedRScriptName}) as its source. Visual controls apply broad overrides when possible; reset to generated code to return to a fully visual figure.`}>
            Code-backed
          </span>
        )}
        {(isPythonLibrary || isRLibrary) && (
          <details className="render-menu">
            <summary className="btn render-menu-summary" title="Render settings" aria-label="Render settings">⚙</summary>
            <div className="render-menu-panel" role="menu">
              <label className="render-menu-item">
                <input type="checkbox" checked={autoRender} onChange={(e) => setAutoRender(e.target.checked)} />
                <span><strong>Auto-render</strong><span className="render-menu-hint">Re-render on change, like live Plotly</span></span>
              </label>
              {(activeGraph.scriptBacked || !!activeGraph.loadedPythonScriptName || !!activeGraph.loadedRScriptName) && (
                <label className="render-menu-item">
                  <input type="checkbox" checked={styleOverridesCode} onChange={(e) => setStyleOverridesCode(e.target.checked)} />
                  <span><strong>Style overrides code</strong><span className="render-menu-hint">Apply inspector settings on top of the code</span></span>
                </label>
              )}
            </div>
          </details>
        )}
        {(!isPlotlyLibrary || activeGraph.scriptBacked || !!activeGraph.loadedPythonScriptName || !!activeGraph.loadedRScriptName) && (
          <button
            className="btn"
            onClick={() => (activeGraph.graphLibrary === "ggplot2" ? renderGgplot() : renderPython())}
            disabled={activeTab?.type !== "graph" || !canRenderSelected}
            title={
              isAltairLibrary
                ? "Altair code generation is available. Install altair and vl-convert-python to enable image rendering."
                : undefined
            }
          >
            {renderButtonLabel}
          </button>
        )}
        {activeTab?.type === "graph" && activeGraph.showBottom && (
          <button
            type="button"
            className={`btn code-figure-link-toggle ${codeFigureLinking ? "active" : ""}`}
            onClick={() => {
              setCodeFigureLinking((value) => !value);
              setLinkedCodeFeature(null);
            }}
            aria-pressed={codeFigureLinking}
            title="Highlight matching code and graph features on hover"
          >
            {codeFigureLinking ? "Linked hover" : "Link code ↔ figure"}
          </button>
        )}
        <details className="export-menu">
          <summary className={`btn primary export-menu-summary ${!canExportSelected ? "disabled" : ""}`} title="Export options" aria-label="Export options">
            Export...
          </summary>
          <div className="export-menu-panel" role="menu">
            <button
              type="button"
              className="export-menu-item"
              onClick={(e) => {
                e.currentTarget.closest("details")?.removeAttribute("open");
                void openExportDialog();
              }}
              disabled={!canExportSelected}
            >
              <strong>Export current graph</strong>
              <span>Use the existing export settings and save dialog.</span>
            </button>
            <button
              type="button"
              className="export-menu-item"
              onClick={(e) => {
                e.currentTarget.closest("details")?.removeAttribute("open");
                beginDashboardExportSelection();
                setAppView("dashboard");
              }}
              disabled={appView !== "dashboard"}
            >
              <strong>Select dashboard area</strong>
              <span>Drag a region on the dashboard, then export as PNG or PDF.</span>
            </button>
          </div>
        </details>
        {renderError && !isPlotlyLibrary && (
          <button type="button" className="status-pill pill-error" title={`${renderError.summary} Suggested fix: ${renderError.fix}`} onClick={openRendererPanel}>
            <span className="dot" /> {renderError.kind}
          </button>
        )}
        <details className="renderer-status-menu" onToggle={(e) => { if (e.currentTarget.open) void refreshRendererStatus(); }}>
          <summary className={`status-pill pill-renderer ${rStatus.ok ? "ok" : "bad"}`} title={`${rStatus.text} — click for renderer status`}>
            <span className="dot" /> {rStatus.ok ? `Connected (${rStatus.text.replace(/^R\s*version\s*/i, "R ").split(" ").slice(0, 2).join(" ")})` : "Renderer"}
          </summary>
          <div className="renderer-status-panel">
            {renderError && (
              <div className="renderer-error-banner render-issue-card">
                <strong>{renderError.kind}</strong>
                <span>{renderError.summary}</span>
                <em>Suggested fix: {renderError.fix}</em>
              </div>
            )}
            {rendererError && <div className="renderer-error-banner">{rendererError}</div>}
            <section>
              <strong>R · ggplot2</strong>
              {rendererInfo ? (
                <ul>
                  <li>Rscript: {rendererInfo.r_found ? <code>{rendererInfo.r_path}</code> : <span className="r-status bad">not found</span>}</li>
                  {rendererInfo.r_version && <li>{rendererInfo.r_version}</li>}
                  <li>ggplot2: {rendererInfo.r_ggplot2 ? "installed" : "missing"}</li>
                  <li>svglite: {rendererInfo.r_svglite ? "installed" : "missing"}</li>
                </ul>
              ) : <p className="muted small">{rendererError ? "Unavailable" : "Checking..."}</p>}
              {rendererInfo && !rendererInfo.r_svglite && rendererInfo.r_found && (
                <button className="btn small" disabled={rendererBusy !== ""} onClick={() => runRendererRepair("svglite")}>
                  {rendererBusy === "svglite" ? "Installing..." : "Install svglite"}
                </button>
              )}
            </section>
            <section>
              <strong>Python · plotting env</strong>
              {rendererInfo ? (
                <ul>
                  <li>Environment: {rendererInfo.python_found ? <code>{rendererInfo.python_path}</code> : <span className="r-status bad">not built</span>}</li>
                  {rendererInfo.python_version && <li>Python {rendererInfo.python_version}</li>}
                  <li>Packages: {rendererInfo.python_ready ? "ready" : rendererInfo.python_missing.length ? `missing ${rendererInfo.python_missing.join(", ")}` : "not checked"}</li>
                </ul>
              ) : <p className="muted small">{rendererError ? "Unavailable" : "Checking..."}</p>}
              {rendererInfo && !rendererInfo.python_ready && (
                <button className="btn small" disabled={rendererBusy !== ""} onClick={() => runRendererRepair("python")}>
                  {rendererBusy === "python" ? "Building..." : rendererInfo.python_found ? "Repair Python" : "Build Python"}
                </button>
              )}
            </section>
            <button className="btn small" disabled={rendererBusy !== ""} onClick={() => void refreshRendererStatus()}>Re-check</button>
          </div>
        </details>
        <button
          className="btn icon-only settings-btn"
          type="button"
          onClick={() => setSettingsModalOpen(true)}
          title="Settings & Preferences (⌘,)"
          aria-label="Settings and Preferences"
        >
          ⚙
        </button>
        <button
          className="theme-toggle"
          type="button"
          onClick={toggleTheme}
          title={`Toggle light or dark theme (Current: ${theme})`}
          aria-label="Toggle theme"
        >
          {theme === "light" ? "☾" : "☼"}
        </button>
      </div>
    </header>
  );
}
