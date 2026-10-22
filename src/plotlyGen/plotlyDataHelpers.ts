import { Dataset, PlotSpec } from "../types";

export function groupValues(ds: Dataset, groupVar: string): string[] {
  if (!groupVar) return [""];
  const seen: string[] = [];
  for (const r of ds.rows) {
    const v = String(r[groupVar] ?? "");
    if (!seen.includes(v)) seen.push(v);
  }
  return seen;
}

export function uniqueStrings(ds: Dataset, col: string): string[] {
  const seen: string[] = [];
  for (const r of ds.rows) {
    const v = String(r[col] ?? "");
    if (!seen.includes(v)) seen.push(v);
  }
  return seen;
}

export function numericCol(rows: Dataset["rows"], col: string): number[] {
  return rows.map((r) => Number(r[col])).filter((n) => !isNaN(n));
}

export function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
}
export function sd(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}

export function errorAmount(xs: number[], spec: PlotSpec): number {
  if (!xs.length) return 0;
  const metric = spec.errorMetric ?? spec.barError ?? "sem";
  const spread = sd(xs);
  if (metric === "sd") return spread || 0;
  if (metric === "ci95") return 1.96 * spread / Math.sqrt(xs.length || 1) || 0;
  if (metric === "range") return (Math.max(...xs) - Math.min(...xs)) / 2 || 0;
  return spread / Math.sqrt(xs.length || 1) || 0;
}

export function errorBandAmount(xs: number[], spec: PlotSpec): number {
  const amount = errorAmount(xs, spec);
  return amount || sd(xs) || 0;
}

// Simple Gaussian kernel density estimate (Silverman bandwidth).
export function kde(values: number[], steps = 64): { x: number[]; y: number[] } {
  const xs = values.filter((v) => !isNaN(v));
  if (xs.length < 2) return { x: [], y: [] };
  const s = sd(xs) || 1;
  const bw = 1.06 * s * Math.pow(xs.length, -1 / 5) || s;
  const min = Math.min(...xs) - 3 * bw;
  const max = Math.max(...xs) + 3 * bw;
  const x: number[] = [];
  const y: number[] = [];
  for (let i = 0; i < steps; i++) {
    const xi = min + ((max - min) * i) / (steps - 1);
    let sum = 0;
    for (const v of xs) {
      const u = (xi - v) / bw;
      sum += Math.exp(-0.5 * u * u);
    }
    x.push(xi);
    y.push(sum / (xs.length * bw * Math.sqrt(2 * Math.PI)));
  }
  return { x, y };
}

export function aggregateByCategory(ds: Dataset, catCol: string, valueCol: string): { labels: string[]; values: number[] } {
  const labels = uniqueStrings(ds, catCol);
  const values = labels.map((label) => {
    const rows = ds.rows.filter((r) => String(r[catCol] ?? "") === label);
    const nums = numericCol(rows, valueCol);
    return nums.length ? nums.reduce((a, b) => a + b, 0) : rows.length;
  });
  return { labels, values };
}

export function corr(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const ax = xs.slice(0, n);
  const ay = ys.slice(0, n);
  const mx = mean(ax);
  const my = mean(ay);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const vx = ax[i] - mx;
    const vy = ay[i] - my;
    num += vx * vy;
    dx += vx * vx;
    dy += vy * vy;
  }
  return dx && dy ? num / Math.sqrt(dx * dy) : 0;
}

export function sizeDomain(ds: Dataset, col: string): [number, number] {
  const vals = numericCol(ds.rows, col);
  return [Math.min(...vals), Math.max(...vals)];
}
export function scaleSize(v: number, dom: [number, number]): number {
  if (!isFinite(v)) return 8;
  const [lo, hi] = dom;
  if (hi === lo) return 16;
  return 6 + ((v - lo) / (hi - lo)) * 30;
}

export function ecdf(values: number[]): { x: number[]; y: number[] } {
  const xs = values.filter((v) => !isNaN(v)).sort((a, b) => a - b);
  return { x: xs, y: xs.map((_, i) => (i + 1) / (xs.length || 1)) };
}


export function smoothLine(rows: Dataset["rows"], xCol: string, yCol: string): { x: number[]; y: number[] } {
  const pts = rows
    .map((r) => ({ x: Number(r[xCol]), y: Number(r[yCol]) }))
    .filter((p) => !isNaN(p.x) && !isNaN(p.y))
    .sort((a, b) => a.x - b.x);
  const windowSize = Math.max(3, Math.round(pts.length / 8));
  return {
    x: pts.map((p) => p.x),
    y: pts.map((_, i) => {
      const lo = Math.max(0, i - Math.floor(windowSize / 2));
      const hi = Math.min(pts.length, lo + windowSize);
      return mean(pts.slice(lo, hi).map((p) => p.y));
    }),
  };
}

export function numericColumns(ds: Dataset): string[] {
  return ds.columns.filter((c) => ds.types[c] === "numeric");
}

export function rowNumericMatrix(ds: Dataset, cols = numericColumns(ds)): { labels: string[]; matrix: number[][] } {
  const raw = ds.rows.map((r, i) => ({
    label: String(r[ds.columns.find((c) => ds.types[c] === "categorical") || ""] ?? i + 1),
    values: cols.map((c) => Number(r[c])),
  })).filter((r) => r.values.every((v) => Number.isFinite(v)));
  if (!raw.length || !cols.length) return { labels: [], matrix: [] };
  const means = cols.map((_, j) => mean(raw.map((r) => r.values[j])));
  const sds = cols.map((_, j) => sd(raw.map((r) => r.values[j])) || 1);
  return {
    labels: raw.map((r) => r.label),
    matrix: raw.map((r) => r.values.map((v, j) => (v - means[j]) / sds[j])),
  };
}

