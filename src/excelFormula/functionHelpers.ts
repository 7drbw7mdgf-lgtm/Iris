export function flattenNumbers(args: any[], getRangeValues?: (range: string) => any[]): number[] {
  const result: number[] = [];
  for (const a of args) {
    if (typeof a === "string" && a.includes(":") && getRangeValues) {
      const rangeVals = getRangeValues(a);
      for (const v of rangeVals) {
        const n = Number(v);
        if (Number.isFinite(n)) result.push(n);
      }
    } else if (Array.isArray(a)) {
      for (const v of a) {
        const n = Number(v);
        if (Number.isFinite(n)) result.push(n);
      }
    } else {
      const n = Number(a);
      if (Number.isFinite(n)) result.push(n);
    }
  }
  return result;
}

export function flattenAll(args: any[], getRangeValues?: (range: string) => any[]): any[] {
  const result: any[] = [];
  for (const a of args) {
    if (typeof a === "string" && a.includes(":") && getRangeValues) {
      result.push(...getRangeValues(a));
    } else if (Array.isArray(a)) {
      result.push(...a);
    } else {
      result.push(a);
    }
  }
  return result;
}

export function matchesCriteria(val: any, criteria: any): boolean {
  if (criteria === undefined || criteria === null) return val === criteria;
  const cStr = String(criteria).trim();
  if (cStr.startsWith(">=")) return Number(val) >= Number(cStr.slice(2));
  if (cStr.startsWith("<=")) return Number(val) <= Number(cStr.slice(2));
  if (cStr.startsWith("<>")) {
    const target = cStr.slice(2);
    const numTarget = Number(target);
    if (!isNaN(numTarget) && target !== "") {
      return Number(val) !== numTarget;
    }
    return String(val).toLowerCase() !== target.toLowerCase();
  }
  if (cStr.startsWith(">")) return Number(val) > Number(cStr.slice(1));
  if (cStr.startsWith("<")) return Number(val) < Number(cStr.slice(1));
  if (cStr.startsWith("=")) return String(val).toLowerCase() === cStr.slice(1).toLowerCase();
  return String(val).toLowerCase() === cStr.toLowerCase();
}
