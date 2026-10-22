export function columnLetterToIndex(letters: string): number {
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + letters.toUpperCase().charCodeAt(i) - 64;
  }
  return col - 1;
}

export function indexToColumnLetter(index: number): string {
  let n = Math.max(0, index) + 1;
  let label = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

export function parseCellAddress(address: string): { r: number; c: number } | null {
  const clean = address.replace(/\$/g, "").trim().toUpperCase();
  const match = clean.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  const c = columnLetterToIndex(match[1]);
  const r = parseInt(match[2], 10) - 1;
  if (r < 0 || c < 0) return null;
  return { r, c };
}

export function parseRangeAddress(rangeStr: string): { r1: number; r2: number; c1: number; c2: number } | null {
  const parts = rangeStr.split(":");
  if (parts.length === 1) {
    const p = parseCellAddress(parts[0]);
    if (!p) return null;
    return { r1: p.r, r2: p.r, c1: p.c, c2: p.c };
  }
  if (parts.length === 2) {
    const p1 = parseCellAddress(parts[0]);
    const p2 = parseCellAddress(parts[1]);
    if (!p1 || !p2) return null;
    return {
      r1: Math.min(p1.r, p2.r),
      r2: Math.max(p1.r, p2.r),
      c1: Math.min(p1.c, p2.c),
      c2: Math.max(p1.c, p2.c),
    };
  }
  return null;
}
