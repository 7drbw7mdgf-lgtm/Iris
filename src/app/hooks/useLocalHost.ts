import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface LocalhostInfo {
  running: boolean;
  port: number;
  url: string;
  address: string;
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function useLocalHost() {
  const [info, setInfo] = useState<LocalhostInfo>({
    running: false,
    port: 4180,
    url: "http://127.0.0.1:4180",
    address: "127.0.0.1:4180",
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    invoke<LocalhostInfo>("iris_localhost_info")
      .then(setInfo)
      .catch(() => {});
  }, []);

  const openInBrowser = async () => {
    if (isTauriRuntime()) {
      try {
        await invoke<string>("iris_open_localhost");
        return;
      } catch {}
    }
    window.open(info.url, "_blank");
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(info.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return {
    info,
    copied,
    openInBrowser,
    copyUrl,
  };
}
