import { invoke, Channel } from "@tauri-apps/api/core";

export interface UpdateInfo {
  currentVersion: string;
  availableVersion?: string | null;
  notes?: string | null;
  ready: boolean;
  autoDownload: boolean;
  lastChecked: number;
  canUpdate: boolean;
}

export interface UpdateProgress {
  phase: "downloading" | "verifying";
  downloaded: number;
  total?: number | null;
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function getUpdateInfo(): Promise<UpdateInfo> {
  if (!isTauriRuntime()) {
    return {
      currentVersion: "5.2.0",
      availableVersion: null,
      notes: null,
      ready: false,
      autoDownload: true,
      lastChecked: 0,
      canUpdate: false,
    };
  }
  return invoke<UpdateInfo>("iris_update_info");
}

export async function checkForUpdates(): Promise<UpdateInfo> {
  if (!isTauriRuntime()) {
    throw new Error("Updates are only available inside the Iris desktop app.");
  }
  return invoke<UpdateInfo>("iris_update_check");
}

export async function downloadUpdate(
  onProgress?: (event: UpdateProgress) => void
): Promise<UpdateInfo> {
  if (!isTauriRuntime()) {
    throw new Error("Updates are only available inside the Iris desktop app.");
  }
  const channel = new Channel<UpdateProgress>();
  if (onProgress) {
    channel.onmessage = onProgress;
  }
  return invoke<UpdateInfo>("iris_update_download", { onEvent: channel });
}

export async function cancelUpdateDownload(): Promise<void> {
  if (!isTauriRuntime()) return;
  return invoke<void>("iris_update_cancel");
}

export async function setUpdatePreferences(autoDownload: boolean): Promise<UpdateInfo> {
  if (!isTauriRuntime()) {
    return {
      currentVersion: "5.2.0",
      availableVersion: null,
      notes: null,
      ready: false,
      autoDownload,
      lastChecked: 0,
      canUpdate: false,
    };
  }
  return invoke<UpdateInfo>("iris_update_preferences", { autoDownload });
}

export async function installUpdateAndRestart(): Promise<void> {
  if (!isTauriRuntime()) {
    throw new Error("Cannot restart browser preview.");
  }
  return invoke<void>("iris_update_install");
}
