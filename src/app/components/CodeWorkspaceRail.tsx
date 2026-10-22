import React from "react";
import { Dataset, FriendlyRenderIssue } from "../../types";
import { RendererStatus } from "../../tauri";
import { GraphState } from "../types";
import { graphLibraryLabel } from "../graphMetaUtils";

export interface CodeWorkspaceRailProps {
  activeGraph: GraphState;
  activeGraphId: string;
  activeGraphDataset: Dataset;
  rendererInfo: RendererStatus | null;
  renderError: FriendlyRenderIssue | null;
  rendering: boolean;
  canRenderSelected: boolean;
  renderButtonLabel: string;
  activeGraphIsCompositeScript: boolean;
  renderGraphPreview: (id: string, compact: boolean) => React.ReactNode;
  renderGgplot: () => void;
  renderPython: () => void;
  splitActiveCompositeScript: () => void;
  refreshRendererStatus: () => void;
  updateGraph: (id: string, update: Partial<GraphState>) => void;
  activeTabType?: string;
}

export function CodeWorkspaceRail(props: CodeWorkspaceRailProps) {
  const {
    activeGraph,
    activeGraphId,
    activeGraphDataset,
    rendererInfo,
    renderError,
    rendering,
    canRenderSelected,
    renderButtonLabel,
    activeGraphIsCompositeScript,
    renderGraphPreview,
    renderGgplot,
    renderPython,
    splitActiveCompositeScript,
    refreshRendererStatus,
    updateGraph,
    activeTabType,
  } = props;

  const sourceName =
    activeGraph.loadedPythonScriptName ||
    activeGraph.loadedRScriptName ||
    (activeGraph.scriptBacked ? "Edited script" : "Generated from visual settings");
  const backendName = graphLibraryLabel(activeGraph.graphLibrary);
  const pythonReady = rendererInfo ? rendererInfo.python_found && rendererInfo.python_ready : null;
  const rReady = rendererInfo ? rendererInfo.r_found && rendererInfo.r_ggplot2 : null;
  const backendReady = activeGraph.graphLibrary === "ggplot2" ? rReady : pythonReady;
  const dependencyText =
    backendReady === null
      ? "Not checked"
      : backendReady
      ? "Ready"
      : activeGraph.graphLibrary === "ggplot2"
      ? "R renderer needs attention"
      : "Python renderer needs attention";

  return (
    <div className="code-preview-rail">
      <div className="code-preview-rail-header">
        <div>
          <span className="view-eyebrow">Script workspace</span>
          <strong>Render result</strong>
        </div>
        <span>{backendName}</span>
      </div>
      <div className="code-preview-rail-body">{renderGraphPreview(activeGraphId, true)}</div>
      <div className="code-workspace-meta">
        <section>
          <span>Source</span>
          <strong>{sourceName}</strong>
          <em>
            {activeGraphDataset.name || "No dataset"} · {activeGraphDataset.rows.length} rows ·{" "}
            {activeGraphDataset.columns.length} columns
          </em>
        </section>
        <section>
          <span>Backend</span>
          <strong>{backendName}</strong>
          <em>{dependencyText}</em>
        </section>
        <section>
          <span>Editability</span>
          <strong>
            {activeGraphIsCompositeScript
              ? "Composite figure"
              : activeGraph.scriptBacked
              ? "Code-backed figure"
              : "Visual-sync figure"}
          </strong>
          <em>
            {activeGraphIsCompositeScript
              ? "Split in Live Preview to move panels."
              : activeGraph.scriptBacked
              ? "Inspector applies broad supported overrides."
              : "Controls and code can stay synchronized."}
          </em>
        </section>
      </div>
      {renderError && (
        <div className="render-issue-card code-workspace-error">
          <strong>{renderError.kind}</strong>
          <span>{renderError.summary}</span>
          <em>Fix: {renderError.fix}</em>
          <details>
            <summary>Technical details</summary>
            <pre>{renderError.raw}</pre>
          </details>
        </div>
      )}
      <div className="code-preview-rail-actions">
        <button
          className="btn small primary"
          type="button"
          onClick={() => (activeGraph.graphLibrary === "ggplot2" ? renderGgplot() : renderPython())}
          disabled={activeTabType !== "graph" || !canRenderSelected}
        >
          {renderButtonLabel}
        </button>
        {activeGraphIsCompositeScript && (
          <button className="btn small" type="button" onClick={splitActiveCompositeScript} disabled={rendering}>
            Split in Live Preview
          </button>
        )}
        <button className="btn small" type="button" onClick={() => void refreshRendererStatus()}>
          Check dependencies
        </button>
        <button
          className="btn small"
          type="button"
          onClick={() =>
            updateGraph(activeGraphId, { showBottom: false, mode: activeGraph.scriptBacked ? activeGraph.mode : "live" })
          }
        >
          Open Live Preview
        </button>
      </div>
    </div>
  );
}
