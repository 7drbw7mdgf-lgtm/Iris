import { useState, useEffect } from "react";

export function useChartPalette() {
  const [chartPaletteOpen, setChartPaletteOpen] = useState(false);
  const [chartTypeSearch, setChartTypeSearch] = useState("");
  const [galleryCategory, setGalleryCategory] = useState("All");
  const [hoveredChartId, setHoveredChartId] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setChartPaletteOpen(true);
      }
      if (e.key === "Escape") {
        setChartPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return {
    chartPaletteOpen,
    setChartPaletteOpen,
    chartTypeSearch,
    setChartTypeSearch,
    galleryCategory,
    setGalleryCategory,
    hoveredChartId,
    setHoveredChartId,
  };
}