export function projection2d(ds: Dataset): { x: number[]; y: number[]; labels: string[] } {
  const { labels, matrix } = rowNumericMatrix(ds);
  if (!matrix.length || matrix[0].length === 0) return { x: [], y: [], labels: [] };
  const n = matrix.length;
  const p = matrix[0].length;
  if (p === 1) return { x: matrix.map((r) => r[0]), y: matrix.map((_, i) => i), labels };

  // Covariance matrix C = X^T * X / (n - 1)
  const cov: number[][] = Array.from({ length: p }, () => Array(p).fill(0));
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      let sum = 0;
      for (let r = 0; r < n; r++) {
        sum += matrix[r][i] * matrix[r][j];
      }
      cov[i][j] = sum / Math.max(1, n - 1);
    }
  }

  // Power iteration for principal eigenvectors
  const powerIter = (A: number[][], defl?: number[]): number[] => {
    let v = Array(p).fill(1 / Math.sqrt(p));
    for (let iter = 0; iter < 25; iter++) {
      if (defl) {
        const dot = defl.reduce((s, u, k) => s + u * v[k], 0);
        v = v.map((vk, k) => vk - dot * defl[k]);
      }
      const next = Array(p).fill(0);
      for (let i = 0; i < p; i++) {
        for (let j = 0; j < p; j++) {
          next[i] += A[i][j] * v[j];
        }
      }
      const norm = Math.sqrt(next.reduce((s, val) => s + val * val, 0)) || 1;
      v = next.map((val) => val / norm);
    }
    return v;
  };

  const v1 = powerIter(cov);
  const v2 = powerIter(cov, v1);

  // Project: x = X * v1, y = X * v2
  const x = matrix.map((r) => r.reduce((sum, val, j) => sum + val * v1[j], 0));
  const y = matrix.map((r) => r.reduce((sum, val, j) => sum + val * v2[j], 0));
  return { x, y, labels };
}


export function normalQuantile(p: number): number {
  // Acklam's inverse-normal approximation, good enough for QQ guide plotting.
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const plow = 0.02425;
  const phigh = 1 - plow;
  if (p < plow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > phigh) return -normalQuantile(1 - p);
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

export function survivalCurve(rows: Dataset["rows"], timeCol: string, eventCol: string): { x: number[]; y: number[] } {
  const pts = rows
    .map((r) => ({ t: Number(r[timeCol]), event: Number(r[eventCol]) > 0 }))
    .filter((p) => Number.isFinite(p.t))
    .sort((a, b) => a.t - b.t);
  let atRisk = pts.length;
  let surv = 1;
  const x = [0];
  const y = [1];
  const times = Array.from(new Set(pts.map((p) => p.t))).sort((a, b) => a - b);
  times.forEach((t) => {
    const atT = pts.filter((p) => p.t === t);
    const events = atT.filter((p) => p.event).length;
    if (atRisk > 0 && events > 0) surv *= 1 - events / atRisk;
    x.push(t, t);
    y.push(y[y.length - 1], surv);
    atRisk -= atT.length;
  });
  return { x, y };
}

export function beeswarmOffsets(vals: number[]): number[] {
  if (vals.length <= 1) return vals.map(() => 0);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const numBins = Math.min(45, Math.max(12, Math.round(vals.length / 2)));
  const binWidth = span / numBins;
  const binCounts = new Map<number, number>();
  const indices = vals.map((_, i) => i).sort((a, b) => vals[a] - vals[b]);
  const offsets = new Array(vals.length).fill(0);
  for (const idx of indices) {
    const v = vals[idx];
    const bin = Math.min(numBins - 1, Math.max(0, Math.floor((v - min) / binWidth)));
    const count = binCounts.get(bin) || 0;
    binCounts.set(bin, count + 1);
    if (count > 0) {
      const sign = count % 2 === 1 ? 1 : -1;
      const mag = Math.ceil(count / 2) * 0.05;
      offsets[idx] = sign * Math.min(0.38, mag);
    }
  }
  return offsets;
}

export function binaryCurve(rows: Dataset["rows"], scoreCol: string, outcomeCol: string, mode: "roc" | "pr"): { x: number[]; y: number[] } {
  const pts = rows
    .map((r) => ({ score: Number(r[scoreCol]), y: Number(r[outcomeCol]) > 0 ? 1 : 0 }))
    .filter((p) => Number.isFinite(p.score))
    .sort((a, b) => b.score - a.score);
  const positives = pts.filter((p) => p.y === 1).length || 1;
  const negatives = pts.length - positives || 1;
  let tp = 0, fp = 0;
  const x = [0], y = [mode === "roc" ? 0 : 1];
  pts.forEach((p) => {
    if (p.y) tp++;
    else fp++;
    if (mode === "roc") {
      x.push(fp / negatives);
      y.push(tp / positives);
    } else {
      x.push(tp / positives);
      y.push(tp / Math.max(1, tp + fp));
    }
  });
  return { x, y };
}


export function linreg(xs: number[], ys: number[]): { b0: number; b1: number; r2: number } | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return null;
  const mx = mean(xs);
  const my = mean(ys);
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - mx) ** 2;
    sxy += (xs[i] - mx) * (ys[i] - my);
    syy += (ys[i] - my) ** 2;
  }
  if (sxx === 0) return null;
  const b1 = sxy / sxx;
  const b0 = my - b1 * mx;
  const r2 = syy === 0 ? 0 : (sxy * sxy) / (sxx * syy);
  return { b0, b1, r2 };
}

