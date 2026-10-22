import React from "react";
import { Dataset, PlotSpec } from "../../types";
import { WorkspaceTab, GraphState, LiveSplitPanel, AppView, TabType } from "../types";
import Shelves from "../../components/Shelves";
import { graphTypeLabel } from "../graphMetaUtils";
import { dataTabDatasetName } from "../graphStateUtils";

export interface GraphStudioViewProps {
  activeGraphId: string;
  workspaceTabs: WorkspaceTab[];
  activeGraph: GraphState;
  activeGraphDataset: Dataset;
  renameActiveWorkspace: (title: string) => void;
  sourceDataTabId: string;
  setGraphDataSource: (graphId: string, tabId: string) => void;
  dataTabs: WorkspaceTab[];
  dataStates: Record<string, Dataset>;
  dataset: Dataset;
  setActiveTabId: (id: string) => void;
  setAppView: (view: AppView) => void;
  setRailSheetFilter: (filter: TabType) => void;
  patch: (p: Partial<PlotSpec>) => void;
  activeGraphIsCompositeScript: boolean;
  splitActiveCompositeScript: () => void;
  activeLiveSplitPanels: LiveSplitPanel[];
  clearLiveSplitPanels: (id: string) => void;
  convertActiveScriptToVisualGraph: () => void;
  canConvertActiveScriptToVisual: boolean;
  renderLiveSplitPreview: (id: string, panels: LiveSplitPanel[]) => React.ReactNode;
  renderGraphPreview: (id: string) => React.ReactNode;
}

export function GraphStudioView(props: GraphStudioViewProps) {
  const {
    activeGraphId,
    workspaceTabs,
    activeGraph,
    activeGraphDataset,
    renameActiveWorkspace,
    sourceDataTabId,
    setGraphDataSource,
    dataTabs,
    dataStates,
    dataset,
    setActiveTabId,
    setAppView,
    setRailSheetFilter,
    patch,
    activeGraphIsCompositeScript,
    splitActiveCompositeScript,
    activeLiveSplitPanels,
    clearLiveSplitPanels,
    convertActiveScriptToVisualGraph,
    canConvertActiveScriptToVisual,
    renderLiveSplitPreview,
    renderGraphPreview,
  } = props;

  return (
    <div className="graph-workspace">
      <div className="graph-title-row">
        <div>
          <div className="view-eyebrow">Visual Figure Studio</div>
          <input
            className="workspace-title-input"
            value={workspaceTabs.find((tab) => tab.id === activeGraphId)?.title || "Graph"}
            onChange={(e) => renameActiveWorkspace(e.target.value)}
            aria-label="Graph sheet name"
          />
          <div className="graph-meta-line">
            <span className="graph-type-badge">{graphTypeLabel(activeGraph.spec.graphType)}</span>
            <strong>{activeGraphDataset.name || "Untitled Dataset"}</strong>
            <span>
              {activeGraphDataset.rows.length} rows · {activeGraphDataset.columns.length} cols
            </span>
          </div>
        </div>
        <div className="graph-title-actions">
          <div className="graph-data-bridge-card">
            <label className="graph-source-select">
              <span>Data input</span>
              <select value={sourceDataTabId} onChange={(e) => setGraphDataSource(activeGraphId, e.target.value)}>
                {dataTabs.map((tab) => {
                  const ds = dataStates[tab.id] ?? dataset;
                  return (
                    <option key={tab.id} value={tab.id}>
                      {dataTabDatasetName(tab, ds)}
                    </option>
                  );
                })}
              </select>
            </label>
            <div className="graph-bridge-shelves">
              {activeGraph.spec.xVar && (
                <span className="bridge-shelf-pill">
                  X: <b>{activeGraph.spec.xVar}</b>
                </span>
              )}
              {activeGraph.spec.yVar && (
                <span className="bridge-shelf-pill">
                  Y: <b>{activeGraph.spec.yVar}</b>
                </span>
              )}
              {activeGraph.spec.colorVar && (
                <span className="bridge-shelf-pill">
                  Color: <b>{activeGraph.spec.colorVar}</b>
                </span>
              )}
              {activeGraph.spec.groupVar && !activeGraph.spec.colorVar && (
                <span className="bridge-shelf-pill">
                  Group: <b>{activeGraph.spec.groupVar}</b>
                </span>
              )}
            </div>
            <button
              className="btn small primary graph-bridge-jump-btn"
              type="button"
              onClick={() => {
                setActiveTabId(sourceDataTabId);
                setAppView("workspace");
                setRailSheetFilter("data");
              }}
              title="Open spreadsheet powering this figure (⌘1 or ⌘J)"
            >
              📋 View in Spreadsheet ➔
            </button>
          </div>
        </div>
      </div>
      <Shelves spec={activeGraph.spec} patch={patch} dataset={activeGraphDataset} />
      {activeGraphIsCompositeScript && (
        <div className="script-composite-note" role="status">
          <div>
            <strong>Composite script render</strong>
            <span>
              This script builds several subplots inside one figure. Split it in Live Preview to move and resize each
              panel while keeping the original axis ticks, labels, and titles.
            </span>
          </div>
          <div className="script-composite-actions">
            <button className="btn small primary" type="button" onClick={splitActiveCompositeScript}>
              Split in Live Preview
            </button>
            {activeLiveSplitPanels.length > 0 && (
              <button className="btn small" type="button" onClick={() => clearLiveSplitPanels(activeGraphId)}>
                Show original
              </button>
            )}
            <button
              className="btn small"
              type="button"
              onClick={convertActiveScriptToVisualGraph}
              disabled={!canConvertActiveScriptToVisual}
            >
              Use visual controls
            </button>
          </div>
        </div>
      )}
      {activeLiveSplitPanels.length > 0
        ? renderLiveSplitPreview(activeGraphId, activeLiveSplitPanels)
        : renderGraphPreview(activeGraphId)}
    </div>
  );
}
