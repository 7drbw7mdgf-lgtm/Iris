import { useState, useRef, WheelEvent, TouchEvent } from "react";
import { Dataset } from "../../types";
import {
  DashboardItem,
  DashboardFilter,
  DashboardExportRect,
  StatsResultRecord,
} from "../types";
import { snapToAlignmentGuides } from "../dashboardAlignment";
import { parseDashboardDropPayload, processDroppedDashboardFiles } from "../dashboardFiles";
import {
  snapDashboardValue,
  snapDashboardSize,
  normalizeDashboardItem,
  DASHBOARD_MIN_CARD_WIDTH,
  DASHBOARD_MIN_CARD_HEIGHT,
} from "../dashboardUtils";

export interface UseDashboardWorkspaceProps {
  dataset: Dataset;
  notify?: (msg: string) => void;
  setAppView?: (view: "workspace" | "dashboard") => void;
}

export function useDashboardWorkspace(props: UseDashboardWorkspaceProps) {
  const { notify, setAppView } = props;

  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>([]);
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilter[]>([]);
  const [dashboardZoom, setDashboardZoom] = useState(1);
  const [dashboardSelectedItemIds, setDashboardSelectedItemIds] = useState<string[]>([]);
  const [dashboardSelectRect, setDashboardSelectRect] = useState<DashboardExportRect | null>(null);
  const [dashboardSelectDrag, setDashboardSelectDrag] = useState<{
    startX: number;
    startY: number;
    x: number;
    y: number;
  } | null>(null);

  const dashboardCanvasRef = useRef<HTMLDivElement>(null);
  const dashboardTouchDistanceRef = useRef<number | null>(null);

  const moveDashboardItem = (id: string, x: number, y: number) => {
    setDashboardItems((items) => {
      const cur = items.find((item) => item.id === id);
      const w = cur?.w || 380;
      const h = cur?.h || 300;
      const snapped = snapToAlignmentGuides(id, x, y, w, h, items);
      return items.map((item) =>
        item.id === id ? { ...item, x: snapped.x, y: snapped.y } : item
      );
    });
  };

  const resizeDashboardItem = (id: string, w: number, h: number) => {
    setDashboardItems((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              w: snapDashboardSize(
                w,
                item.kind === "text" ? 72 : item.kind === "file" ? 96 : DASHBOARD_MIN_CARD_WIDTH
              ),
              h: snapDashboardSize(
                h,
                item.kind === "text" ? 24 : item.kind === "file" ? 96 : DASHBOARD_MIN_CARD_HEIGHT
              ),
            }
          : item
      )
    );
  };

  const updateDashboardItem = (id: string, patch: Partial<DashboardItem>) => {
    setDashboardItems((items) =>
      items.map((item) => (item.id === id ? normalizeDashboardItem({ ...item, ...patch }) : item))
    );
  };

  const removeDashboardItem = (id: string) => {
    setDashboardItems((items) => items.filter((item) => item.id !== id));
  };

  const arrangeDashboardGrid = (columns: number) => {
    setDashboardItems((items) => {
      if (items.length === 0) return items;
      const sorted = [...items].sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));
      const cols = Math.max(1, columns);
      const cardW = 380;
      const cardH = 300;
      const gap = 20;
      const startX = 40;
      const startY = 40;
      const positionMap = new Map<string, { x: number; y: number; w: number; h: number }>();
      sorted.forEach((item, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        positionMap.set(item.id, {
          x: startX + col * (cardW + gap),
          y: startY + row * (cardH + gap),
          w: cardW,
          h: cardH,
        });
      });
      return items.map((item) => {
        const pos = positionMap.get(item.id);
        return pos ? { ...item, ...pos } : item;
      });
    });
  };

  const alignDashboardYAxes = () => {
    setDashboardItems((items) => {
      if (items.length <= 1) return items;
      const minX = Math.min(...items.map((it) => it.x));
      return items.map((it) => ({ ...it, x: minX }));
    });
  };

  const autoLetterDashboardPanels = (format: "letter" | "parens" | "dot" = "letter") => {
    setDashboardItems((items) => {
      const target = items.filter((it) => it.kind !== "text");
      const sorted = [...target].sort((a, b) => {
        const rowDiff = Math.floor(a.y / 150) - Math.floor(b.y / 150);
        return rowDiff !== 0 ? rowDiff : a.x - b.x;
      });
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const letterMap = new Map<string, string>();
      sorted.forEach((item, index) => {
        const raw = letters[index % letters.length];
        const formatted = format === "parens" ? `(${raw})` : format === "dot" ? `${raw}.` : raw;
        letterMap.set(item.id, formatted);
      });
      return items.map((item) => {
        const label = letterMap.get(item.id);
        return label ? { ...item, panelLabel: label } : item;
      });
    });
  };

  const toggleDashboardFilter = (col: string, val: string) => {
    setDashboardFilters((prev) => {
      const existing = prev.find((f) => f.col === col);
      if (!existing) return [...prev, { col, values: [val] }];
      const nextVals = existing.values.includes(val)
        ? existing.values.filter((v) => v !== val)
        : [...existing.values, val];
      if (nextVals.length === 0) return prev.filter((f) => f.col !== col);
      return prev.map((f) => (f.col === col ? { ...f, values: nextVals } : f));
    });
  };

  const filterValuesFor = (col: string): string[] => {
    return dashboardFilters.find((f) => f.col === col)?.values ?? [];
  };

  const clampDashboardZoom = (value: number) => Math.min(3, Math.max(0.5, value));

  const handleDashboardWheel = (e: WheelEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest("button, input, select, textarea, [contenteditable='true']")) return;
    e.preventDefault();
    setDashboardZoom((value) => clampDashboardZoom(value * Math.exp(-e.deltaY * 0.002)));
  };

  const handleDashboardTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) return;
    const [first, second] = Array.from(e.touches);
    const distance = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
    if (!dashboardTouchDistanceRef.current) {
      dashboardTouchDistanceRef.current = distance;
      return;
    }
    setDashboardZoom((value) => clampDashboardZoom(value * (distance / dashboardTouchDistanceRef.current!)));
    dashboardTouchDistanceRef.current = distance;
    e.preventDefault();
  };

  const dashboardPointerRect = (clientX: number, clientY: number) => {
    const canvas = dashboardCanvasRef.current;
    if (!canvas) return null;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (clientX - bounds.left) / dashboardZoom + canvas.scrollLeft,
      y: (clientY - bounds.top) / dashboardZoom + canvas.scrollTop,
    };
  };

  const addGraphToDashboard = (graphId: string) => {
    const count = dashboardItems.length;
    setDashboardItems((items) => [
      ...items,
      {
        id: `dash-${Date.now()}`,
        kind: "graph",
        graphId,
        x: snapDashboardValue(24 + (count % 3) * 72),
        y: snapDashboardValue(24 + (count % 3) * 48),
        w: snapDashboardSize(552, DASHBOARD_MIN_CARD_WIDTH),
        h: snapDashboardSize(360, DASHBOARD_MIN_CARD_HEIGHT),
      },
    ]);
    setAppView?.("dashboard");
  };

  const addAssetToDashboard = (assetId: string) => {
    const count = dashboardItems.length;
    setDashboardItems((items) => [
      ...items,
      {
        id: `dash-${Date.now()}`,
        kind: "asset",
        assetId,
        x: snapDashboardValue(24 + (count % 3) * 72),
        y: snapDashboardValue(24 + (count % 3) * 48),
        w: snapDashboardSize(720, DASHBOARD_MIN_CARD_WIDTH),
        h: snapDashboardSize(440, DASHBOARD_MIN_CARD_HEIGHT),
      },
    ]);
    setAppView?.("dashboard");
  };

  const addGraphToDashboardAt = (graphId: string, x: number, y: number) => {
    setDashboardItems((items) => [
      ...items,
      {
        id: `dash-${Date.now()}`,
        kind: "graph",
        graphId,
        x: snapDashboardValue(x),
        y: snapDashboardValue(y),
        w: snapDashboardSize(528, DASHBOARD_MIN_CARD_WIDTH),
        h: snapDashboardSize(360, DASHBOARD_MIN_CARD_HEIGHT),
      },
    ]);
    setAppView?.("dashboard");
  };

  const addTextToDashboard = () => {
    const count = dashboardItems.length;
    setDashboardItems((items) => [
      ...items,
      {
        id: `dash-${Date.now()}`,
        kind: "text",
        textTitle: "Textbox",
        text: "Figure legend. Describe the key comparison, n, test, and visual encoding here.",
        textSize: 13,
        textFontFamily: "Inter",
        textColor: "#1f2937",
        textAlign: "left",
        bold: false,
        italic: false,
        x: snapDashboardValue(24 + (count % 3) * 72),
        y: snapDashboardValue(24 + (count % 3) * 48),
        w: snapDashboardSize(360, 72),
        h: snapDashboardSize(72, 24),
      },
    ]);
    setAppView?.("dashboard");
    notify?.("Placed textbox on the dashboard.");
  };

  const addLetterToDashboard = () => {
    const count = dashboardItems.length;
    const existingLetters = dashboardItems.filter((item) => item.kind === "text" && item.textTitle === "Panel label").length;
    const letter = String.fromCharCode(65 + (existingLetters % 26));
    setDashboardItems((items) => [
      ...items,
      {
        id: `dash-${Date.now()}`,
        kind: "text",
        textTitle: "Panel label",
        text: letter,
        textSize: 30,
        textFontFamily: "Helvetica",
        textColor: "#111827",
        textAlign: "left",
        bold: true,
        italic: false,
        x: snapDashboardValue(24 + (count % 3) * 64),
        y: snapDashboardValue(24 + (count % 3) * 40),
        w: snapDashboardSize(92, 80),
        h: snapDashboardSize(72, 60),
      },
    ]);
    setAppView?.("dashboard");
    notify?.(`Added panel label ${letter}.`);
  };

  const addStatsResultToDashboard = (result: StatsResultRecord) => {
    const count = dashboardItems.length;
    setDashboardItems((items) => [
      ...items,
      {
        id: `dash-${Date.now()}`,
        kind: "text",
        textTitle: result.title,
        text: result.output || result.code,
        textSize: 12,
        textFontFamily: "Inter",
        textColor: "#1f2937",
        textAlign: "left",
        bold: false,
        italic: false,
        x: snapDashboardValue(24 + (count % 3) * 72),
        y: snapDashboardValue(24 + (count % 3) * 48),
        w: snapDashboardSize(480, 72),
        h: snapDashboardSize(240, 24),
      },
    ]);
    setAppView?.("dashboard");
    notify?.(`Placed ${result.title} on the dashboard.`);
  };

  const dashboardDropPayload = (dt: DataTransfer) => parseDashboardDropPayload(dt);

  const addDroppedDashboardFiles = async (files: File[], canvas: HTMLElement, clientX: number, clientY: number) => {
    const nextItems = await processDroppedDashboardFiles(files, canvas, clientX, clientY);
    if (nextItems.length === 0) {
      notify?.("Drop PNG, JPEG, TIFF, or PDF files onto the dashboard.");
      return;
    }
    setDashboardItems((items) => [...items, ...nextItems]);
    setAppView?.("dashboard");
    notify?.(`Placed ${nextItems.length} file${nextItems.length === 1 ? "" : "s"} on the dashboard.`);
  };

  return {
    dashboardItems,
    setDashboardItems,
    dashboardFilters,
    setDashboardFilters,
    dashboardZoom,
    setDashboardZoom,
    dashboardSelectedItemIds,
    setDashboardSelectedItemIds,
    dashboardSelectRect,
    setDashboardSelectRect,
    dashboardSelectDrag,
    setDashboardSelectDrag,
    dashboardCanvasRef,
    dashboardTouchDistanceRef,
    moveDashboardItem,
    resizeDashboardItem,
    updateDashboardItem,
    removeDashboardItem,
    arrangeDashboardGrid,
    alignDashboardYAxes,
    autoLetterDashboardPanels,
    toggleDashboardFilter,
    filterValuesFor,
    handleDashboardWheel,
    handleDashboardTouchMove,
    dashboardPointerRect,
    addGraphToDashboard,
    addAssetToDashboard,
    addGraphToDashboardAt,
    addTextToDashboard,
    addLetterToDashboard,
    addStatsResultToDashboard,
    dashboardDropPayload,
    addDroppedDashboardFiles,
  };
}
