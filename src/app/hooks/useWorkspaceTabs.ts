import { useState, useRef } from "react";
import { WorkspaceTab, TabType } from "../types";

export interface UseWorkspaceTabsOptions {
  initialTabs?: WorkspaceTab[];
  initialActiveTabId?: string;
}

export function useWorkspaceTabs(options?: UseWorkspaceTabsOptions) {
  const [workspaceTabs, setWorkspaceTabs] = useState<WorkspaceTab[]>(
    options?.initialTabs || [
      { id: "data-1", type: "data", title: "Data 1" },
      { id: "stats-1", type: "stats", title: "Stats 1" },
      { id: "graph-1", type: "graph", title: "Graph 1" },
    ]
  );
  const [activeTabId, setActiveTabId] = useState<string>(
    options?.initialActiveTabId || "data-1"
  );
  const tabCounterRef = useRef<number>(2);

  const renameWorkspaceTab = (id: string, nextTitle: string) => {
    setWorkspaceTabs((tabs) =>
      tabs.map((tab) => (tab.id === id ? { ...tab, title: nextTitle } : tab))
    );
  };

  const addTab = (type: TabType): { id: string; title: string; type: TabType } => {
    const n = tabCounterRef.current++;
    const id = `${type}-${n}`;
    const title =
      type === "data"
        ? `Data ${n}`
        : type === "stats"
        ? `Stats ${n}`
        : type === "asset"
        ? `Asset ${n}`
        : `Graph ${n}`;

    setWorkspaceTabs((tabs) => [...tabs, { id, type, title }]);
    setActiveTabId(id);
    return { id, title, type };
  };

  const closeTab = (id: string): WorkspaceTab | null => {
    if (workspaceTabs.length <= 1) return null;
    const closing = workspaceTabs.find((t) => t.id === id) || null;
    const nextTabs = workspaceTabs.filter((t) => t.id !== id);
    setWorkspaceTabs(nextTabs);
    if (activeTabId === id && nextTabs.length > 0) {
      setActiveTabId(nextTabs[nextTabs.length - 1].id);
    }
    return closing;
  };

  const confirmCloseTab = (
    tab: WorkspaceTab,
    onConfirmedClose: (tab: WorkspaceTab) => void
  ) => {
    if (workspaceTabs.length <= 1) return;
    if (!window.confirm(`Delete "${tab.title}"? This cannot be undone.`)) return;
    onConfirmedClose(tab);
  };

  return {
    workspaceTabs,
    setWorkspaceTabs,
    activeTabId,
    setActiveTabId,
    tabCounterRef,
    renameWorkspaceTab,
    addTab,
    closeTab,
    confirmCloseTab,
  };
}
