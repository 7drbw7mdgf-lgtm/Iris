import React, { useRef, useEffect, Fragment, ReactNode } from "react";
import { DashboardItem, LiveSplitPanel } from "../types";
import { DASHBOARD_GRID_SIZE, snapDashboardSize } from "../dashboardUtils";

export function DashboardTextPanel({
  item,
  onChange,
}: {
  item: DashboardItem;
  onChange: (patch: Partial<DashboardItem>) => void;
}) {
  const measureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = measureRef.current;
    if (!node) return;
    const isPanelLabel = item.textTitle === "Panel label";
    const nextW = snapDashboardSize(Math.ceil(node.scrollWidth + 8), isPanelLabel ? 48 : 72);
    const nextH = snapDashboardSize(Math.ceil(node.scrollHeight + 4), isPanelLabel ? 48 : 24);
    if (Math.abs(nextW - item.w) >= DASHBOARD_GRID_SIZE || Math.abs(nextH - item.h) >= DASHBOARD_GRID_SIZE) {
      onChange({ w: nextW, h: nextH });
    }
  }, [item.text, item.textSize, item.textFontFamily, item.textColor, item.textAlign, item.bold, item.italic, item.textTitle, item.w, item.h, onChange]);

  return (
    <div className="dashboard-text-panel">
      <div className="dashboard-text-toolbar" onPointerDown={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={item.textTitle ?? "Textbox"}
          onChange={(e) => onChange({ textTitle: e.target.value })}
          placeholder="Page Title"
          aria-label="Textbox title"
        />
        <div className="dashboard-text-ribbon-row">
          <label className="dashboard-text-control">
            <span>Font</span>
            <select
              className="dashboard-text-font"
              value={item.textFontFamily ?? "Helvetica"}
              onChange={(e) => onChange({ textFontFamily: e.target.value })}
              aria-label="Text font"
            >
              <option>Helvetica</option>
              <option>Arial</option>
              <option>Inter</option>
              <option>Georgia</option>
              <option>Times New Roman</option>
              <option>Courier New</option>
            </select>
          </label>
          <label className="dashboard-text-control dashboard-text-size-control">
            <span>Size</span>
            <input
              className="dashboard-text-size"
              type="number"
              min={8}
              max={72}
              value={item.textSize ?? 14}
              onChange={(e) => onChange({ textSize: Number(e.target.value) })}
              aria-label="Text size"
            />
          </label>
        </div>
        <div className="dashboard-text-ribbon-row dashboard-text-button-row">
          <button className={item.bold ? "active" : ""} type="button" onClick={() => onChange({ bold: !item.bold })} aria-label="Bold">B</button>
          <button className={item.italic ? "active ghost" : "ghost"} type="button" onClick={() => onChange({ italic: !item.italic })} aria-label="Italic"><i>I</i></button>
          <span className="dashboard-text-divider" />
          <button className={item.textAlign === "left" ? "active ghost" : "ghost"} type="button" onClick={() => onChange({ textAlign: "left" })} aria-label="Align left">≡</button>
          <button className={item.textAlign === "center" ? "active" : ""} type="button" onClick={() => onChange({ textAlign: "center" })} aria-label="Align center">≡</button>
          <button className={item.textAlign === "right" ? "active ghost" : "ghost"} type="button" onClick={() => onChange({ textAlign: "right" })} aria-label="Align right">≡</button>
          <span className="dashboard-text-divider" />
          <label className="dashboard-text-color-wrap" title="Text color">
            <span>A</span>
            <input
              className="dashboard-text-color"
              type="color"
              value={item.textColor ?? "#1f2937"}
              onChange={(e) => onChange({ textColor: e.target.value })}
              aria-label="Text color"
            />
          </label>
        </div>
      </div>
      <textarea
        className="dashboard-textarea"
        value={item.text ?? ""}
        onChange={(e) => onChange({ text: e.target.value })}
        onPointerDown={(e) => e.stopPropagation()}
        placeholder="Write a figure legend, note, caption, or methods detail..."
        style={{
          color: item.textColor ?? "#1f2937",
          fontSize: `${item.textSize ?? 14}px`,
          fontWeight: item.bold ? 800 : 400,
          fontStyle: item.italic ? "italic" : "normal",
          fontFamily: item.textFontFamily ?? "Helvetica",
          textAlign: item.textAlign ?? "left",
        }}
      />
      <div
        ref={measureRef}
        className="dashboard-text-measure"
        aria-hidden="true"
        style={{
          color: item.textColor ?? "#1f2937",
          fontSize: `${item.textSize ?? 14}px`,
          fontWeight: item.bold ? 800 : 400,
          fontStyle: item.italic ? "italic" : "normal",
          fontFamily: item.textFontFamily ?? "Helvetica",
          textAlign: item.textAlign ?? "left",
        }}
      >
        {(item.text ?? "") || " "}
      </div>
    </div>
  );
}

export function DashboardFilePanel({ item }: { item: DashboardItem }) {
  const mime = item.fileMime || "";
  const isPdf = mime === "application/pdf" || item.fileName?.toLowerCase().endsWith(".pdf");
  const isTiff = mime === "image/tiff" || /\.(tif|tiff)$/i.test(item.fileName || "");

  return (
    <div className="dashboard-file-panel">
      {isPdf ? (
        <object className="dashboard-file-object" data={item.fileDataUrl} type="application/pdf">
          <a href={item.fileDataUrl} download={item.fileName || "dashboard-file.pdf"}>{item.fileName || "Open PDF"}</a>
        </object>
      ) : (
        <>
          <img className="dashboard-file-image" src={item.fileDataUrl} alt={item.fileName || "Dashboard file"} draggable={false} />
          {isTiff && (
            <span className="dashboard-file-note">
              TIFF preview depends on the browser engine. If blank, export this file as PNG/JPEG.
            </span>
          )}
        </>
      )}
    </div>
  );
}

