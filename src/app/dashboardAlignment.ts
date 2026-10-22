import { DashboardItem } from "./types";

export interface AlignmentGuide {
  orientation: "vertical" | "horizontal";
  coordinate: number;
}

export interface SnappedPosition {
  x: number;
  y: number;
  guides: AlignmentGuide[];
}

export function snapToAlignmentGuides(
  movingId: string,
  rawX: number,
  rawY: number,
  width: number,
  height: number,
  otherItems: DashboardItem[],
  threshold = 8
): SnappedPosition {
  let snappedX = rawX;
  let snappedY = rawY;
  const guides: AlignmentGuide[] = [];

  const movingLeft = rawX;
  const movingCenterX = rawX + width / 2;
  const movingRight = rawX + width;

  const movingTop = rawY;
  const movingCenterY = rawY + height / 2;
  const movingBottom = rawY + height;

  let xSnapped = false;
  let ySnapped = false;

  for (const item of otherItems) {
    if (item.id === movingId) continue;

    const itemLeft = item.x;
    const itemCenterX = item.x + item.w / 2;
    const itemRight = item.x + item.w;

    const itemTop = item.y;
    const itemCenterY = item.y + item.h / 2;
    const itemBottom = item.y + item.h;

    // Horizontal snapping (X coordinates)
    if (!xSnapped) {
      // Left-to-Left
      if (Math.abs(movingLeft - itemLeft) <= threshold) {
        snappedX = itemLeft;
        guides.push({ orientation: "vertical", coordinate: itemLeft });
        xSnapped = true;
      }
      // Center-to-Center
      else if (Math.abs(movingCenterX - itemCenterX) <= threshold) {
        snappedX = itemCenterX - width / 2;
        guides.push({ orientation: "vertical", coordinate: itemCenterX });
        xSnapped = true;
      }
      // Right-to-Right
      else if (Math.abs(movingRight - itemRight) <= threshold) {
        snappedX = itemRight - width;
        guides.push({ orientation: "vertical", coordinate: itemRight });
        xSnapped = true;
      }
      // Left-to-Right
      else if (Math.abs(movingLeft - itemRight) <= threshold) {
        snappedX = itemRight;
        guides.push({ orientation: "vertical", coordinate: itemRight });
        xSnapped = true;
      }
      // Right-to-Left
      else if (Math.abs(movingRight - itemLeft) <= threshold) {
        snappedX = itemLeft - width;
        guides.push({ orientation: "vertical", coordinate: itemLeft });
        xSnapped = true;
      }
    }

    // Vertical snapping (Y coordinates)
    if (!ySnapped) {
      // Top-to-Top
      if (Math.abs(movingTop - itemTop) <= threshold) {
        snappedY = itemTop;
        guides.push({ orientation: "horizontal", coordinate: itemTop });
        ySnapped = true;
      }
      // Center-to-Center
      else if (Math.abs(movingCenterY - itemCenterY) <= threshold) {
        snappedY = itemCenterY - height / 2;
        guides.push({ orientation: "horizontal", coordinate: itemCenterY });
        ySnapped = true;
      }
      // Bottom-to-Bottom
      else if (Math.abs(movingBottom - itemBottom) <= threshold) {
        snappedY = itemBottom - height;
        guides.push({ orientation: "horizontal", coordinate: itemBottom });
        ySnapped = true;
      }
      // Top-to-Bottom
      else if (Math.abs(movingTop - itemBottom) <= threshold) {
        snappedY = itemBottom;
        guides.push({ orientation: "horizontal", coordinate: itemBottom });
        ySnapped = true;
      }
      // Bottom-to-Top
      else if (Math.abs(movingBottom - itemTop) <= threshold) {
        snappedY = itemTop - height;
        guides.push({ orientation: "horizontal", coordinate: itemTop });
        ySnapped = true;
      }
    }
  }

  return {
    x: Math.round(snappedX),
    y: Math.round(snappedY),
    guides,
  };
}
