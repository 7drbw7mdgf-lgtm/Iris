import { useState, useMemo } from "react";
import { Dataset } from "../../types";
import {
  WorkspaceTab,
  GraphState,
  AssetState,
  StatsResultRecord,
  DashboardItem,
  ProjectAssetCard,
  EMPTY_DATASET,
} from "../types";
import {
  projectGraphMeta,
  projectAssetBackendForGraph,
  graphTypeLabel,
} from "../graphMetaUtils";
import { normalizeAsset, makeAssetState, dataTabDatasetName } from "../graphStateUtils";

export interface UseProjectAssetCardsProps {
  workspaceTabs: WorkspaceTab[];
  dataStates: Record<string, Dataset>;
  dataset: Dataset;
  activeDataset: Dataset;
  graphStates: Record<string, GraphState>;
  assetStates: Record<string, AssetState>;
  statsResults: StatsResultRecord[];
  dashboardItems: DashboardItem[];
  setActiveTabId: (id: string) => void;
  setAppView: (view: "workspace" | "dashboard") => void;
  setRailSheetFilter: (filter: any) => void;
  addGraphToDashboard: (id: string) => void;
  addAssetToDashboard: (id: string) => void;
  addStatsResultToDashboard: (result: StatsResultRecord) => void;
  notify: (msg: string) => void;
}

