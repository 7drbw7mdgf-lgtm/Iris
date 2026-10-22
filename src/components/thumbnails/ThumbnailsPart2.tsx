import { GraphType } from "../../types";

export function ThumbnailsPart2({ type }: { type: GraphType }) {
  return (
    <>
      {/* 21. ROC & PR */}
      {(type === "roc" || type === "pr") && (
        <>
          <path className="thumb-axis" d="M16 8V38H104" />
          {type === "roc" && (
            <path d="M16 38L104 8" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3,2" fill="none" />
          )}
          {/* ROC / PR curve */}
          <path
            d={type === "roc" ? "M16 38 C 18 14, 34 8, 104 8" : "M16 10 C 60 10, 80 18, 104 38"}
            stroke="#1f77b4"
            strokeWidth="2.4"
            fill="none"
          />
        </>
      )}

      {/* 22. KAPLAN-MEIER & SURVIVAL CURVE */}
      {(type === "kaplanMeier" || type === "survivalCurve") && (
        <>
          <path className="thumb-axis" d="M14 8V38H106" />
          {/* Step curve from prob 1.0 down */}
          <path
            d="M14 11 H32 V15 H50 V21 H70 V28 H88 V34 H104"
            stroke="#1f77b4"
            strokeWidth="2.2"
            fill="none"
          />
          {/* Censored ticks */}
          <path d="M40 12V18 M60 18V24 M78 25V31" stroke="#dc2626" strokeWidth="1.5" />
        </>
      )}

      {/* 23. BAR */}
      {type === "bar" && (
        <>
          <path className="thumb-axis" d="M12 38H108" />
          <rect x="20" y="24" width="12" height="14" rx="1.5" fill="#1f77b4" />
          <rect x="40" y="16" width="12" height="22" rx="1.5" fill="#17bebb" />
          <rect x="60" y="10" width="12" height="28" rx="1.5" fill="#ffc914" />
          <rect x="80" y="20" width="12" height="18" rx="1.5" fill="#e4572e" />
        </>
      )}

      {/* 24. HISTOGRAM */}
      {type === "histogram" && (
        <>
          <path className="thumb-axis" d="M12 38H108" />
          {/* Contiguous touching bins */}
          <rect x="18" y="32" width="11" height="6" fill="#1f77b4" stroke="#fff" strokeWidth="0.8" />
          <rect x="29" y="24" width="11" height="14" fill="#1f77b4" stroke="#fff" strokeWidth="0.8" />
          <rect x="40" y="15" width="11" height="23" fill="#1f77b4" stroke="#fff" strokeWidth="0.8" />
          <rect x="51" y="9" width="11" height="29" fill="#1f77b4" stroke="#fff" strokeWidth="0.8" />
          <rect x="62" y="14" width="11" height="24" fill="#1f77b4" stroke="#fff" strokeWidth="0.8" />
          <rect x="73" y="22" width="11" height="16" fill="#1f77b4" stroke="#fff" strokeWidth="0.8" />
          <rect x="84" y="30" width="11" height="8" fill="#1f77b4" stroke="#fff" strokeWidth="0.8" />
        </>
      )}

      {/* 25. ERROR BAR */}
      {type === "errorBar" && (
        <>
          <path className="thumb-axis" d="M12 38H108" />
          {/* Bar 1 with error cap */}
          <rect x="22" y="24" width="16" height="14" rx="1" fill="#1f77b4" />
          <path d="M30 16V24 M26 16H34" stroke="currentColor" strokeWidth="1.6" />
          {/* Bar 2 with error cap */}
          <rect x="52" y="16" width="16" height="22" rx="1" fill="#17bebb" />
          <path d="M60 8V16 M56 8H64" stroke="currentColor" strokeWidth="1.6" />
          {/* Bar 3 with error cap */}
          <rect x="82" y="20" width="16" height="18" rx="1" fill="#ffc914" />
          <path d="M90 12V20 M86 12H94" stroke="currentColor" strokeWidth="1.6" />
        </>
      )}

      {/* 26. LOLLIPOP */}
      {type === "lollipop" && (
        <>
          <path className="thumb-axis" d="M12 38H108" />
          <path d="M26 38V24 M48 38V14 M70 38V20 M92 38V10" stroke="currentColor" strokeWidth="2" />
          <circle cx="26" cy="24" r="4" fill="#1f77b4" />
          <circle cx="48" cy="14" r="4" fill="#17bebb" />
          <circle cx="70" cy="20" r="4" fill="#ffc914" />
          <circle cx="92" cy="10" r="4" fill="#e4572e" />
        </>
      )}

      {/* 27. DOT PLOT */}
      {type === "dotPlot" && (
        <>
          <path className="thumb-axis" d="M12 38H108" />
          <path d="M14 14H106 M14 24H106 M14 34H106" stroke="currentColor" strokeWidth="1" strokeDasharray="2,3" opacity="0.35" />
          <circle cx="42" cy="14" r="3.5" fill="#1f77b4" /><circle cx="78" cy="14" r="3.5" fill="#17bebb" />
          <circle cx="56" cy="24" r="3.5" fill="#1f77b4" /><circle cx="90" cy="24" r="3.5" fill="#17bebb" />
          <circle cx="32" cy="34" r="3.5" fill="#1f77b4" /><circle cx="68" cy="34" r="3.5" fill="#17bebb" />
        </>
      )}

      {/* 28. AREA & STACKED AREA */}
      {(type === "area" || type === "stackedArea") && (
        <>
          <path className="thumb-axis" d="M12 38H108" />
          <path d="M14 38 L14 28 Q40 18 64 25 T106 14 L106 38 Z" fill="#1f77b4" opacity="0.6" />
          {type === "stackedArea" && (
            <path d="M14 28 Q40 18 64 25 T106 14 L106 8 Q75 16 50 10 T14 20 Z" fill="#17bebb" opacity="0.75" />
          )}
        </>
      )}

      {/* 29. STREAM */}
      {type === "stream" && (
        <>
          <path d="M14 24 C30 14, 50 32, 70 20 C85 12, 95 24, 106 18 L106 30 C95 36, 85 24, 70 32 C50 40, 30 26, 14 32 Z" fill="#1f77b4" opacity="0.75" />
          <path d="M14 32 C30 26, 50 40, 70 32 C85 24, 95 36, 106 30 L106 36 C95 40, 85 30, 70 38 C50 44, 30 32, 14 38 Z" fill="#17bebb" opacity="0.85" />
        </>
      )}

      {/* 30. PIE & DONUT */}
      {(type === "pie" || type === "donut") && (
        <>
          <circle className="thumb-donut" cx="60" cy="24" r="16" fill="#1f77b4" />
          <path d="M60 24 L60 8 A16 16 0 0 1 76 24 Z" fill="#17bebb" />
          <path d="M60 24 L76 24 A16 16 0 0 1 60 40 Z" fill="#ffc914" />
          {type === "donut" && <circle cx="60" cy="24" r="7.5" fill="#f4f8ff" className="thumb-bg-fill" />}
        </>
      )}

      {/* 31. CIRCULAR BAR */}
      {type === "circularBar" && (
        <>
          <circle cx="60" cy="24" r="6" fill="#f4f8ff" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
          {/* Radial bars */}
          <path d="M60 18V9" stroke="#1f77b4" strokeWidth="3" strokeLinecap="round" />
          <path d="M64 20L72 13" stroke="#17bebb" strokeWidth="3" strokeLinecap="round" />
          <path d="M66 24H76" stroke="#ffc914" strokeWidth="3" strokeLinecap="round" />
          <path d="M64 28L73 35" stroke="#e4572e" strokeWidth="3" strokeLinecap="round" />
          <path d="M60 30V39" stroke="#1f77b4" strokeWidth="3" strokeLinecap="round" />
          <path d="M56 28L47 35" stroke="#17bebb" strokeWidth="3" strokeLinecap="round" />
          <path d="M54 24H45" stroke="#ffc914" strokeWidth="3" strokeLinecap="round" />
          <path d="M56 20L48 13" stroke="#e4572e" strokeWidth="3" strokeLinecap="round" />
        </>
      )}

      {/* 32. TREEMAP */}
      {type === "treemap" && (
        <>
          <rect x="14" y="8" width="50" height="32" rx="2" fill="#1f77b4" opacity="0.85" />
          <rect x="68" y="8" width="38" height="18" rx="2" fill="#17bebb" opacity="0.85" />
          <rect x="68" y="28" width="20" height="12" rx="2" fill="#ffc914" opacity="0.85" />
          <rect x="90" y="28" width="16" height="12" rx="2" fill="#e4572e" opacity="0.85" />
        </>
      )}

      {/* 33. WAFFLE */}
      {type === "waffle" && (
        <>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((col) =>
            [0, 1, 2].map((row) => {
              const idx = row * 8 + col;
              const color = idx < 14 ? "#1f77b4" : idx < 20 ? "#17bebb" : "#ffc914";
              return (
                <rect
                  key={`${col}-${row}`}
                  x={16 + col * 11}
                  y={10 + row * 11}
                  width="8.5"
                  height="8.5"
                  rx="1.5"
                  fill={color}
                />
              );
            })
          )}
        </>
      )}

      {/* 34. HEATMAP */}
      {type === "heatmap" && (
        <>
          {[14, 38, 62, 86].map((x, i) =>
            [8, 21, 34].map((y, j) => {
              const colors = ["#1f77b4", "#17bebb", "#ffc914", "#e4572e"];
              const color = colors[(i * 2 + j) % colors.length];
              return (
                <rect
                  key={`${x}-${y}`}
                  x={x}
                  y={y}
                  width="20"
                  height="10"
                  rx="2"
                  fill={color}
                  opacity="0.85"
                />
              );
            })
          )}
        </>
      )}

      {/* 35. CORRELOGRAM */}
      {type === "correlogram" && (
        <>
          {[0, 1, 2, 3].map((i) =>
            [0, 1, 2, 3].map((j) => {
              const cx = 33 + i * 18;
              const cy = 11 + j * 9;
              const isDiag = i === j;
              const r = isDiag ? 4.5 : Math.abs(i - j) === 1 ? 3.5 : 2;
              const color = isDiag ? "#1f77b4" : (i + j) % 2 === 0 ? "#2563eb" : "#dc2626";
              return (
                <circle
                  key={`${i}-${j}`}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={color}
                  opacity={isDiag ? 0.9 : 0.7}
                />
              );
            })
          )}
        </>
      )}

      {/* 36. HEXBIN */}
      {type === "hexbin" && (
        <>
          {[0, 1, 2, 3].map((c) =>
            [0, 1, 2].map((r) => {
              const cx = 30 + c * 18 + (r % 2 === 1 ? 9 : 0);
              const cy = 14 + r * 10;
              const colors = ["#1f77b4", "#17bebb", "#ffc914", "#e4572e"];
              const fill = colors[(c + r) % colors.length];
              return (
                <polygon
                  key={`${c}-${r}`}
                  points={`${cx},${cy - 5} ${cx + 5},${cy - 2.5} ${cx + 5},${cy + 2.5} ${cx},${cy + 5} ${cx - 5},${cy + 2.5} ${cx - 5},${cy - 2.5}`}
                  fill={fill}
                  opacity="0.8"
                />
              );
            })
          )}
        </>
      )}

      {/* 37. DENSITY 2D */}
      {type === "density2d" && (
        <>
          <ellipse cx="60" cy="24" rx="36" ry="15" fill="none" stroke="#1f77b4" strokeWidth="1.2" opacity="0.4" />
          <ellipse cx="60" cy="24" rx="24" ry="10" fill="none" stroke="#1f77b4" strokeWidth="1.6" opacity="0.65" />
          <ellipse cx="60" cy="24" rx="12" ry="5" fill="#1f77b4" opacity="0.75" />
        </>
      )}

      {/* 38. SANKEY & ALLUVIAL */}
      {(type === "sankey" || type === "alluvial") && (
        <>
          {/* Left nodes */}
          <rect x="18" y="10" width="7" height="12" rx="1.5" fill="#1f77b4" />
          <rect x="18" y="26" width="7" height="12" rx="1.5" fill="#17bebb" />
          {/* Right nodes */}
          <rect x="95" y="8" width="7" height="16" rx="1.5" fill="#ffc914" />
          <rect x="95" y="28" width="7" height="10" rx="1.5" fill="#e4572e" />
          {/* Ribbons */}
          <path d="M25 12 C 55 12, 65 10, 95 10 L 95 18 C 65 18, 55 20, 25 20 Z" fill="#1f77b4" opacity="0.4" />
          <path d="M25 28 C 55 28, 65 30, 95 30 L 95 36 C 65 36, 55 38, 25 38 Z" fill="#17bebb" opacity="0.4" />
        </>
      )}

      {/* 39. CHORD */}
      {type === "chord" && (
        <>
          {/* Outer circle */}
          <circle cx="60" cy="24" r="16" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6,3" />
          {/* Inner ribbons */}
          <path d="M47 16 Q60 24 73 16" fill="none" stroke="#1f77b4" strokeWidth="2.5" opacity="0.7" />
          <path d="M47 32 Q60 24 73 32" fill="none" stroke="#17bebb" strokeWidth="2.5" opacity="0.7" />
          <path d="M44 24 Q60 24 76 24" fill="none" stroke="#e4572e" strokeWidth="2" opacity="0.7" />
        </>
      )}

      {/* 40. DENDROGRAM */}
      {type === "dendrogram" && (
        <>
          <path
            d="M20 24 H38 M38 14 V34 M38 14 H60 M38 34 H60 M60 9 V19 M60 29 V39 M60 9 H88 M60 19 H88 M60 29 H88 M60 39 H88"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
          />
          <circle cx="88" cy="9" r="2.2" fill="#1f77b4" />
          <circle cx="88" cy="19" r="2.2" fill="#17bebb" />
          <circle cx="88" cy="29" r="2.2" fill="#ffc914" />
          <circle cx="88" cy="39" r="2.2" fill="#e4572e" />
        </>
      )}

      {/* 41. UPSET */}
      {type === "upset" && (
        <>
          {/* Intersection bars */}
          <rect x="20" y="22" width="10" height="12" rx="1" fill="#1f77b4" />
          <rect x="36" y="14" width="10" height="20" rx="1" fill="#1f77b4" />
          <rect x="52" y="8" width="10" height="26" rx="1" fill="#1f77b4" />
          {/* Matrix dots */}
          <circle cx="78" cy="14" r="3" fill="#1e293b" /><circle cx="78" cy="24" r="3" fill="#1e293b" /><circle cx="78" cy="34" r="3" fill="#cbd5e1" />
          <path d="M78 14V24" stroke="#1e293b" strokeWidth="2" />
          <circle cx="94" cy="14" r="3" fill="#cbd5e1" /><circle cx="94" cy="24" r="3" fill="#1e293b" /><circle cx="94" cy="34" r="3" fill="#1e293b" />
          <path d="M94 24V34" stroke="#1e293b" strokeWidth="2" />
        </>
      )}

      {/* 42. RADAR */}
      {type === "radar" && (
        <>
          <polygon points="60,8 86,18 78,38 42,38 34,18" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
          <polygon points="60,14 78,21 72,33 48,33 42,21" fill="#1f77b4" opacity="0.5" stroke="#1f77b4" strokeWidth="1.8" />
        </>
      )}

      {/* 43. PARALLEL */}
      {type === "parallel" && (
        <>
          <path className="thumb-axis" d="M22 8V40 M47 8V40 M73 8V40 M98 8V40" strokeWidth="1.2" />
          <path d="M22 30 L47 18 L73 24 L98 12" stroke="#1f77b4" strokeWidth="2" fill="none" />
          <path d="M22 16 L47 28 L73 14 L98 25" stroke="#e4572e" strokeWidth="2" fill="none" />
        </>
      )}

      {/* 44. PCA, UMAP, TSNE */}
      {(type === "pca" || type === "umap" || type === "tsne") && (
        <>
          <path className="thumb-axis" d="M14 10V38H106" />
          {/* Cluster 1 (blue) */}
          <circle cx="35" cy="26" r="2.6" fill="#1f77b4" /><circle cx="42" cy="22" r="2.6" fill="#1f77b4" />
          <circle cx="38" cy="30" r="2.6" fill="#1f77b4" /><circle cx="48" cy="27" r="2.6" fill="#1f77b4" />
          {/* Cluster 2 (coral) */}
          <circle cx="75" cy="16" r="2.6" fill="#e4572e" /><circle cx="82" cy="12" r="2.6" fill="#e4572e" />
          <circle cx="78" cy="20" r="2.6" fill="#e4572e" /><circle cx="88" cy="16" r="2.6" fill="#e4572e" />
        </>
      )}

      {/* 45. TABLE */}
      {type === "table" && (
        <>
          <rect x="18" y="10" width="84" height="28" rx="2" fill="#fff" stroke="currentColor" strokeWidth="1.2" />
          <path d="M18 18H102 M18 28H102 M46 10V38 M74 10V38" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <rect x="18" y="10" width="84" height="8" fill="#eef3ff" />
        </>
      )}

      {/* 46. FACET */}
      {type === "facet" && (
        <>
          <rect x="16" y="8" width="40" height="14" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <rect x="64" y="8" width="40" height="14" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <rect x="16" y="26" width="40" height="14" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <rect x="64" y="26" width="40" height="14" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <circle cx="36" cy="15" r="2" fill="#1f77b4" /><circle cx="84" cy="15" r="2" fill="#17bebb" />
          <circle cx="36" cy="33" r="2" fill="#ffc914" /><circle cx="84" cy="33" r="2" fill="#e4572e" />
        </>
      )}
    </>
  );
}
