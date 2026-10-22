import { Dataset, PlotSpec, defaultSpec, type UserSettings, DEFAULT_SETTINGS } from "../types";
import { generateR } from "../rgen";
import { stripPythonArtistOverrides } from "../pythonArtistOverrides";
import {
  GraphState,
  AssetState,
  AssetControl,
  GraphLibrary,
  Mode,
  WorkspaceTab,
  ProjectAssetCard,
} from "./types";
import {
  snapAssetPanelValue,
  saneAssetPanelScale,
  saneAssetPanelGap,
  saneDashboardNumber,
} from "./dashboardUtils";
import { numericExtent } from "./graphMetaUtils";

export function stripRenderedImages(states: Record<string, GraphState>): Record<string, GraphState> {
  const next: Record<string, GraphState> = {};
  for (const [id, state] of Object.entries(states)) {
    next[id] = { ...state, ggplotImage: null, pythonImage: null };
  }
  return next;
}

export function fitSpecToDataset(spec: PlotSpec, ds: Dataset): PlotSpec {
  const fallback = defaultSpec(ds);
  const has = (col: string) => !!col && ds.columns.includes(col);
  const categorical = (col: string) => has(col) && ds.types[col] === "categorical";
  const numeric = (col: string) => has(col) && ds.types[col] === "numeric";
  return {
    ...spec,
    xVar: has(spec.xVar) ? spec.xVar : fallback.xVar,
    yVar: has(spec.yVar) ? spec.yVar : fallback.yVar,
    groupVar: categorical(spec.groupVar) ? spec.groupVar : fallback.groupVar,
    colorVar: numeric(spec.colorVar) ? spec.colorVar : "",
    sizeVar: has(spec.sizeVar) && ds.types[spec.sizeVar] === "numeric" ? spec.sizeVar : "",
    labelVar: has(spec.labelVar) ? spec.labelVar : "",
  };
}

export function freezeAutoAxisRangesToDataset(spec: PlotSpec, ds: Dataset): PlotSpec {
  const next = { ...spec };
  if (spec.xVar && ds.types[spec.xVar] === "numeric" && spec.xMin === "" && spec.xMax === "") {
    const { min, max } = numericExtent(ds, spec.xVar);
    if (Number.isFinite(min) && Number.isFinite(max) && min !== max) {
      next.xMin = String(min);
      next.xMax = String(max);
    }
  }
  if (spec.yVar && ds.types[spec.yVar] === "numeric" && spec.yMin === "" && spec.yMax === "") {
    const { min, max } = numericExtent(ds, spec.yVar);
    if (Number.isFinite(min) && Number.isFinite(max) && min !== max) {
      next.yMin = String(min);
      next.yMax = String(max);
    }
  }
  if (spec.rightYVar && ds.types[spec.rightYVar] === "numeric" && spec.rightYMin === "" && spec.rightYMax === "") {
    const { min, max } = numericExtent(ds, spec.rightYVar);
    if (Number.isFinite(min) && Number.isFinite(max) && min !== max) {
      next.rightYMin = String(min);
      next.rightYMax = String(max);
    }
  }
  return next;
}

export function normalizeAsset(asset: AssetState): AssetState {
  const panelPositions = Object.fromEntries(
    Object.entries(asset.panelPositions || {}).map(([graphId, position]) => [
      graphId,
      {
        x: snapAssetPanelValue(saneDashboardNumber(position.x, 16)),
        y: snapAssetPanelValue(saneDashboardNumber(position.y, 16)),
        scale: saneAssetPanelScale(position.scale),
      },
    ])
  );
  return { ...asset, panelPositions, panelGap: saneAssetPanelGap(asset.panelGap), controls: asset.controls || [] };
}

export function normalizeGraphState(graph: Partial<GraphState> | undefined, ds: Dataset): GraphState {
  const defaults = makeGraphState(ds);
  const raw = graph ?? {};
  const rawSpec = raw.spec && typeof raw.spec === "object" ? raw.spec : {};
  return {
    ...defaults,
    ...raw,
    spec: { ...defaults.spec, ...rawSpec },
    sourceDataTabId: typeof raw.sourceDataTabId === "string" ? raw.sourceDataTabId : null,
    scriptBacked: raw.scriptBacked ?? Boolean(raw.pythonCodeDirty || raw.rCodeDirty),
    mode: raw.mode === "ggplot" || raw.mode === "python" || raw.mode === "live" ? raw.mode : defaults.mode,
    graphLibrary:
      raw.graphLibrary && ["plotly", "ggplot2", "matplotlib", "seaborn", "altair"].includes(raw.graphLibrary)
        ? raw.graphLibrary
        : defaults.graphLibrary,
    componentColors: raw.componentColors && typeof raw.componentColors === "object" ? raw.componentColors : {},
    selectedComponent:
      raw.selectedComponent && typeof raw.selectedComponent === "object" ? raw.selectedComponent : null,
    pythonCodeOverride: typeof raw.pythonCodeOverride === "string" ? raw.pythonCodeOverride : "",
    artistOverrides: raw.artistOverrides && typeof raw.artistOverrides === "object" ? raw.artistOverrides : {},
    rLibraries: typeof raw.rLibraries === "string" ? raw.rLibraries : "",
    rCode: typeof raw.rCode === "string" ? raw.rCode : defaults.rCode,
    loadedRScriptName: typeof raw.loadedRScriptName === "string" ? raw.loadedRScriptName : null,
    loadedPythonScriptName: typeof raw.loadedPythonScriptName === "string" ? raw.loadedPythonScriptName : null,
  };
}