export function useProjectAssetCards(props: UseProjectAssetCardsProps) {
  const {
    workspaceTabs,
    dataStates,
    dataset,
    activeDataset,
    graphStates,
    assetStates,
    statsResults,
    dashboardItems,
    setActiveTabId,
    setAppView,
    setRailSheetFilter,
    addGraphToDashboard,
    addAssetToDashboard,
    addStatsResultToDashboard,
    notify,
  } = props;

  const [projectAssetsOpen, setProjectAssetsOpen] = useState(true);
  const [projectAssetSearch, setProjectAssetSearch] = useState("");

  const projectAssetCards = useMemo<ProjectAssetCard[]>(() => {
    const cards: ProjectAssetCard[] = [];
    workspaceTabs.forEach((tab) => {
      if (tab.type === "data") {
        const ds = dataStates[tab.id] ?? EMPTY_DATASET;
        cards.push({
          id: `asset-index-${tab.id}`,
          kind: "data",
          title: dataTabDatasetName(tab, ds),
          meta: `${ds.rows.length} rows · ${ds.columns.length} columns`,
          source: "Data table",
          backend: "Data tables",
          open: () => {
            setActiveTabId(tab.id);
            setAppView("workspace");
            setRailSheetFilter("data");
          },
        });
      }
      if (tab.type === "graph") {
        const graph = graphStates[tab.id];
        const sourceName = graph?.sourceDataTabId
          ? dataTabDatasetName(
              workspaceTabs.find((item) => item.id === graph.sourceDataTabId) || tab,
              dataStates[graph.sourceDataTabId]
            )
          : dataset.name;
        cards.push({
          id: `asset-index-${tab.id}`,
          kind: "graph",
          title: tab.title,
          meta: projectGraphMeta(graph),
          source:
            graph &&
            (graph.scriptBacked ||
              graph.pythonCodeDirty ||
              graph.rCodeDirty ||
              graph.loadedPythonScriptName ||
              graph.loadedRScriptName)
              ? `Script source · ${sourceName || "No data"}`
              : sourceName || "No data source",
          backend: projectAssetBackendForGraph(graph),
          open: () => {
            setActiveTabId(tab.id);
            setAppView("workspace");
            setRailSheetFilter("graph");
          },
          addToDashboard: () => addGraphToDashboard(tab.id),
        });
      }
      if (tab.type === "stats") {
        const resultCount = statsResults.filter(
          (result) => result.statsTabId === tab.id
        ).length;
        cards.push({
          id: `asset-index-${tab.id}`,
          kind: "stats",
          title: tab.title,
          meta: `${resultCount} saved result${resultCount === 1 ? "" : "s"}`,
          source: activeDataset.name || dataset.name || "Dataset",
          backend: "Stats sheets",
          open: () => {
            setActiveTabId(tab.id);
            setAppView("workspace");
            setRailSheetFilter("stats");
          },
        });
      }
      if (tab.type === "asset") {
        const asset = normalizeAsset(
          assetStates[tab.id] ?? makeAssetState(tab.title)
        );
        cards.push({
          id: `asset-index-${tab.id}`,
          kind: "asset",
          title: asset.title || tab.title,
          meta: `${asset.graphIds.length} figure panel${
            asset.graphIds.length === 1 ? "" : "s"
          } · reusable dashboard collection`,
          source: "Dashboard collection",
          backend: "Dashboard collections",
          open: () => {
            setActiveTabId(tab.id);
            setAppView("workspace");
            setRailSheetFilter("asset");
          },
          addToDashboard: () => addAssetToDashboard(tab.id),
        });
      }
    });
    statsResults.forEach((result) => {
      cards.push({
        id: `asset-index-${result.id}`,
        kind: "result",
        title: result.title,
        meta: `${result.tool}${
          result.fields.length ? ` · ${result.fields.join(", ")}` : ""
        }`,
        source: `Stats · ${result.datasetName}`,
        backend: "Stats results",
        hidden: true,
        open: () => {
          setActiveTabId(result.statsTabId);
          setAppView("workspace");
          setRailSheetFilter("stats");
        },
        addToDashboard: () => addStatsResultToDashboard(result),
        copy: () => {
          navigator.clipboard?.writeText(result.output || result.code);
          notify("Copied stats result.");
        },
      });
    });
    dashboardItems.forEach((item, index) => {
      if (item.splitSourceGraphId) return;
      const kind = item.kind || "graph";
      const graph = item.graphId ? graphStates[item.graphId] : null;
      const asset = item.assetId ? assetStates[item.assetId] : null;
      if (kind === "graph" || kind === "asset") return;
      const title =
        kind === "text"
          ? item.textTitle || `Textbox ${index + 1}`
          : kind === "file"
          ? item.fileName || `File ${index + 1}`
          : kind === "asset"
          ? asset?.title || `Dashboard collection ${index + 1}`
          : workspaceTabs.find((tab) => tab.id === item.graphId)?.title ||
            `Dashboard item ${index + 1}`;
      cards.push({
        id: `asset-index-${item.id}`,
        kind: kind === "file" ? "file" : kind === "text" ? "text" : "dashboard",
        title,
        meta:
          kind === "file"
            ? item.fileMime || "Dropped file"
            : kind === "text"
            ? "Dashboard textbox"
            : graph
            ? `${graphTypeLabel(graph.spec.graphType)} placement`
            : asset
            ? "Dashboard collection placement"
            : "Dashboard placement",
        source: "Dashboard-only placement",
        backend: "Dashboard-only items",
        placementOnly: true,
        hidden: kind === "file" || kind === "text",
        open: () => setAppView("dashboard"),
      });
    });
    return cards;
  }, [
    workspaceTabs,
    dataStates,
    graphStates,
    assetStates,
    statsResults,
    dashboardItems,
    activeDataset.name,
    dataset.name,
    setActiveTabId,
    setAppView,
    setRailSheetFilter,
    addGraphToDashboard,
    addAssetToDashboard,
    addStatsResultToDashboard,
    notify,
  ]);

  const filteredProjectAssetCards = useMemo(() => {
    const term = projectAssetSearch.trim().toLowerCase();
    if (!term) return projectAssetCards;
    return projectAssetCards.filter((card) =>
      `${card.title} ${card.meta} ${card.source} ${card.backend} ${card.kind}`
        .toLowerCase()
        .includes(term)
    );
  }, [projectAssetCards, projectAssetSearch]);

  return {
    projectAssetsOpen,
    setProjectAssetsOpen,
    projectAssetSearch,
    setProjectAssetSearch,
    projectAssetCards,
    filteredProjectAssetCards,
  };
}