export function LiveSplitPanelCard({
  panel,
  selected,
  combined = false,
  onSelect,
  onMove,
  onResize,
  onCommit,
}: {
  panel: LiveSplitPanel;
  selected: boolean;
  combined?: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (w: number, h: number) => void;
  onCommit?: () => void;
}) {
  const dragRef = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; w: number; h: number } | null>(null);

  const startDrag = (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    const target = e.target as Element;
    if (target.closest("button, .live-split-resize-cue")) return;
    e.preventDefault();
    onSelect();
    dragRef.current = { startX: e.clientX, startY: e.clientY, x: panel.x, y: panel.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const moveDrag = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragRef.current) return;
    e.preventDefault();
    onMove(dragRef.current.x + e.clientX - dragRef.current.startX, dragRef.current.y + e.clientY - dragRef.current.startY);
  };

  const endDrag = () => {
    if (dragRef.current) onCommit?.();
    dragRef.current = null;
  };

  const startResize = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, w: panel.w, h: panel.h };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const moveResize = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!resizeRef.current) return;
    e.preventDefault();
    onResize(resizeRef.current.w + e.clientX - resizeRef.current.startX, resizeRef.current.h + e.clientY - resizeRef.current.startY);
  };

  const endResize = () => {
    if (resizeRef.current) onCommit?.();
    resizeRef.current = null;
  };

  return (
    <article
      className={`live-split-panel-card ${combined ? "hit-region" : ""} ${selected ? "selected" : ""}`}
      style={{ left: panel.x, top: panel.y, width: panel.w, height: panel.h }}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={onSelect}
      aria-label={`Split panel ${panel.title}`}
    >
      {!combined && (
        <div className="live-split-panel-head">
          <span className="dashboard-drag-grip" aria-hidden="true"><i /><i /><i /></span>
          <strong>{panel.title}</strong>
        </div>
      )}
      {!combined && <img src={`data:image/png;base64,${panel.data}`} alt={panel.title} draggable={false} />}
      <button
        className="live-split-resize-cue"
        type="button"
        aria-label={`Resize ${panel.title}`}
        onPointerDown={startResize}
        onPointerMove={moveResize}
        onPointerUp={endResize}
        onPointerCancel={endResize}
      />
    </article>
  );
}

export function DashboardGraphCard({
  item,
  zoom = 1,
  title,
  meta,
  onMove,
  onResize,
  onChange,
  onRemove,
  selected,
  onSelect,
  children,
}: {
  item: DashboardItem;
  zoom?: number;
  title: string;
  meta: string;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number) => void;
  onChange: (patch: Partial<DashboardItem>) => void;
  onRemove: () => void;
  selected?: boolean;
  onSelect?: (additive: boolean) => void;
  children: ReactNode;
}) {
  const dragRef = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; w: number; h: number } | null>(null);

  const startDrag = (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    const target = e.target as Element;
    if (target.closest("button, input, select, textarea, [contenteditable='true'], .dashboard-resize-cue")) return;
    e.preventDefault();
    onSelect?.(e.metaKey || e.ctrlKey || e.shiftKey);
    dragRef.current = { startX: e.clientX, startY: e.clientY, x: item.x, y: item.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const moveDrag = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    e.preventDefault();
    onMove(item.id, dragRef.current.x + dx / zoom, dragRef.current.y + dy / zoom);
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const startResize = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, w: item.w, h: item.h };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const moveResize = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!resizeRef.current) return;
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    onResize(item.id, resizeRef.current.w + dx / zoom, resizeRef.current.h + dy / zoom);
  };

  const endResize = () => {
    resizeRef.current = null;
  };

  return (
    <article
      className={`dashboard-floating-card ${item.kind === "text" ? "text-card" : ""} ${item.kind === "file" ? "file-card" : ""} ${selected ? "selected" : ""}`}
      style={{ left: item.x, top: item.y, width: item.w, height: item.h }}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {item.kind !== "text" && item.panelLabel && <span className="dashboard-panel-label">{item.panelLabel}</span>}
      <div className="dashboard-floating-head">
        <span className="dashboard-drag-grip" aria-hidden="true"><i /><i /><i /></span>
        <span className="dashboard-card-title">
          <strong>{title}</strong>
          <em>{meta}</em>
        </span>
        {item.kind !== "text" && (
          <span className="dashboard-panel-label-picker compact" onPointerDown={(e) => e.stopPropagation()} aria-label="Panel label">
            <select
              value={item.panelLabel || ""}
              onChange={(e) => onChange({ panelLabel: e.target.value })}
              title="Panel label"
              aria-label="Panel label"
            >
              <option value="">Label</option>
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
                <Fragment key={letter}>
                  <option value={letter}>{letter}</option>
                  <option value={`(${letter})`}>({letter})</option>
                  <option value={`${letter}.`}>{letter}.</option>
                </Fragment>
              ))}
            </select>
          </span>
        )}
        <button className="icon-mini-btn" onClick={onRemove} aria-label={`Remove ${title}`}>×</button>
      </div>
      <div className="dashboard-floating-body">{children}</div>
      <button
        className="dashboard-resize-cue"
        type="button"
        aria-label={`Resize ${title}`}
        onPointerDown={startResize}
        onPointerMove={moveResize}
        onPointerUp={endResize}
        onPointerCancel={endResize}
      />
    </article>
  );
}
