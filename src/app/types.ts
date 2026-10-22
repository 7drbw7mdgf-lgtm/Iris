import { Dataset, PlotSpec } from "../types";
import { PythonArtistEdit } from "../pythonArtistOverrides";

export type Mode = "live" | "ggplot" | "python";
export type AppView = "workspace" | "dashboard";
export type TabType = "data" | "stats" | "graph" | "asset";
export type GraphLibrary = "plotly" | "ggplot2" | "matplotlib" | "seaborn" | "altair";
export type ExportFormat = "png" | "svg" | "pdf";
export type DashboardExportFormat = "png" | "pdf";
export type AssetLayout = "grid" | "row" | "column" | "storyboard" | "freeform";
export type AssetControlKind = "buttons" | "slider";
export type ComponentEditScope = "series" | "point" | "graph";

export interface WorkspaceTab {
  id: string;
  type: TabType;
  title: string;
}

export interface GraphState {
  spec: PlotSpec;
  sourceDataTabId: string | null;
  scriptBacked: boolean;
  mode: Mode;
  graphLibrary: GraphLibrary;
  componentColors: Record<string, string>;
  selectedComponent: GraphComponentSelection | null;
  ggplotImage: string | null;
  pythonImage: string | null;
  pythonCodeOverride: string;
  artistOverrides: Record<string, PythonArtistEdit>;
  pythonCodeDirty: boolean;
  loadedPythonScriptName: string | null;
  rLibraries: string;
  rCode: string;
  rCodeDirty: boolean;
  loadedRScriptName: string | null;
  showBottom: boolean;
}

export interface GraphComponentSelection {
  key: string;
  label: string;
  kind: "point" | "trace";
  traceName: string;
}

export interface DashboardItem {
  id: string;
  kind?: "graph" | "asset" | "text" | "file";
  graphId?: string;
  assetId?: string;
  fileName?: string;
  fileDataUrl?: string;
  fileMime?: string;
  splitSourceGraphId?: string;
  splitSourceName?: string;
  textTitle?: string;
  text?: string;
  textSize?: number;
  textFontFamily?: string;
  textColor?: string;
  textAlign?: "left" | "center" | "right";
  bold?: boolean;
  italic?: boolean;
  panelLabel?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LiveSplitPanel {
  id: string;
  sourceGraphId: string;
  sourceName: string;
  title: string;
  axisIndex: number;
  xLabel: string;
  yLabel: string;
  graphTitle: string;
  hideTitle: boolean;
  hideXLabel: boolean;
  hideYLabel: boolean;
  hideLegend: boolean;
  xScale: "linear" | "log";
  yScale: "linear" | "log";
  traceColor: string;
  lineWidth: number;
  markerSize: number;
  data: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardFilter {
  col: string;
  values: string[];
}

export interface SheetDragState {
  id: string;
  type: "graph" | "asset";
  title: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  active: boolean;
}

export interface RailTooltipState {
  title: string;
  x: number;
  y: number;
}

export interface PythonGraphCandidate {
  title: string;
  code: string;
  library: Exclude<GraphLibrary, "ggplot2">;
  inferredSpec: Partial<PlotSpec>;
  canSyncToVisualControls: boolean;
  contractPanel?: boolean;
}

export interface AssetState {
  title: string;
  layout: AssetLayout;
  graphIds: string[];
  panelPositions: Record<string, AssetPanelPosition>;
  panelGap: number;
  controls: AssetControl[];
  notes: string;
}

export interface StatsResultRecord {
  id: string;
  statsTabId: string;
  title: string;
  tool: string;
  datasetName: string;
  fields: string[];
  output: string;
  code: string;
  createdAt: string;
}

export interface ProjectAssetCard {
  id: string;
  kind: "data" | "graph" | "stats" | "result" | "asset" | "dashboard" | "file" | "text";
  title: string;
  meta: string;
  source: string;
  backend: string;
  placementOnly?: boolean;
  hidden?: boolean;
  open: () => void;
  addToDashboard?: () => void;
  copy?: () => void;
}

export interface DataImportPreview {
  name: string;
  source: string;
  dataset: Dataset;
  error?: string;
}

export interface AssetPanelPosition {
  x: number;
  y: number;
  scale?: number;
}

export interface AssetControl {
  id: string;
  kind: AssetControlKind;
  field: string;
  label: string;
  sourceGraphId?: string;
  selectedValues: string[];
  min: number;
  max: number;
  value: number;
}

export interface IrisProject {
  format: "iris-project";
  version: 1;
  dataset: Dataset;
  dataStates?: Record<string, Dataset>;
  workspaceTabs: WorkspaceTab[];
  activeTabId: string;
  graphStates: Record<string, GraphState>;
  assetStates?: Record<string, AssetState>;
  statsResults?: StatsResultRecord[];
  dashboardItems: DashboardItem[];
  dashboardFilters: DashboardFilter[];
  appView: AppView;
  exportSettings: { width: number; height: number; dpi: number };
}

export interface ExportDialogState {
  open: boolean;
  format: ExportFormat;
  width: number;
  height: number;
  dpi: number;
  previewData: string;
  previewFormat: "png" | "svg";
  error: string;
  busy: boolean;
}

export interface DashboardExportRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardExportDialogState {
  open: boolean;
  format: DashboardExportFormat;
  rect: DashboardExportRect | null;
  previewData: string;
  error: string;
  busy: boolean;
}

export interface CodePostDialogState {
  open: boolean;
  language: "r" | "python";
  title: string;
  code: string;
  renderNow: boolean;
  busy: boolean;
  error: string;
}

export interface ExportSuccessState {
  open: boolean;
  path: string;
}

export const EMPTY_DATASET: Dataset = { name: "No data", columns: [], types: {}, rows: [] };
export const AUTOSAVE_KEY = "iris.autosave.v1";

export const CLOSED_EXPORT_DIALOG: ExportDialogState = {
  open: false,
  format: "png",
  width: 7,
  height: 5,
  dpi: 300,
  previewData: "",
  previewFormat: "png",
  error: "",
  busy: false,
};

export const CLOSED_DASHBOARD_EXPORT_DIALOG: DashboardExportDialogState = {
  open: false,
  format: "pdf",
  rect: null,
  previewData: "",
  error: "",
  busy: false,
};

export const CLOSED_CODE_POST_DIALOG: CodePostDialogState = {
  open: false,
  language: "r",
  title: "Code graph",
  code: "",
  renderNow: false,
  busy: false,
  error: "",
};

export const CLOSED_EXPORT_SUCCESS: ExportSuccessState = {
  open: false,
  path: "",
};
