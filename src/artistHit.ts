import type { PythonArtist } from "./tauri";

function segmentDistance(x: number, y: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const t = dx || dy ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))) : 0;
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
}

export function hitPythonArtist(
  artists: PythonArtist[],
  x: number,
  y: number,
  width: number,
  height: number,
): PythonArtist | null {
  let best: PythonArtist | null = null;
  let bestDistance = 10;
  for (const artist of artists) {
    if (!artist.visible) continue;
    const bbox = artist.bbox;
    if (bbox && artist.kind !== "line" && artist.kind !== "collection") {
      const [bx, by, bw, bh] = bbox;
      if (x >= bx * width - 3 && x <= (bx + bw) * width + 3 &&
          y >= by * height - 3 && y <= (by + bh) * height + 3) {
        const distance = artist.kind === "patch" ? 5 : 0;
        if (distance < bestDistance) {
          best = artist;
          bestDistance = distance;
        }
      }
    }
    if (!artist.points.length) continue;
    const points = artist.points;
    for (let index = 0; index < points.length; index++) {
      const [px, py] = points[index];
      const distance = artist.kind === "line" && index > 0
        ? segmentDistance(x, y, points[index - 1][0] * width, points[index - 1][1] * height, px * width, py * height)
        : Math.hypot(x - px * width, y - py * height);
      if (distance < bestDistance) {
        best = artist;
        bestDistance = distance;
      }
    }
  }
  return best;
}
