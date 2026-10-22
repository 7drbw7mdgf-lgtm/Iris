import { useState, useRef, useEffect } from "react";
import Plotly from "plotly.js-dist-min";
import { GuideKind, plotFeatureFromTarget } from "./plotPreviewHelpers";
import type { PythonArtist } from "../../tauri";
import { hitPythonArtist } from "../../artistHit";

export function usePlotPreviewInteraction({
  mode,
  compact,
  ggplotImage,
  pythonImage,
  ref,
  artistRegions,
  onHoverArtist,
  onHoverFeature,
  linkedFeature,
}: {
  mode: "live" | "ggplot" | "python";
  compact?: boolean;
  ggplotImage: string | null;
  pythonImage: string | null;
  ref: React.RefObject<HTMLDivElement | null>;
  artistRegions: PythonArtist[];
  onHoverArtist?: (key: string | null) => void;
  onHoverFeature?: (feature: string | null) => void;
  linkedFeature?: string | null;
}) {
  const [zoom, setZoom] = useState(1);
  const [guide, setGuide] = useState<GuideKind>("none");
  const [toast, setToast] = useState<string | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistanceRef = useRef<number | null>(null);

  const clampZoom = (value: number) => Math.min(4, Math.max(0.5, value));
  const cycleGuide = () => {
    const list: GuideKind[] = ["none", "single", "oneandhalf", "double", "slide"];
    const idx = list.indexOf(guide);
    setGuide(list[(idx + 1) % list.length]);
  };

  const copyHighResImage = async () => {
    try {
      let blob: Blob | null = null;
      if (mode === "live" && ref.current) {
        const url = await (Plotly as any).toImage(ref.current, {
          format: "png",
          width: 2400,
          height: 1800,
        });
        const res = await fetch(url);
        blob = await res.blob();
      } else if (mode === "ggplot" && ggplotImage) {
        const res = await fetch(`data:image/png;base64,${ggplotImage}`);
        blob = await res.blob();
      } else if (mode === "python" && pythonImage) {
        const res = await fetch(`data:image/png;base64,${pythonImage}`);
        blob = await res.blob();
      }
      if (blob && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setToast("Copied 300 DPI image to clipboard");
        setTimeout(() => setToast(null), 2500);
      } else {
        setToast("Clipboard image copy not available");
        setTimeout(() => setToast(null), 2500);
      }
    } catch (err) {
      console.error("Failed to copy image", err);
      setToast("Failed to copy image to clipboard");
      setTimeout(() => setToast(null), 2500);
    }
  };

  const distanceBetweenPointers = () => {
    const points = Array.from(pointersRef.current.values());
    if (points.length < 2) return null;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  };

  const handlePreviewWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (compact) return;
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.002);
    setZoom((value) => clampZoom(value * factor));
  };

  const handlePreviewPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (compact) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      pinchDistanceRef.current = distanceBetweenPointers();
      e.preventDefault();
    }
  };

  const handlePreviewPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (compact) return;
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const nextDistance = distanceBetweenPointers();
    if (!nextDistance || !pinchDistanceRef.current) return;
    setZoom((value) => clampZoom(value * (nextDistance / pinchDistanceRef.current!)));
    pinchDistanceRef.current = nextDistance;
    e.preventDefault();
  };

  const handlePreviewPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchDistanceRef.current = null;
  };

  const handlePreviewMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest(".raster-figure")) return;
    onHoverFeature?.(plotFeatureFromTarget(e.target));
  };

  const artistAtImage = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return hitPythonArtist(artistRegions, e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
  };

  const hoverImageArtist = (e: React.MouseEvent<HTMLImageElement>) => {
    const artist = artistAtImage(e);
    onHoverArtist?.(artist?.key ?? null);
    onHoverFeature?.(
      artist?.kind === "title"
        ? "title"
        : artist?.kind === "legend"
        ? "legend"
        : artist?.kind === "xlabel"
        ? "x-axis"
        : artist?.kind === "ylabel"
        ? "y-axis"
        : artist
        ? "trace"
        : null
    );
  };

  const previewInteractionProps = {
    onMouseMove: handlePreviewMouseMove,
    onMouseLeave: () => onHoverFeature?.(null),
    "data-linked-feature": linkedFeature || undefined,
  };

  useEffect(() => {
    setZoom(1);
    pointersRef.current.clear();
    pinchDistanceRef.current = null;
  }, [mode, ggplotImage, pythonImage]);

  return {
    zoom,
    setZoom,
    clampZoom,
    guide,
    cycleGuide,
    toast,
    handlePreviewWheel,
    handlePreviewPointerDown,
    handlePreviewPointerMove,
    handlePreviewPointerEnd,
    hoverImageArtist,
    artistAtImage,
    previewInteractionProps,
    copyHighResImage,
  };
}
