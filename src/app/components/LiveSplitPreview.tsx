import React, { Dispatch, SetStateAction } from "react";
import { PythonArtist } from "../../tauri";
import { LiveSplitPanel } from "../types";
import { hitPythonArtist } from "../../artistHit";
import { LiveSplitPanelCard } from "./DashboardCards";

export interface LiveSplitPreviewProps {
  graphId: string;
  panels: LiveSplitPanel[];
  compositeImage?: string | null;
  artists: PythonArtist[];
  selectedPythonArtist: { graphId: string; key: string } | null;
  hoveredPythonArtistKey: string | null;
  splitArtistBox: { left: number; top: number; width: number; height: number } | null;
  setHoveredPythonArtistKey: (key: string | null) => void;
  setSplitArtistBox: Dispatch<
    SetStateAction<{ left: number; top: number; width: number; height: number } | null>
  >;
  setSelectedPythonArtist: (artist: { graphId: string; key: string } | null) => void;
  selectedLiveSplitPanelId: string | null;
  setSelectedLiveSplitPanelId: (id: string | null) => void;
  setInspectorCollapsed: (collapsed: boolean) => void;
  moveLiveSplitPanel: (graphId: string, panelId: string, x: number, y: number) => void;
  resizeLiveSplitPanel: (graphId: string, panelId: string, w: number, h: number) => void;
  onCommit: () => void;
}

export function LiveSplitPreview(props: LiveSplitPreviewProps) {
  const {
    graphId,
    panels,
    compositeImage,
    artists,
    selectedPythonArtist,
    hoveredPythonArtistKey,
    splitArtistBox,
    setHoveredPythonArtistKey,
    setSplitArtistBox,
    setSelectedPythonArtist,
    selectedLiveSplitPanelId,
    setSelectedLiveSplitPanelId,
    setInspectorCollapsed,
    moveLiveSplitPanel,
    resizeLiveSplitPanel,
    onCommit,
  } = props;

  const pickArtist = (event: React.MouseEvent<HTMLDivElement>) => {
    const canvas = event.currentTarget;
    const image = canvas.querySelector<HTMLImageElement>(".live-split-composite-image");
    if (!image?.naturalWidth || !image.naturalHeight) return null;
    const imageRect = image.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const scale = Math.min(
      imageRect.width / image.naturalWidth,
      imageRect.height / image.naturalHeight
    );
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const left = imageRect.left + (imageRect.width - width) / 2;
    const top = imageRect.top + (imageRect.height - height) / 2;
    const artist = hitPythonArtist(
      artists,
      event.clientX - left,
      event.clientY - top,
      width,
      height
    );
    return {
      artist,
      box: { left: left - canvasRect.left, top: top - canvasRect.top, width, height },
    };
  };

  const activeArtistKey =
    hoveredPythonArtistKey ||
    (selectedPythonArtist?.graphId === graphId ? selectedPythonArtist.key : null);
  const activeArtist = artists.find((artist) => artist.key === activeArtistKey);
  const canvasSize = panels.reduce(
    (size, panel) => ({
      width: Math.max(size.width, panel.x + panel.w + 48),
      height: Math.max(size.height, panel.y + panel.h + 48),
    }),
    { width: 900, height: 560 }
  );

  return (
    <div className="live-split-preview" role="region" aria-label="Split live preview panels">
      <div
        className="live-split-canvas"
        style={{ width: canvasSize.width, minHeight: canvasSize.height }}
        onMouseMoveCapture={(event) => {
          const hit = pickArtist(event);
          setHoveredPythonArtistKey(hit?.artist?.key ?? null);
          if (hit?.artist)
            setSplitArtistBox((current) =>
              current &&
              current.left === hit.box.left &&
              current.top === hit.box.top &&
              current.width === hit.box.width &&
              current.height === hit.box.height
                ? current
                : hit.box
            );
        }}
        onMouseLeave={() => setHoveredPythonArtistKey(null)}
        onClickCapture={(event) => {
          if (
            event.button !== 0 ||
            (event.target as Element).closest(".live-split-resize-cue")
          )
            return;
          const hit = pickArtist(event);
          if (!hit?.artist) return;
          setSelectedPythonArtist({ graphId, key: hit.artist.key });
          setSelectedLiveSplitPanelId(
            panels.find((panel) => panel.axisIndex === hit.artist!.axisIndex)?.id ?? null
          );
          setSplitArtistBox(hit.box);
          setInspectorCollapsed(false);
          event.stopPropagation();
        }}
      >
        {compositeImage && (
          <img
            className="live-split-composite-image"
            src={`data:image/png;base64,${compositeImage}`}
            alt="Combined composite figure"
            draggable={false}
          />
        )}
        {activeArtist && splitArtistBox && (
          <svg
            className="live-split-artist-highlight raster-artist-highlight"
            style={splitArtistBox}
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {activeArtist.kind === "line" && activeArtist.points.length > 1 && (
              <polyline
                points={activeArtist.points
                  .map(([x, y]) => `${x * 1000},${y * 1000}`)
                  .join(" ")}
              />
            )}
            {activeArtist.kind === "collection" &&
              activeArtist.points.map(([x, y], index) => (
                <circle key={index} cx={x * 1000} cy={y * 1000} r="7" />
              ))}
            {activeArtist.bbox &&
              activeArtist.kind !== "line" &&
              activeArtist.kind !== "collection" && (
                <rect
                  x={activeArtist.bbox[0] * 1000}
                  y={activeArtist.bbox[1] * 1000}
                  width={activeArtist.bbox[2] * 1000}
                  height={activeArtist.bbox[3] * 1000}
                />
              )}
          </svg>
        )}
        {panels.map((panel) => (
          <LiveSplitPanelCard
            key={panel.id}
            panel={panel}
            combined={Boolean(compositeImage)}
            selected={selectedLiveSplitPanelId === panel.id}
            onSelect={() => {
              setSelectedLiveSplitPanelId(panel.id);
              setInspectorCollapsed(false);
            }}
            onMove={(x, y) => moveLiveSplitPanel(graphId, panel.id, x, y)}
            onResize={(w, h) => resizeLiveSplitPanel(graphId, panel.id, w, h)}
            onCommit={onCommit}
          />
        ))}
      </div>
    </div>
  );
}
