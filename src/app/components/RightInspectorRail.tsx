import React, { MutableRefObject } from "react";
import { Dataset, FriendlyRenderIssue } from "../../types";
import { RendererStatus, PythonArtist } from "../../tauri";
import { WorkspaceTab, GraphState, LiveSplitPanel } from "../types";
import PythonArtistInspector from "../../components/PythonArtistInspector";
import { CodeWorkspaceRail } from "./CodeWorkspaceRail";
import { LiveSplitInspector } from "./LiveSplitInspector";

export interface RightInspectorRailProps {
  activeTab?: WorkspaceTab;
  activeGraph: GraphState;
  activeGraphId: string;
  activeGraphDataset: Dataset;
  activeLiveSplitPanels: LiveSplitPanel[];
  selectedLiveSplitPanelId: string | null;
  selectedPythonArtist: { graphId: string; key: string } | null;
  pythonArtists: Record<string, PythonArtist[]>;
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
  setSelectedPythonArtist: (val: { graphId: string; key: string } | null) => void;
  applyPythonArtistEdit: (key: string, edit: any) => void;
  inspectorScrollTopRef: MutableRefObject<number>;
  updateLiveSplitPanel: (graphId: string, panelId: string, patch: Partial<LiveSplitPanel>) => void;
  removeLiveSplitPanel: (graphId: string, panelId: string) => void;
  clearLiveSplitPanels: (graphId: string) => void;
  applyLiveSplitGraphDetailEdits: () => void;
}

export function RightInspectorRail(props: RightInspectorRailProps) {
  const {
    activeTab,
    activeGraph,
    activeGraphId,
    activeGraphDataset,
    activeLiveSplitPanels,
    selectedLiveSplitPanelId,
    selectedPythonArtist,
    pythonArtists,
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
    setSelectedPythonArtist,
    applyPythonArtistEdit,
    inspectorScrollTopRef,
    updateLiveSplitPanel,
    removeLiveSplitPanel,
    clearLiveSplitPanels,
    applyLiveSplitGraphDetailEdits,
  } = props;

  const renderArtistControls = (artists: PythonArtist[], embedded = false) => {
    if (!artists.length) return null;
    const preferred = selectedPythonArtist?.graphId === activeGraphId ? selectedPythonArtist.key : null;
    const selectedKey = artists.some((artist) => artist.key === preferred) ? preferred : artists[0].key;
    return (
      <PythonArtistInspector
        artists={artists}
        selectedKey={selectedKey}
        overrides={activeGraph.artistOverrides}
        busy={rendering}
        embedded={embedded}
        onSelect={(key) => setSelectedPythonArtist({ graphId: activeGraphId, key })}
        onApply={(key, edit) => void applyPythonArtistEdit(key, edit)}
        onReset={(key) => void applyPythonArtistEdit(key, null)}
        onBack={embedded ? undefined : () => setSelectedPythonArtist(null)}
        initialScrollTop={inspectorScrollTopRef.current}
        onScroll={(top) => {
          inspectorScrollTopRef.current = top;
        }}
      />
    );
  };

  if (activeTab?.type === "graph" && activeGraph.showBottom) {
    return (
      <CodeWorkspaceRail
        activeGraph={activeGraph}
        activeGraphId={activeGraphId}
        activeGraphDataset={activeGraphDataset}
        rendererInfo={rendererInfo}
        renderError={renderError}
        rendering={rendering}
        canRenderSelected={canRenderSelected}
        renderButtonLabel={renderButtonLabel}
        activeGraphIsCompositeScript={activeGraphIsCompositeScript}
        renderGraphPreview={renderGraphPreview}
        renderGgplot={renderGgplot}
        renderPython={renderPython}
        splitActiveCompositeScript={splitActiveCompositeScript}
        refreshRendererStatus={refreshRendererStatus}
        updateGraph={updateGraph}
        activeTabType={activeTab?.type}
      />
    );
  }

  if (activeTab?.type === "graph" && activeLiveSplitPanels.length > 0) {
    return (
      <LiveSplitInspector
        activeLiveSplitPanels={activeLiveSplitPanels}
        selectedLiveSplitPanelId={selectedLiveSplitPanelId}
        activeGraphId={activeGraphId}
        rendering={rendering}
        pythonArtists={pythonArtists}
        renderArtistControls={renderArtistControls}
        updateLiveSplitPanel={updateLiveSplitPanel}
        removeLiveSplitPanel={removeLiveSplitPanel}
        clearLiveSplitPanels={clearLiveSplitPanels}
        applyLiveSplitGraphDetailEdits={applyLiveSplitGraphDetailEdits}
        splitActiveCompositeScript={splitActiveCompositeScript}
      />
    );
  }

  if (
    activeTab?.type === "graph" &&
    selectedPythonArtist?.graphId === activeGraphId &&
    (pythonArtists[activeGraphId]?.length ?? 0) > 0
  ) {
    return renderArtistControls(pythonArtists[activeGraphId]);
  }

  return null;
}
