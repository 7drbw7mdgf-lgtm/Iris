import { Dataset } from "../../types";
import { WorkspaceTab, TabType, AppView, GraphState } from "../types";
import { ProjectAssetsRail, ProjectAssetsRailProps } from "./ProjectAssetsRail";
import { computeSparklineBins, graphTypeLabel, sheetInitial } from "../graphMetaUtils";

export interface LeftRailProps {
  dataset: Dataset;
  workspaceTabs: WorkspaceTab[];
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  appView: AppView;
  setAppView: (view: AppView) => void;
  graphStates: Record<string, GraphState>;
  railSectionsCollapsed: { fields: boolean; sheets: boolean; assets: boolean };
  setRailSectionsCollapsed: React.Dispatch<React.SetStateAction<{ fields: boolean; sheets: boolean; assets: boolean }>>;
  railSheetFilter: TabType;
  setRailSheetFilter: (filter: TabType) => void;
  activeDataTabId: string;
  activeGraphId: string;
  createSheetFromMenu: (filter: TabType) => void;
  createMenuLabel: string;
  confirmCloseTab: (tab: WorkspaceTab) => void;
  addTab: (type: TabType) => void;
  projectAssetsProps: ProjectAssetsRailProps;
}

export function LeftRail(props: LeftRailProps) {
  const {
    dataset,
    workspaceTabs,
    activeTabId,
    setActiveTabId,
    appView,
    setAppView,
    graphStates,
    railSectionsCollapsed,
    setRailSectionsCollapsed,
    railSheetFilter,
    setRailSheetFilter,
    activeDataTabId,
    activeGraphId,
    createSheetFromMenu,
    createMenuLabel,
    confirmCloseTab,
    addTab,
    projectAssetsProps,
  } = props;

  const renderRailSheetButton = (tab: WorkspaceTab) => (
    <div
      key={tab.id}
      className={`rail-sheet ${tab.type} ${appView === "workspace" && activeTabId === tab.id ? "active" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => {
        setActiveTabId(tab.id);
        setAppView("workspace");
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setActiveTabId(tab.id);
          setAppView("workspace");
        }
      }}
      draggable={tab.type === "graph" || tab.type === "asset"}
      onDragStart={(e) => {
        e.stopPropagation();
        if (tab.type === "graph") {
          e.dataTransfer.setData("text/graph-tab", tab.id);
          e.dataTransfer.setData("application/x-iris-graph", tab.id);
          e.dataTransfer.setData("text/plain", `graph:${tab.id}`);
          e.dataTransfer.dropEffect = "copy";
          e.dataTransfer.effectAllowed = "copy";
        }
        if (tab.type === "asset") {
          e.dataTransfer.setData("text/asset-tab", tab.id);
          e.dataTransfer.setData("application/x-iris-asset", tab.id);
          e.dataTransfer.setData("text/plain", `asset:${tab.id}`);
          e.dataTransfer.dropEffect = "copy";
          e.dataTransfer.effectAllowed = "copy";
        }
      }}
      title={`${tab.title}${tab.type === "graph" || tab.type === "asset" ? " — drag to the dashboard to place it" : ""}`}
      data-tooltip={tab.title}
      aria-label={tab.title}
    >
      <span className="rail-tab-kind-wrap">
        <span className={`tab-kind ${tab.type}`} data-letter={sheetInitial(tab.title, tab.type)} aria-hidden="true" />
        {workspaceTabs.length > 1 && (
          <button
            className="rail-tab-delete"
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              confirmCloseTab(tab);
            }}
            aria-label={`Delete ${tab.title}`}
            title={`Delete ${tab.title}`}
          >
            ×
          </button>
        )}
      </span>
      <span>
        <strong>{tab.title}</strong>
        <em>{tab.type === "graph" && graphStates[tab.id] ? graphTypeLabel(graphStates[tab.id].spec.graphType) : tab.type}</em>
      </span>
    </div>
  );

  const renderRailCluster = (type: TabType, label: string) => {
    const tabs = workspaceTabs.filter((tab) => tab.type === type);
    if (!tabs.length) return null;
    return (
      <div className={`rail-subgroup rail-subgroup-${type}`} key={type}>
        <span>{label}</span>
        <div className="rail-subgroup-scroll">
          {tabs.map(renderRailSheetButton)}
        </div>
      </div>
    );
  };

  const renderActiveRailSheets = () => {
    const labels: Record<TabType, string> = { data: "Data", stats: "Stats", graph: "Figures", asset: "Collections" };
    const cluster = renderRailCluster(railSheetFilter, labels[railSheetFilter]);
    return (
      <div className="rail-active-sheets">
        {cluster ?? (
          <div className="rail-empty-cluster">
            <span>No {labels[railSheetFilter].toLowerCase()} yet.</span>
            <button className="btn small" type="button" onClick={() => addTab(railSheetFilter)}>Create</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="left-rail">
      <div className="rail-card data-source-card">
        <div className="rail-card-head">
          <span>Data source</span>
        </div>
        <strong>{dataset.name}</strong>
        <em>{dataset.rows.length} rows · {dataset.columns.length} cols</em>
      </div>

      <div className={`rail-card rail-fields ${railSectionsCollapsed.fields ? "collapsed" : ""}`}>
        <button
          className="rail-card-head rail-card-toggle"
          type="button"
          onClick={() => setRailSectionsCollapsed((state) => ({ ...state, fields: !state.fields }))}
          aria-expanded={!railSectionsCollapsed.fields}
        >
          <span><span className="rail-collapse-chev" aria-hidden="true">{railSectionsCollapsed.fields ? "›" : "⌄"}</span> Fields</span>
          <em>{dataset.columns.length}</em>
        </button>
        {!railSectionsCollapsed.fields && (
          <div className="rail-field-list">
            {dataset.columns.length === 0 && <p className="muted small">Import data to populate fields.</p>}
            {dataset.columns.map((c) => {
              const isNum = dataset.types[c] === "numeric";
              const bins = isNum ? computeSparklineBins(dataset.rows, c) : null;
              return (
                <div
                  key={c}
                  className="rail-field-chip"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/column", c);
                    e.dataTransfer.setData("text/plain", c);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  title={`Drag ${c} to a shelf`}
                >
                  <span className={`field-type-tag ${isNum ? "numeric" : "text"}`} title={isNum ? "Numeric field" : "Categorical field"}>
                    {isNum ? "123" : "Aa"}
                  </span>
                  <span className="rail-field-name">{c}</span>
                  {isNum && bins ? (
                    <svg className="sparkline-mini" viewBox="0 0 24 10" width="24" height="10" aria-label="Distribution sparkline">
                      {bins.map((h, bi) => (
                        <rect key={bi} x={bi * 5} y={10 - h} width={3.5} height={h} rx={0.8} />
                      ))}
                    </svg>
                  ) : (
                    <span className="field-cardinality-tag">{new Set(dataset.rows.map((r) => r[c])).size} u</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={`rail-card rail-sheets ${railSectionsCollapsed.sheets ? "collapsed" : ""}`}>
        <div className="rail-card-head rail-card-head-row">
          <button
            className="rail-card-toggle"
            type="button"
            onClick={() => setRailSectionsCollapsed((state) => ({ ...state, sheets: !state.sheets }))}
            aria-expanded={!railSectionsCollapsed.sheets}
          >
            <span className="rail-collapse-chev" aria-hidden="true">{railSectionsCollapsed.sheets ? "›" : "⌄"}</span> Sheets
          </button>
        </div>
        {!railSectionsCollapsed.sheets && (
          <div className="rail-sheets-body">
            <div className="rail-mode-nav" aria-label="Workspace areas">
              <button type="button" className={railSheetFilter === "data" ? "active" : ""} onClick={() => { setRailSheetFilter("data"); setActiveTabId(activeDataTabId); setAppView("workspace"); }} title="Data">
                <span data-initial="D">Data</span>
              </button>
              <button type="button" className={railSheetFilter === "graph" ? "active" : ""} onClick={() => { setRailSheetFilter("graph"); setActiveTabId(activeGraphId); setAppView("workspace"); }} title="Figures">
                <span data-initial="F">Figures</span>
              </button>
              <button type="button" className={railSheetFilter === "stats" ? "active" : ""} onClick={() => { setRailSheetFilter("stats"); const firstStats = workspaceTabs.find((tab) => tab.type === "stats")?.id; if (firstStats) setActiveTabId(firstStats); setAppView("workspace"); }} title="Stats">
                <span data-initial="S">Stats</span>
              </button>
            </div>
            <div className="rail-create-row" onClick={(e) => e.stopPropagation()}>
              <button
                className="btn small rail-context-create"
                type="button"
                onClick={() => createSheetFromMenu(railSheetFilter)}
              >
                + {createMenuLabel}
              </button>
            </div>
            {renderActiveRailSheets()}
          </div>
        )}
      </div>

      <ProjectAssetsRail {...projectAssetsProps} />
    </aside>
  );
}
