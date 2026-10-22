import { GraphType } from "../types";
import { ThumbnailsPart1 } from "./thumbnails/ThumbnailsPart1";
import { ThumbnailsPart2 } from "./thumbnails/ThumbnailsPart2";

export { ChartTypeMiniIcon } from "./thumbnails/ChartTypeMiniIcon";

export function ChartTypeThumbnail({ type, disabled }: { type: GraphType; disabled?: boolean }) {
  return (
    <svg
      className={`chart-type-thumb chart-type-thumb-${type}`}
      viewBox="0 0 120 48"
      aria-hidden="true"
      focusable="false"
      data-disabled={disabled ? "true" : "false"}
    >
      <rect className="thumb-bg" x="1" y="1" width="118" height="46" rx="8" />
      <ThumbnailsPart1 type={type} />
      <ThumbnailsPart2 type={type} />
    </svg>
  );
}
