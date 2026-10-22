import React from "react";
import { PythonArtist } from "../../tauri";
import { LiveSplitPanel } from "../types";

export interface LiveSplitInspectorProps {
  activeLiveSplitPanels: LiveSplitPanel[];
  selectedLiveSplitPanelId: string | null;
  activeGraphId: string;
  rendering: boolean;
  pythonArtists: Record<string, PythonArtist[]>;
  renderArtistControls: (artists: PythonArtist[], embedded?: boolean) => React.ReactNode;
  updateLiveSplitPanel: (graphId: string, panelId: string, patch: Partial<LiveSplitPanel>) => void;
  removeLiveSplitPanel: (graphId: string, panelId: string) => void;
  clearLiveSplitPanels: (graphId: string) => void;
  applyLiveSplitGraphDetailEdits: () => void;
  splitActiveCompositeScript: () => void;
}

export function LiveSplitInspector({
  activeLiveSplitPanels,
  selectedLiveSplitPanelId,
  activeGraphId,
  rendering,
  pythonArtists,
  renderArtistControls,
  updateLiveSplitPanel,
  removeLiveSplitPanel,
  clearLiveSplitPanels,
  applyLiveSplitGraphDetailEdits,
  splitActiveCompositeScript,
}: LiveSplitInspectorProps) {
  const selectedPanel =
    activeLiveSplitPanels.find((panel) => panel.id === selectedLiveSplitPanelId) ?? activeLiveSplitPanels[0];
  if (!selectedPanel) return null;
  const patchPanel = (patch: Partial<LiveSplitPanel>) => updateLiveSplitPanel(activeGraphId, selectedPanel.id, patch);

  return (
    <div className="inspector split-panel-inspector">
      <div className="inspector-toolbar">
        <strong>Split Panel</strong>
        <span>{activeLiveSplitPanels.length} panels</span>
      </div>
      <div className="split-panel-thumb">
        <img src={`data:image/png;base64,${selectedPanel.data}`} alt={selectedPanel.title} draggable={false} />
      </div>
      <div className="section open">
        <div className="section-head">
          <span className="section-toggle static">
            <span className="chev">▾</span> Panel layout
          </span>
        </div>
        <div className="section-body">
          <label className="ctl-row">
            <span className="ctl-label">Panel name</span>
            <span className="ctl-input">
              <input value={selectedPanel.title} onChange={(e) => patchPanel({ title: e.target.value })} />
            </span>
          </label>
          <label className="ctl-row">
            <span className="ctl-label">X position</span>
            <span className="ctl-input">
              <input type="number" value={selectedPanel.x} onChange={(e) => patchPanel({ x: Number(e.target.value) })} />
            </span>
          </label>
          <label className="ctl-row">
            <span className="ctl-label">Y position</span>
            <span className="ctl-input">
              <input type="number" value={selectedPanel.y} onChange={(e) => patchPanel({ y: Number(e.target.value) })} />
            </span>
          </label>
          <label className="ctl-row">
            <span className="ctl-label">Width</span>
            <span className="ctl-input">
              <input type="number" value={selectedPanel.w} onChange={(e) => patchPanel({ w: Number(e.target.value) })} />
            </span>
          </label>
          <label className="ctl-row">
            <span className="ctl-label">Height</span>
            <span className="ctl-input">
              <input type="number" value={selectedPanel.h} onChange={(e) => patchPanel({ h: Number(e.target.value) })} />
            </span>
          </label>
        </div>
      </div>
      <div className="section open">
        <div className="section-head">
          <span className="section-toggle static">
            <span className="chev">▾</span> Graph details
          </span>
        </div>
        <div className="section-body">
          <label className="ctl-row">
            <span className="ctl-label">Graph title</span>
            <span className="ctl-input">
              <input
                value={selectedPanel.graphTitle}
                onChange={(e) => patchPanel({ graphTitle: e.target.value })}
                placeholder="Panel title"
              />
            </span>
          </label>
          <label className="ctl-row">
            <span className="ctl-label">X label</span>
            <span className="ctl-input">
              <input
                value={selectedPanel.xLabel}
                onChange={(e) => patchPanel({ xLabel: e.target.value })}
                placeholder="X axis label"
              />
            </span>
          </label>
          <label className="ctl-row">
            <span className="ctl-label">Y label</span>
            <span className="ctl-input">
              <input
                value={selectedPanel.yLabel}
                onChange={(e) => patchPanel({ yLabel: e.target.value })}
                placeholder="Y axis label"
              />
            </span>
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={selectedPanel.hideTitle}
              onChange={(e) => patchPanel({ hideTitle: e.target.checked })}
            />
            <span>Hide title</span>
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={selectedPanel.hideXLabel}
              onChange={(e) => patchPanel({ hideXLabel: e.target.checked })}
            />
            <span>Hide X label</span>
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={selectedPanel.hideYLabel}
              onChange={(e) => patchPanel({ hideYLabel: e.target.checked })}
            />
            <span>Hide Y label</span>
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={selectedPanel.hideLegend}
              onChange={(e) => patchPanel({ hideLegend: e.target.checked })}
            />
            <span>Hide legend in this panel</span>
          </label>
          <label className="ctl-row">
            <span className="ctl-label">X scale</span>
            <span className="ctl-input">
              <select
                value={selectedPanel.xScale}
                onChange={(e) => patchPanel({ xScale: e.target.value as LiveSplitPanel["xScale"] })}
              >
                <option value="linear">Linear</option>
                <option value="log">Log</option>
              </select>
            </span>
          </label>
          <label className="ctl-row">
            <span className="ctl-label">Y scale</span>
            <span className="ctl-input">
              <select
                value={selectedPanel.yScale}
                onChange={(e) => patchPanel({ yScale: e.target.value as LiveSplitPanel["yScale"] })}
              >
                <option value="linear">Linear</option>
                <option value="log">Log</option>
              </select>
            </span>
          </label>
          <label className="ctl-row">
            <span className="ctl-label">Trace colour</span>
            <span className="ctl-input split-color-input">
              <input
                type="color"
                value={selectedPanel.traceColor || "#4C6FE0"}
                onChange={(e) => patchPanel({ traceColor: e.target.value })}
              />
              <button className="btn small" type="button" onClick={() => patchPanel({ traceColor: "" })}>
                Reset
              </button>
            </span>
          </label>
          <label className="ctl-row">
            <span className="ctl-label">Line width</span>
            <span className="ctl-input">
              <input
                type="number"
                min={0}
                max={12}
                step={0.5}
                value={selectedPanel.lineWidth}
                onChange={(e) => patchPanel({ lineWidth: Number(e.target.value) })}
                placeholder="0 = source"
              />
            </span>
          </label>
          <label className="ctl-row">
            <span className="ctl-label">Marker size</span>
            <span className="ctl-input">
              <input
                type="number"
                min={0}
                max={36}
                step={1}
                value={selectedPanel.markerSize}
                onChange={(e) => patchPanel({ markerSize: Number(e.target.value) })}
                placeholder="0 = source"
              />
            </span>
          </label>
        </div>
      </div>
      {renderArtistControls(
        (pythonArtists[activeGraphId] ?? []).filter((artist) => artist.axisIndex === selectedPanel.axisIndex),
        true
      )}
      <div className="split-panel-note">
        Initial splitting preserves the source script exactly. Graph detail edits here are applied only to this panel's
        source axis when you press Apply.
      </div>
      <div className="split-panel-actions">
        <button className="btn small" type="button" onClick={() => removeLiveSplitPanel(activeGraphId, selectedPanel.id)}>
          Remove panel
        </button>
        <button className="btn small" type="button" onClick={() => clearLiveSplitPanels(activeGraphId)}>
          Show original
        </button>
        <button
          className="btn small primary"
          type="button"
          onClick={() => applyLiveSplitGraphDetailEdits()}
          disabled={rendering}
        >
          Apply graph-detail edits
        </button>
        <button className="btn small primary" type="button" onClick={splitActiveCompositeScript} disabled={rendering}>
          Re-split from script
        </button>
      </div>
    </div>
  );
}
