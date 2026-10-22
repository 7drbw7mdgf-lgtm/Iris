import { GraphType } from "../../types";

export function ThumbnailsPart1({ type }: { type: GraphType }) {
  return (
    <>
      {/* 1. SCATTER */}
      {type === "scatter" && (
        <>
          <path className="thumb-axis" d="M14 38H106" />
          <circle cx="20" cy="30" r="2.5" /><circle cx="32" cy="27" r="2.5" />
          <circle cx="44" cy="20" r="2.5" /><circle cx="56" cy="25" r="2.5" />
          <circle cx="68" cy="15" r="2.5" /><circle cx="80" cy="19" r="2.5" />
          <circle cx="94" cy="11" r="2.5" /><circle cx="102" cy="24" r="2.5" />
        </>
      )}

      {/* 2. BUBBLE */}
      {type === "bubble" && (
        <>
          <path className="thumb-axis" d="M14 38H106" />
          <circle cx="24" cy="27" r="4" opacity="0.75" />
          <circle cx="45" cy="18" r="8" opacity="0.65" fill="#1f77b4" />
          <circle cx="68" cy="25" r="5.5" opacity="0.75" fill="#17bebb" />
          <circle cx="90" cy="15" r="9.5" opacity="0.65" fill="#ffc914" />
          <circle cx="102" cy="30" r="3.5" opacity="0.75" />
        </>
      )}

      {/* 3. VOLCANO */}
      {type === "volcano" && (
        <>
          <path className="thumb-axis" d="M14 38H106" />
          {/* Threshold lines: FC left/right, and p-value horizontal */}
          <path className="thumb-axis" d="M46 10V38 M74 10V38" strokeDasharray="2,2" opacity="0.45" />
          <path className="thumb-axis" d="M14 23H106" strokeDasharray="2,2" opacity="0.45" />
          {/* Inactive central points */}
          <circle cx="53" cy="32" r="1.8" opacity="0.4" />
          <circle cx="60" cy="28" r="1.8" opacity="0.4" />
          <circle cx="67" cy="34" r="1.8" opacity="0.4" />
          <circle cx="56" cy="25" r="1.8" opacity="0.4" />
          <circle cx="64" cy="24" r="1.8" opacity="0.4" />
          {/* Down-regulated points (blue, top-left) */}
          <circle cx="28" cy="15" r="2.4" fill="#2563eb" />
          <circle cx="36" cy="18" r="2.4" fill="#2563eb" />
          <circle cx="22" cy="13" r="2.2" fill="#2563eb" />
          {/* Up-regulated points (red, top-right) */}
          <circle cx="84" cy="17" r="2.4" fill="#dc2626" />
          <circle cx="92" cy="12" r="2.4" fill="#dc2626" />
          <circle cx="98" cy="16" r="2.2" fill="#dc2626" />
        </>
      )}

      {/* 4. FOREST */}
      {type === "forest" && (
        <>
          {/* Vertical null reference line */}
          <path className="thumb-axis" d="M54 7V41" strokeDasharray="2,2" stroke="#94a3b8" />
          {/* Study 1 */}
          <path className="thumb-line" d="M30 13H70" strokeWidth="1.6" />
          <rect x="44" y="11" width="5" height="5" rx="0.5" fill="currentColor" />
          {/* Study 2 */}
          <path className="thumb-line" d="M38 21H84" strokeWidth="1.6" />
          <rect x="58" y="19" width="6" height="6" rx="0.5" fill="currentColor" />
          {/* Study 3 */}
          <path className="thumb-line" d="M22 29H58" strokeWidth="1.6" />
          <rect x="36" y="27" width="5" height="5" rx="0.5" fill="currentColor" />
          {/* Overall summary diamond */}
          <polygon points="44,38 52,35 60,38 52,41" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
        </>
      )}

      {/* 5. MANHATTAN */}
      {type === "manhattan" && (
        <>
          <path className="thumb-axis" d="M12 38H108" />
          {/* Significance cutoffs */}
          <path d="M12 16H108" stroke="#dc2626" strokeWidth="1.2" strokeDasharray="3,2" fill="none" />
          <path d="M12 24H108" stroke="#2563eb" strokeWidth="1.0" strokeDasharray="1,2" fill="none" opacity="0.6" />
          {/* Chromosome columns */}
          {/* Chr 1 */}
          <circle cx="18" cy="34" r="1.5" fill="#1f77b4" /><circle cx="23" cy="29" r="1.5" fill="#1f77b4" />
          <circle cx="28" cy="33" r="1.5" fill="#1f77b4" /><circle cx="33" cy="27" r="1.5" fill="#1f77b4" />
          {/* Chr 2 */}
          <circle cx="42" cy="35" r="1.5" fill="#0284c7" /><circle cx="47" cy="26" r="1.5" fill="#0284c7" />
          <circle cx="52" cy="31" r="1.5" fill="#0284c7" /><circle cx="57" cy="28" r="1.5" fill="#0284c7" />
          {/* Chr 3 with significant hit */}
          <circle cx="66" cy="33" r="1.5" fill="#1f77b4" /><circle cx="71" cy="26" r="1.5" fill="#1f77b4" />
          <circle cx="74" cy="19" r="1.8" fill="#1f77b4" />
          <circle cx="75" cy="10" r="2.6" fill="#dc2626" /> {/* Significant GWAS Peak! */}
          <circle cx="78" cy="29" r="1.5" fill="#1f77b4" />
          {/* Chr 4 */}
          <circle cx="88" cy="34" r="1.5" fill="#0284c7" /><circle cx="94" cy="30" r="1.5" fill="#0284c7" />
          <circle cx="100" cy="32" r="1.5" fill="#0284c7" />
        </>
      )}

      {/* 6. BLAND-ALTMAN */}
      {type === "blandAltman" && (
        <>
          {/* Agreement band */}
          <rect x="14" y="14" width="92" height="20" fill="rgba(37,99,235,0.09)" rx="2" />
          {/* Mean line */}
          <path d="M14 24H106" stroke="#1e293b" strokeWidth="1.4" strokeDasharray="3,2" fill="none" />
          {/* +1.96 SD line */}
          <path d="M14 14H106" stroke="#dc2626" strokeWidth="1.2" strokeDasharray="2,2" fill="none" />
          {/* -1.96 SD line */}
          <path d="M14 34H106" stroke="#dc2626" strokeWidth="1.2" strokeDasharray="2,2" fill="none" />
          {/* Points */}
          <circle cx="26" cy="23" r="2" /><circle cx="38" cy="19" r="2" />
          <circle cx="48" cy="26" r="2" /><circle cx="62" cy="24" r="2" />
          <circle cx="74" cy="28" r="2" /><circle cx="86" cy="21" r="2" /><circle cx="96" cy="25" r="2" />
        </>
      )}

      {/* 7. BOX */}
      {type === "box" && (
        <>
          <path className="thumb-axis" d="M12 40H108" />
          {/* Box 1 */}
          <path className="thumb-axis" d="M36 10V16 M36 30V36 M30 10H42 M30 36H42" />
          <rect x="25" y="16" width="22" height="14" rx="1.5" fill="#1f77b4" opacity="0.3" stroke="#1f77b4" strokeWidth="1.6" />
          <path d="M25 22H47" stroke="#1f77b4" strokeWidth="2" />
          {/* Box 2 with outlier */}
          <circle cx="84" cy="7" r="1.8" fill="#17bebb" />
          <path className="thumb-axis" d="M84 13V18 M84 32V37 M78 13H90 M78 37H90" />
          <rect x="73" y="18" width="22" height="14" rx="1.5" fill="#17bebb" opacity="0.3" stroke="#17bebb" strokeWidth="1.6" />
          <path d="M73 26H95" stroke="#17bebb" strokeWidth="2" />
        </>
      )}

      {/* 8. VIOLIN */}
      {type === "violin" && (
        <>
          <path className="thumb-axis" d="M12 40H108" />
          {/* Violin 1 */}
          <path
            d="M36 9 C22 17, 22 28, 36 37 C50 28, 50 17, 36 9 Z"
            fill="#1f77b4"
            opacity="0.35"
            stroke="#1f77b4"
            strokeWidth="1.5"
          />
          <rect x="34.5" y="19" width="3" height="8" rx="0.5" fill="#1e293b" />
          <circle cx="36" cy="23" r="1.6" fill="#ffffff" />
          {/* Violin 2 */}
          <path
            d="M84 11 C71 16, 71 27, 84 37 C97 27, 97 16, 84 11 Z"
            fill="#17bebb"
            opacity="0.35"
            stroke="#17bebb"
            strokeWidth="1.5"
          />
          <rect x="82.5" y="20" width="3" height="8" rx="0.5" fill="#1e293b" />
          <circle cx="84" cy="24" r="1.6" fill="#ffffff" />
        </>
      )}

      {/* 9. BEESWARM */}
      {type === "beeswarm" && (
        <>
          <path className="thumb-axis" d="M12 40H108" />
          {/* Swarm 1: expands at median */}
          <circle cx="38" cy="11" r="2.2" fill="#1f77b4" />
          <circle cx="34" cy="16" r="2.2" fill="#1f77b4" /><circle cx="42" cy="16" r="2.2" fill="#1f77b4" />
          <circle cx="29" cy="22" r="2.2" fill="#1f77b4" /><circle cx="35" cy="22" r="2.2" fill="#1f77b4" /><circle cx="41" cy="22" r="2.2" fill="#1f77b4" /><circle cx="47" cy="22" r="2.2" fill="#1f77b4" />
          <circle cx="33" cy="28" r="2.2" fill="#1f77b4" /><circle cx="43" cy="28" r="2.2" fill="#1f77b4" />
          <circle cx="38" cy="34" r="2.2" fill="#1f77b4" />
          {/* Swarm 2 */}
          <circle cx="82" cy="14" r="2.2" fill="#17bebb" />
          <circle cx="77" cy="19" r="2.2" fill="#17bebb" /><circle cx="87" cy="19" r="2.2" fill="#17bebb" />
          <circle cx="72" cy="25" r="2.2" fill="#17bebb" /><circle cx="79" cy="25" r="2.2" fill="#17bebb" /><circle cx="85" cy="25" r="2.2" fill="#17bebb" /><circle cx="92" cy="25" r="2.2" fill="#17bebb" />
          <circle cx="82" cy="32" r="2.2" fill="#17bebb" />
        </>
      )}

      {/* 10. STRIP */}
      {type === "strip" && (
        <>
          <path className="thumb-axis" d="M12 40H108" />
          {/* Jittered points on column 1 */}
          <circle cx="35" cy="13" r="2" fill="#1f77b4" /><circle cx="39" cy="17" r="2" fill="#1f77b4" />
          <circle cx="33" cy="22" r="2" fill="#1f77b4" /><circle cx="38" cy="25" r="2" fill="#1f77b4" />
          <circle cx="34" cy="31" r="2" fill="#1f77b4" /><circle cx="37" cy="35" r="2" fill="#1f77b4" />
          {/* Jittered points on column 2 */}
          <circle cx="81" cy="15" r="2" fill="#17bebb" /><circle cx="85" cy="19" r="2" fill="#17bebb" />
          <circle cx="80" cy="24" r="2" fill="#17bebb" /><circle cx="84" cy="28" r="2" fill="#17bebb" />
          <circle cx="82" cy="33" r="2" fill="#17bebb" />
        </>
      )}

      {/* 11. RUG */}
      {type === "rug" && (
        <>
          <path className="thumb-axis" d="M12 36H108" strokeWidth="1.6" />
          <path
            d="M18 24V36 M22 24V36 M25 24V36 M34 24V36 M42 24V36 M45 24V36 M48 24V36 M58 24V36 M66 24V36 M70 24V36 M73 24V36 M82 24V36 M92 24V36 M95 24V36 M103 24V36"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      )}

      {/* 12. RIDGELINE */}
      {type === "ridgeline" && (
        <>
          {/* Ridge 1 (top) */}
          <path d="M15 21 C30 21, 40 10, 52 10 C65 10, 75 21, 105 21 Z" fill="#1f77b4" opacity="0.45" stroke="#1f77b4" strokeWidth="1.5" />
          {/* Ridge 2 (middle) */}
          <path d="M15 30 C35 30, 48 18, 62 18 C78 18, 88 30, 105 30 Z" fill="#17bebb" opacity="0.45" stroke="#17bebb" strokeWidth="1.5" />
          {/* Ridge 3 (bottom) */}
          <path d="M15 39 C42 39, 56 27, 72 27 C88 27, 96 39, 105 39 Z" fill="#ffc914" opacity="0.45" stroke="#ffc914" strokeWidth="1.5" />
        </>
      )}

      {/* 13. DENSITY */}
      {type === "density" && (
        <>
          <path className="thumb-axis" d="M12 38H108" />
          <path d="M14 38 C32 38, 42 12, 60 12 C78 12, 88 38, 106 38 Z" fill="#1f77b4" opacity="0.3" stroke="#1f77b4" strokeWidth="2" />
        </>
      )}

      {/* 14. ECDF */}
      {type === "ecdf" && (
        <>
          <path className="thumb-axis" d="M14 38H106" />
          <path className="thumb-axis" d="M14 10V38" />
          <path
            d="M14 38 H28 V34 H42 V28 H58 V21 H74 V15 H90 V10 H106"
            stroke="#1f77b4"
            strokeWidth="2.2"
            fill="none"
          />
        </>
      )}

      {/* 15. QQ */}
      {type === "qq" && (
        <>
          <path className="thumb-axis" d="M14 10V38H106" />
          {/* 45-degree diagonal reference */}
          <path d="M18 36L102 12" stroke="#dc2626" strokeWidth="1.4" strokeDasharray="3,2" fill="none" />
          {/* Quantile points hugging center, deviating at tails */}
          <circle cx="22" cy="35" r="2.2" fill="#1f77b4" />
          <circle cx="34" cy="30" r="2.2" fill="#1f77b4" />
          <circle cx="46" cy="26" r="2.2" fill="#1f77b4" />
          <circle cx="60" cy="22" r="2.2" fill="#1f77b4" />
          <circle cx="74" cy="18" r="2.2" fill="#1f77b4" />
          <circle cx="86" cy="14" r="2.2" fill="#1f77b4" />
          <circle cx="98" cy="9" r="2.2" fill="#1f77b4" />
        </>
      )}

      {/* 16. LINE & TIME SERIES */}
      {(type === "line" || type === "timeSeries") && (
        <>
          <path className="thumb-axis" d="M12 38H108" />
          <path className="thumb-line" d="M14 33L32 26L48 29L64 19L80 22L102 11" strokeWidth="2.2" />
          <circle cx="32" cy="26" r="2.4" /><circle cx="64" cy="19" r="2.4" /><circle cx="102" cy="11" r="2.4" />
        </>
      )}

      {/* 17. CONNECTED */}
      {type === "connected" && (
        <>
          <path className="thumb-axis" d="M12 38H108" />
          <path className="thumb-line" d="M18 32L34 16L54 28L76 14L98 22" strokeWidth="2" />
          <circle cx="18" cy="32" r="3" fill="#1f77b4" />
          <circle cx="34" cy="16" r="3" fill="#1f77b4" />
          <circle cx="54" cy="28" r="3" fill="#1f77b4" />
          <circle cx="76" cy="14" r="3" fill="#1f77b4" />
          <circle cx="98" cy="22" r="3" fill="#1f77b4" />
        </>
      )}

      {/* 18. SMOOTH */}
      {type === "smooth" && (
        <>
          <path className="thumb-axis" d="M12 38H108" />
          {/* Confidence ribbon */}
          <path d="M14 32 C35 24, 65 30, 106 14 L106 20 C65 36, 35 30, 14 38 Z" fill="rgba(31,119,180,0.2)" />
          {/* Spline line */}
          <path d="M14 35 C35 27, 65 33, 106 17" stroke="#1f77b4" strokeWidth="2.4" fill="none" />
          {/* Background points */}
          <circle cx="24" cy="32" r="1.8" opacity="0.4" />
          <circle cx="42" cy="28" r="1.8" opacity="0.4" />
          <circle cx="60" cy="33" r="1.8" opacity="0.4" />
          <circle cx="78" cy="23" r="1.8" opacity="0.4" />
          <circle cx="96" cy="16" r="1.8" opacity="0.4" />
        </>
      )}

      {/* 19. SLOPE */}
      {type === "slope" && (
        <>
          {/* Left and Right vertical rails */}
          <path className="thumb-axis" d="M30 8V40 M90 8V40" strokeWidth="1.5" />
          {/* Slopes */}
          <path d="M30 32L90 14" stroke="#1f77b4" strokeWidth="2" />
          <path d="M30 18L90 26" stroke="#e4572e" strokeWidth="2" />
          <path d="M30 24L90 22" stroke="#17bebb" strokeWidth="2" />
          <circle cx="30" cy="32" r="2.5" fill="#1f77b4" /><circle cx="90" cy="14" r="2.5" fill="#1f77b4" />
          <circle cx="30" cy="18" r="2.5" fill="#e4572e" /><circle cx="90" cy="26" r="2.5" fill="#e4572e" />
        </>
      )}

      {/* 20. STEP */}
      {type === "step" && (
        <>
          <path className="thumb-axis" d="M12 38H108" />
          <path className="thumb-line" d="M14 34H34V26H56V18H78V12H102" strokeWidth="2.2" />
        </>
      )}
    </>
  );
}