export function applyAssetControls(ds: Dataset, controls: AssetControl[]): Dataset {
  const active = controls.filter((control) => ds.columns.includes(control.field));
  if (!active.length) return ds;
  return {
    ...ds,
    name: `${ds.name} (asset filtered)`,
    rows: ds.rows.filter((row) =>
      active.every((control) => {
        if (control.kind === "buttons") {
          return control.selectedValues.length === 0 || control.selectedValues.includes(String(row[control.field] ?? ""));
        }
        const value = Number(row[control.field]);
        return Number.isFinite(value) && value <= control.value;
      })
    ),
  };
}

export function selectedPreviewMode(library: GraphLibrary): Mode {
  if (library === "ggplot2") return "ggplot";
  if (library === "matplotlib" || library === "seaborn" || library === "altair") return "python";
  return "live";
}

export function codeLooksCompositeScript(code: string): boolean {
  const lower = code.toLowerCase();
  return (
    /\bplt\.subplots?\s*\(/.test(lower) ||
    /\bgridspec\b/.test(lower) ||
    /\bsubplot_mosaic\s*\(/.test(lower) ||
    /\bmake_subplots\s*\(/.test(lower) ||
    /\bfacet_(?:wrap|grid)\s*\(/.test(lower) ||
    /\bfig\.add_axes\s*\(/.test(lower) ||
    /\baxes?\s*=\s*axes?\.flatten\s*\(/.test(lower) ||
    /\bfor\b[\s\S]{0,220}\b(?:ax|axes|axs)\b[\s\S]{0,220}\.(?:plot|scatter|bar|hist|imshow)\s*\(/.test(lower)
  );
}

export function stripIrisSplitOverrides(code: string): string {
  return stripPythonArtistOverrides(code).replace(/\n# --- Iris split-panel overrides ---[\s\S]*$/, "");
}

export function makeGraphState(ds: Dataset, overrides: Partial<GraphState> = {}): GraphState {
  const spec = overrides.spec ?? defaultSpec(ds);
  const rLibraries = overrides.rLibraries ?? "";
  return {
    spec,
    sourceDataTabId: overrides.sourceDataTabId ?? null,
    scriptBacked: overrides.scriptBacked ?? false,
    mode: overrides.mode ?? "live",
    graphLibrary: overrides.graphLibrary ?? "plotly",
    componentColors: overrides.componentColors ?? {},
    selectedComponent: overrides.selectedComponent ?? null,
    ggplotImage: overrides.ggplotImage ?? null,
    pythonImage: overrides.pythonImage ?? null,
    pythonCodeOverride: overrides.pythonCodeOverride ?? "",
    artistOverrides: overrides.artistOverrides ?? {},
    pythonCodeDirty: overrides.pythonCodeDirty ?? false,
    loadedPythonScriptName: overrides.loadedPythonScriptName ?? null,
    rLibraries,
    rCode: overrides.rCode ?? generateR(spec, ds, rLibraries.split(/[\s,]+/).filter(Boolean)),
    rCodeDirty: overrides.rCodeDirty ?? false,
    loadedRScriptName: overrides.loadedRScriptName ?? null,
    showBottom: overrides.showBottom ?? true,
  };
}

export function makeAssetState(title = "Asset"): AssetState {
  return {
    title,
    layout: "grid",
    graphIds: [],
    panelPositions: {},
    panelGap: 18,
    controls: [],
    notes: "",
  };
}

export function dataTabDatasetName(tab: WorkspaceTab, ds: Dataset | undefined): string {
  return ds?.name || tab.title || "Untitled data";
}

export function assetKindGlyph(kind: ProjectAssetCard["kind"]): string {
  if (kind === "data") return "D";
  if (kind === "graph") return "G";
  if (kind === "stats") return "S";
  if (kind === "result") return "R";
  if (kind === "asset") return "A";
  if (kind === "file") return "F";
  if (kind === "text") return "T";
  return "□";
}

const SETTINGS_STORAGE_KEY = "iris_user_settings";

export function loadSavedSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}
