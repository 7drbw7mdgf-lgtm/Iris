import { GraphType } from "../../types";

export function ChartTypeMiniIcon({ type }: { type: GraphType }) {
  return (
    <svg
      className="chart-type-mini-icon"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      {type === "scatter" && (
        <>
          <circle cx="6" cy="16" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="18" cy="7" r="2" />
        </>
      )}
      {type === "bubble" && (
        <>
          <circle cx="7" cy="15" r="3" fill="#1f77b4" /><circle cx="16" cy="9" r="4.5" fill="#17bebb" />
        </>
      )}
      {type === "volcano" && (
        <>
          <path d="M4 19H20 M12 6V19" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1,1" fill="none" opacity="0.5" />
          <circle cx="6" cy="9" r="2" fill="#2563eb" />
          <circle cx="18" cy="9" r="2" fill="#dc2626" />
          <circle cx="12" cy="16" r="1.5" opacity="0.4" />
        </>
      )}
      {type === "forest" && (
        <>
          <path d="M12 3V21" stroke="#94a3b8" strokeWidth="1" strokeDasharray="1,1" fill="none" />
          <path d="M5 8H16 M8 13H19" stroke="currentColor" strokeWidth="1.4" fill="none" />
          <rect x="9" y="6.5" width="3" height="3" />
          <rect x="12" y="11.5" width="3.5" height="3.5" />
          <polygon points="9,18 12,16 15,18 12,20" fill="#dc2626" />
        </>
      )}
      {type === "manhattan" && (
        <>
          <path d="M3 8H21" stroke="#dc2626" strokeWidth="1" strokeDasharray="2,1" fill="none" />
          <circle cx="6" cy="16" r="1.5" fill="#1f77b4" /><circle cx="9" cy="14" r="1.5" fill="#0284c7" />
          <circle cx="13" cy="5" r="2" fill="#dc2626" />
          <circle cx="17" cy="15" r="1.5" fill="#1f77b4" /><circle cx="20" cy="13" r="1.5" fill="#0284c7" />
        </>
      )}
      {type === "blandAltman" && (
        <>
          <path d="M3 12H21" stroke="#1e293b" strokeWidth="1.2" strokeDasharray="2,1" fill="none" />
          <path d="M3 6H21 M3 18H21" stroke="#dc2626" strokeWidth="0.8" strokeDasharray="1,1" fill="none" />
          <circle cx="7" cy="11" r="1.5" /><circle cx="12" cy="13" r="1.5" /><circle cx="17" cy="10" r="1.5" />
        </>
      )}
      {type === "box" && (
        <>
          <path d="M12 3V7 M12 17V21 M9 3H15 M9 21H15" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <rect x="7" y="7" width="10" height="10" rx="1" fill="#1f77b4" opacity="0.4" stroke="#1f77b4" strokeWidth="1.2" />
          <path d="M7 12H17" stroke="#1f77b4" strokeWidth="1.6" />
        </>
      )}
      {type === "violin" && (
        <>
          <path d="M12 3 C6 8, 6 16, 12 21 C18 16, 18 8, 12 3 Z" fill="#1f77b4" opacity="0.4" stroke="#1f77b4" strokeWidth="1.2" />
          <circle cx="12" cy="12" r="1.5" fill="#fff" />
        </>
      )}
      {type === "beeswarm" && (
        <>
          <circle cx="12" cy="5" r="1.5" /><circle cx="9" cy="9" r="1.5" /><circle cx="15" cy="9" r="1.5" />
          <circle cx="7" cy="13" r="1.5" /><circle cx="12" cy="13" r="1.5" /><circle cx="17" cy="13" r="1.5" />
          <circle cx="10" cy="17" r="1.5" /><circle cx="14" cy="17" r="1.5" /><circle cx="12" cy="20" r="1.5" />
        </>
      )}
      {type === "strip" && (
        <>
          <circle cx="8" cy="6" r="1.5" /><circle cx="10" cy="11" r="1.5" /><circle cx="7" cy="16" r="1.5" />
          <circle cx="16" cy="8" r="1.5" /><circle cx="14" cy="13" r="1.5" /><circle cx="17" cy="18" r="1.5" />
        </>
      )}
      {type === "rug" && (
        <>
          <path d="M2 18H22" stroke="currentColor" strokeWidth="1.4" />
          <path d="M4 11V18 M6 11V18 M10 11V18 M13 11V18 M15 11V18 M19 11V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      {type === "ridgeline" && (
        <>
          <path d="M3 11 C8 11, 11 5, 15 5 C19 5, 20 11, 22 11" stroke="#1f77b4" strokeWidth="1.4" fill="none" />
          <path d="M3 16 C8 16, 12 10, 16 10 C20 10, 21 16, 22 16" stroke="#17bebb" strokeWidth="1.4" fill="none" />
          <path d="M3 21 C8 21, 13 15, 17 15 C20 15, 21 21, 22 21" stroke="#ffc914" strokeWidth="1.4" fill="none" />
        </>
      )}
      {type === "density" && (
        <path d="M3 19 C8 19, 10 5, 13 5 C16 5, 18 19, 21 19 Z" fill="#1f77b4" opacity="0.4" stroke="#1f77b4" strokeWidth="1.4" />
      )}
      {type === "ecdf" && (
        <path d="M3 19 H7 V15 H12 V10 H17 V6 H21" stroke="#1f77b4" strokeWidth="1.8" fill="none" />
      )}
      {type === "qq" && (
        <>
          <path d="M4 20L20 4" stroke="#dc2626" strokeWidth="1.2" strokeDasharray="2,1" fill="none" />
          <circle cx="6" cy="18" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="18" cy="6" r="1.5" />
        </>
      )}
      {(type === "line" || type === "timeSeries") && (
        <path d="M3 17L8 12L13 14L21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      )}
      {type === "connected" && (
        <>
          <path d="M4 17L9 9L15 15L20 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="4" cy="17" r="2" fill="#1f77b4" /><circle cx="9" cy="9" r="2" fill="#1f77b4" />
          <circle cx="15" cy="15" r="2" fill="#1f77b4" /><circle cx="20" cy="8" r="2" fill="#1f77b4" />
        </>
      )}
      {type === "smooth" && (
        <path d="M3 18 C8 12, 16 16, 21 6" stroke="#1f77b4" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      )}
      {type === "slope" && (
        <>
          <path d="M6 4V20 M18 4V20" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
          <path d="M6 16L18 8" stroke="#1f77b4" strokeWidth="1.8" />
          <path d="M6 9L18 14" stroke="#e4572e" strokeWidth="1.8" />
        </>
      )}
      {type === "step" && (
        <path d="M3 18H9V12H15V6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      )}
      {(type === "roc" || type === "pr") && (
        <>
          <path d="M3 3V21H21" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M3 21 C 4 9, 9 3, 21 3" stroke="#1f77b4" strokeWidth="2" fill="none" />
        </>
      )}
      {(type === "kaplanMeier" || type === "survivalCurve") && (
        <>
          <path d="M3 4H8V8H13V13H18V18H21" stroke="#1f77b4" strokeWidth="2" fill="none" />
          <path d="M10 7V10 M15 12V15" stroke="#dc2626" strokeWidth="1.2" />
        </>
      )}
      {type === "bar" && (
        <>
          <rect x="3" y="12" width="4" height="9" rx="0.5" fill="#1f77b4" />
          <rect x="10" y="7" width="4" height="14" rx="0.5" fill="#17bebb" />
          <rect x="17" y="4" width="4" height="17" rx="0.5" fill="#ffc914" />
        </>
      )}
      {type === "histogram" && (
        <>
          <rect x="3" y="14" width="3.5" height="7" fill="#1f77b4" />
          <rect x="6.5" y="8" width="3.5" height="13" fill="#1f77b4" />
          <rect x="10" y="4" width="3.5" height="17" fill="#1f77b4" />
          <rect x="13.5" y="9" width="3.5" height="12" fill="#1f77b4" />
          <rect x="17" y="15" width="3.5" height="6" fill="#1f77b4" />
        </>
      )}
      {type === "errorBar" && (
        <>
          <rect x="4" y="12" width="6" height="9" fill="#1f77b4" />
          <path d="M7 6V12 M5 6H9" stroke="currentColor" strokeWidth="1.4" />
          <rect x="14" y="8" width="6" height="13" fill="#17bebb" />
          <path d="M17 3V8 M15 3H19" stroke="currentColor" strokeWidth="1.4" />
        </>
      )}
      {type === "lollipop" && (
        <>
          <path d="M6 21V12 M12 21V6 M18 21V10" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="6" cy="11" r="2.5" fill="#1f77b4" />
          <circle cx="12" cy="5" r="2.5" fill="#17bebb" />
          <circle cx="18" cy="9" r="2.5" fill="#ffc914" />
        </>
      )}
      {type === "dotPlot" && (
        <>
          <circle cx="8" cy="7" r="2" fill="#1f77b4" /><circle cx="16" cy="7" r="2" fill="#17bebb" />
          <circle cx="11" cy="14" r="2" fill="#1f77b4" /><circle cx="19" cy="14" r="2" fill="#17bebb" />
        </>
      )}
      {(type === "area" || type === "stackedArea" || type === "stream") && (
        <path d="M3 20 L3 13 Q8 8 13 12 T21 6 L21 20 Z" fill="#1f77b4" opacity="0.6" />
      )}
      {(type === "pie" || type === "donut") && (
        <>
          <circle cx="12" cy="12" r="9" fill="#1f77b4" />
          <path d="M12 12 L12 3 A9 9 0 0 1 21 12 Z" fill="#17bebb" />
          {type === "donut" && <circle cx="12" cy="12" r="4.5" fill="#fff" />}
        </>
      )}
      {type === "circularBar" && (
        <>
          <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <path d="M12 8.5V4 M14.5 10L18 7 M15.5 12H20 M14.5 14L18 17 M12 15.5V20 M9.5 14L6 17" stroke="#1f77b4" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
      {type === "treemap" && (
        <>
          <rect x="3" y="3" width="10" height="18" fill="#1f77b4" />
          <rect x="14" y="3" width="7" height="10" fill="#17bebb" />
          <rect x="14" y="14" width="7" height="7" fill="#ffc914" />
        </>
      )}
      {type === "waffle" && (
        <>
          {[0, 1, 2].map((c) =>
            [0, 1, 2].map((r) => (
              <rect
                key={`${c}-${r}`}
                x={4 + c * 6}
                y={4 + r * 6}
                width="4.5"
                height="4.5"
                rx="0.8"
                fill={(c + r) % 2 === 0 ? "#1f77b4" : "#17bebb"}
              />
            ))
          )}
        </>
      )}
      {type === "heatmap" && (
        <>
          <rect x="3" y="3" width="8" height="8" fill="#1f77b4" />
          <rect x="13" y="3" width="8" height="8" fill="#17bebb" />
          <rect x="3" y="13" width="8" height="8" fill="#ffc914" />
          <rect x="13" y="13" width="8" height="8" fill="#e4572e" />
        </>
      )}
      {type === "correlogram" && (
        <>
          <circle cx="6" cy="6" r="3" fill="#1f77b4" />
          <circle cx="18" cy="6" r="2" fill="#dc2626" />
          <circle cx="6" cy="18" r="2" fill="#2563eb" />
          <circle cx="18" cy="18" r="3" fill="#1f77b4" />
        </>
      )}
      {type === "hexbin" && (
        <polygon points="12,3 19,7 19,17 12,21 5,17 5,7" fill="#1f77b4" opacity="0.8" />
      )}
      {type === "density2d" && (
        <>
          <ellipse cx="12" cy="12" rx="9" ry="6" fill="none" stroke="#1f77b4" strokeWidth="1.2" opacity="0.5" />
          <ellipse cx="12" cy="12" rx="4.5" ry="3" fill="#1f77b4" opacity="0.8" />
        </>
      )}
      {(type === "sankey" || type === "alluvial") && (
        <>
          <rect x="3" y="5" width="2.5" height="6" fill="#1f77b4" />
          <rect x="3" y="13" width="2.5" height="6" fill="#17bebb" />
          <rect x="18.5" y="4" width="2.5" height="8" fill="#ffc914" />
          <rect x="18.5" y="14" width="2.5" height="6" fill="#e4572e" />
          <path d="M5.5 8 C12 8, 12 6, 18.5 6" stroke="#1f77b4" strokeWidth="2.5" fill="none" opacity="0.5" />
          <path d="M5.5 16 C12 16, 12 17, 18.5 17" stroke="#17bebb" strokeWidth="2.5" fill="none" opacity="0.5" />
        </>
      )}
      {type === "chord" && (
        <>
          <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3,2" />
          <path d="M6 8 Q12 12 18 8" stroke="#1f77b4" strokeWidth="1.8" fill="none" />
          <path d="M6 16 Q12 12 18 16" stroke="#17bebb" strokeWidth="1.8" fill="none" />
        </>
      )}
      {type === "dendrogram" && (
        <path d="M4 12H9 M9 6V18 M9 6H19 M9 18H19" stroke="currentColor" strokeWidth="1.5" fill="none" />
      )}
      {type === "upset" && (
        <>
          <rect x="4" y="9" width="3" height="8" fill="#1f77b4" />
          <rect x="9" y="5" width="3" height="12" fill="#1f77b4" />
          <circle cx="16" cy="7" r="1.8" fill="#1e293b" /><circle cx="16" cy="13" r="1.8" fill="#1e293b" />
          <path d="M16 7V13" stroke="#1e293b" strokeWidth="1.2" />
        </>
      )}
      {type === "radar" && (
        <polygon points="12,3 20,8 17,19 7,19 4,8" fill="#1f77b4" opacity="0.5" stroke="#1f77b4" strokeWidth="1.2" />
      )}
      {type === "parallel" && (
        <>
          <path d="M5 3V21 M12 3V21 M19 3V21" stroke="currentColor" strokeWidth="1" opacity="0.35" />
          <path d="M5 16L12 8L19 13" stroke="#1f77b4" strokeWidth="1.8" fill="none" />
        </>
      )}
      {(type === "pca" || type === "umap" || type === "tsne") && (
        <>
          <circle cx="7" cy="14" r="2" fill="#1f77b4" /><circle cx="10" cy="16" r="2" fill="#1f77b4" />
          <circle cx="15" cy="8" r="2" fill="#e4572e" /><circle cx="18" cy="10" r="2" fill="#e4572e" />
        </>
      )}
      {type === "table" && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="1" fill="#fff" stroke="currentColor" strokeWidth="1" />
          <path d="M3 9H21 M10 4V20" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
        </>
      )}
      {type === "facet" && (
        <>
          <rect x="3" y="3" width="7" height="7" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
          <rect x="14" y="3" width="7" height="7" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
          <rect x="3" y="14" width="7" height="7" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
          <rect x="14" y="14" width="7" height="7" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
        </>
      )}
    </svg>
  );
}

