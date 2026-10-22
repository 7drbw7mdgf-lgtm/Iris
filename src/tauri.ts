import { invoke } from "@tauri-apps/api/core";

const DESKTOP_RENDERER_MESSAGE =
  "The desktop renderer is not available in this browser preview. Open Iris as the Tauri desktop app to run Python/R scripts, render code-backed graphs, open files, and export files.";

export interface RResult {
  stdout: string;
  stderr: string;
  success: boolean;
}

export interface PythonArtist {
  key: string;
  axisIndex: number;
  kind: "line" | "collection" | "patch" | "text" | "title" | "xlabel" | "ylabel" | "legend" | "image" | "table" | "artist";
  index: number;
  label: string;
  bbox: [number, number, number, number] | null;
  points: [number, number][];
  visible: boolean;
  color: string;
  properties?: Record<string, string | number | boolean>;
}

export interface RenderResult {
  success: boolean;
  stderr: string;
  format: string;
  data: string; // base64
  saved_to: string | null;
  artists: PythonArtist[];
}

export interface SplitPanelsResult {
  success: boolean;
  stderr: string;
  panels: Array<{ title: string; graphTitle?: string; axisIndex?: number; xLabel?: string; yLabel?: string; data: string }>;
}

export interface FileResult {
  success: boolean;
  error: string;
  data: string;
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function stringifyInvokeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    if ("message" in error && typeof error.message === "string") return error.message;
    if ("error" in error && typeof error.error === "string") return error.error;
    if ("stderr" in error && typeof error.stderr === "string") return error.stderr;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

async function invokeCommand<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriRuntime()) {
    throw new Error(DESKTOP_RENDERER_MESSAGE);
  }
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    const detail = stringifyInvokeError(error);
    throw new Error(detail && detail !== "null" && detail !== "undefined" ? detail : `Tauri command '${command}' failed.`);
  }
}

export function runRScript(script: string): Promise<RResult> {
  return invokeCommand<RResult>("run_r_script", { script });
}

export function runPythonScript(script: string): Promise<RResult> {
  return invokeCommand<RResult>("run_python_script", { script });
}

export function rVersion(): Promise<RResult> {
  return invokeCommand<RResult>("r_version");
}

export function renderPlot(args: {
  code: string;
  format: string;
  width: number;
  height: number;
  dpi: number;
  savePath?: string | null;
}): Promise<RenderResult> {
  return invokeCommand<RenderResult>("render_plot", {
    code: args.code,
    format: args.format,
    width: args.width,
    height: args.height,
    dpi: args.dpi,
    savePath: args.savePath ?? null,
  });
}

export function renderPythonPlot(args: {
  code: string;
  format: string;
  width: number;
  height: number;
  dpi: number;
  savePath?: string | null;
}): Promise<RenderResult> {
  return invokeCommand<RenderResult>("render_python_plot", {
    code: args.code,
    format: args.format,
    width: args.width,
    height: args.height,
    dpi: args.dpi,
    savePath: args.savePath ?? null,
  });
}

export function splitPythonFigurePanels(args: {
  code: string;
  dpi: number;
}): Promise<SplitPanelsResult> {
  return invokeCommand<SplitPanelsResult>("split_python_figure_panels", {
    code: args.code,
    dpi: args.dpi,
  });
}

export interface RendererStatus {
  r_path: string;
  r_found: boolean;
  r_version: string;
  r_ggplot2: boolean;
  r_svglite: boolean;
  python_path: string;
  python_found: boolean;
  python_version: string;
  python_missing: string[];
  python_ready: boolean;
}

export function rendererStatus(): Promise<RendererStatus> {
  return invokeCommand<RendererStatus>("renderer_status");
}

export function repairPythonEnv(): Promise<RResult> {
  return invokeCommand<RResult>("repair_python_env");
}

export function installRSvglite(): Promise<RResult> {
  return invokeCommand<RResult>("install_r_svglite");
}

export function readTextFile(path: string): Promise<FileResult> {
  return invokeCommand<FileResult>("read_text_file", { path });
}

export function readBinaryFileBase64(path: string): Promise<FileResult> {
  return invokeCommand<FileResult>("read_binary_file_base64", { path });
}

export function writeTextFile(path: string, contents: string): Promise<FileResult> {
  return invokeCommand<FileResult>("write_text_file", { path, contents });
}

export function writeBase64File(path: string, data: string): Promise<FileResult> {
  return invokeCommand<FileResult>("write_base64_file", { path, data });
}
