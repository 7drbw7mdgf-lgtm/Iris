import { flattenNumbers, flattenAll } from "./functionHelpers";
import { parseRangeAddress } from "./addressHelpers";
import { FormulaContext } from "./types";

export function executeMathStatsFunction(fn: string, args: any[], ctx: FormulaContext): any {
  switch (fn) {
      // --- Math ---
      case "SUM": {
        const nums = flattenNumbers(args, ctx.getRangeValues);
        return nums.reduce((sum, n) => sum + n, 0);
      }
      case "PRODUCT": {
        const nums = flattenNumbers(args, ctx.getRangeValues);
        if (nums.length === 0) return 0;
        return nums.reduce((acc, n) => acc * n, 1);
      }
      case "ABS": {
        return Math.abs(Number(args[0] ?? 0));
      }
      case "ROUND": {
        const val = Number(args[0] ?? 0);
        const digits = Number(args[1] ?? 0);
        const factor = Math.pow(10, digits);
        return Math.round(val * factor) / factor;
      }
      case "ROUNDUP": {
        const val = Number(args[0] ?? 0);
        const digits = Number(args[1] ?? 0);
        const factor = Math.pow(10, digits);
        return Math.ceil(Math.abs(val) * factor) / factor * (val < 0 ? -1 : 1);
      }
      case "ROUNDDOWN": {
        const val = Number(args[0] ?? 0);
        const digits = Number(args[1] ?? 0);
        const factor = Math.pow(10, digits);
        return Math.floor(Math.abs(val) * factor) / factor * (val < 0 ? -1 : 1);
      }
      case "INT": {
        return Math.floor(Number(args[0] ?? 0));
      }
      case "MOD": {
        const n = Number(args[0] ?? 0);
        const d = Number(args[1] ?? 1);
        if (d === 0) return "#DIV/0!";
        return ((n % d) + d) % d;
      }
      case "SQRT": {
        const n = Number(args[0] ?? 0);
        if (n < 0) return "#NUM!";
        return Math.sqrt(n);
      }
      case "POWER": {
        return Math.pow(Number(args[0] ?? 0), Number(args[1] ?? 1));
      }
      case "EXP": {
        return Math.exp(Number(args[0] ?? 0));
      }
      case "LN": {
        const n = Number(args[0] ?? 0);
        if (n <= 0) return "#NUM!";
        return Math.log(n);
      }
      case "LOG": {
        const n = Number(args[0] ?? 0);
        const base = args[1] !== undefined ? Number(args[1]) : 10;
        if (n <= 0 || base <= 0 || base === 1) return "#NUM!";
        return Math.log(n) / Math.log(base);
      }
      case "LOG10": {
        const n = Number(args[0] ?? 0);
        if (n <= 0) return "#NUM!";
        return Math.log10(n);
      }
      case "CEILING": {
        const n = Number(args[0] ?? 0);
        const sig = args[1] !== undefined ? Number(args[1]) : 1;
        if (sig === 0) return 0;
        return Math.ceil(n / sig) * sig;
      }
      case "FLOOR": {
        const n = Number(args[0] ?? 0);
        const sig = args[1] !== undefined ? Number(args[1]) : 1;
        if (sig === 0) return 0;
        return Math.floor(n / sig) * sig;
      }
      case "SIGN": {
        const n = Number(args[0] ?? 0);
        return n > 0 ? 1 : n < 0 ? -1 : 0;
      }
      case "PI": {
        return Math.PI;
      }
      case "RAND": {
        return Math.random();
      }
      case "RANDBETWEEN": {
        const min = Math.ceil(Number(args[0] ?? 0));
        const max = Math.floor(Number(args[1] ?? 100));
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

      // --- Statistical ---
      case "AVERAGE":
      case "AVG": {
        const nums = flattenNumbers(args, ctx.getRangeValues);
        if (nums.length === 0) return "#DIV/0!";
        return nums.reduce((s, n) => s + n, 0) / nums.length;
      }
      case "MEDIAN": {
        const nums = flattenNumbers(args, ctx.getRangeValues).sort((a, b) => a - b);
        if (nums.length === 0) return "#NUM!";
        const mid = Math.floor(nums.length / 2);
        return nums.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
      }
      case "MIN": {
        const nums = flattenNumbers(args, ctx.getRangeValues);
        if (nums.length === 0) return 0;
        return Math.min(...nums);
      }
      case "MAX": {
        const nums = flattenNumbers(args, ctx.getRangeValues);
        if (nums.length === 0) return 0;
        return Math.max(...nums);
      }
      case "COUNT": {
        return flattenNumbers(args, ctx.getRangeValues).length;
      }
      case "COUNTA": {
        return flattenAll(args, ctx.getRangeValues).filter((v: any) => v !== null && v !== undefined && v !== "").length;
      }
      case "COUNTBLANK": {
        const rangeStr = typeof args[0] === "string" ? args[0] : "";
        const range = parseRangeAddress(rangeStr);
        if (!range) return 0;
        let count = 0;
        for (let r = range.r1; r <= range.r2; r++) {
          for (let c = range.c1; c <= range.c2; c++) {
            const val = ctx.dataset.rows[r]?.[ctx.dataset.columns[c]];
            if (val === null || val === undefined || val === "") count++;
          }
        }
        return count;
      }
      case "STDEV":
      case "STDEVA": {
        const nums = flattenNumbers(args, ctx.getRangeValues);
        if (nums.length <= 1) return "#DIV/0!";
        const mean = nums.reduce((s, n) => s + n, 0) / nums.length;
        const variance = nums.reduce((s, n) => s + Math.pow(n - mean, 2), 0) / (nums.length - 1);
        return Math.sqrt(variance);
      }
      case "STDEVP": {
        const nums = flattenNumbers(args, ctx.getRangeValues);
        if (nums.length === 0) return "#DIV/0!";
        const mean = nums.reduce((s, n) => s + n, 0) / nums.length;
        const variance = nums.reduce((s, n) => s + Math.pow(n - mean, 2), 0) / nums.length;
        return Math.sqrt(variance);
      }
      case "VAR": {
        const nums = flattenNumbers(args, ctx.getRangeValues);
        if (nums.length <= 1) return "#DIV/0!";
        const mean = nums.reduce((s, n) => s + n, 0) / nums.length;
        return nums.reduce((s, n) => s + Math.pow(n - mean, 2), 0) / (nums.length - 1);
      }
      case "VARP": {
        const nums = flattenNumbers(args, ctx.getRangeValues);
        if (nums.length === 0) return "#DIV/0!";
        const mean = nums.reduce((s, n) => s + n, 0) / nums.length;
        return nums.reduce((s, n) => s + Math.pow(n - mean, 2), 0) / nums.length;
      }
      case "MODE": {
        const nums = flattenNumbers(args, ctx.getRangeValues);
        if (nums.length === 0) return "#N/A";
        const counts: Record<number, number> = {};
        let maxCount = 0;
        let modeVal = nums[0];
        for (const n of nums) {
          counts[n] = (counts[n] || 0) + 1;
          if (counts[n] > maxCount) {
            maxCount = counts[n];
            modeVal = n;
          }
        }
        return modeVal;
      }
      case "LARGE": {
        const nums = flattenNumbers([args[0]], ctx.getRangeValues).sort((a, b) => b - a);
        const k = Number(args[1] ?? 1) - 1;
        if (k < 0 || k >= nums.length) return "#NUM!";
        return nums[k];
      }
      case "SMALL": {
        const nums = flattenNumbers([args[0]], ctx.getRangeValues).sort((a, b) => a - b);
        const k = Number(args[1] ?? 1) - 1;
        if (k < 0 || k >= nums.length) return "#NUM!";
        return nums[k];
      }
      case "PERCENTILE": {
        const nums = flattenNumbers([args[0]], ctx.getRangeValues).sort((a, b) => a - b);
        const k = Number(args[1] ?? 0);
        if (nums.length === 0 || k < 0 || k > 1) return "#NUM!";
        const idx = (nums.length - 1) * k;
        const low = Math.floor(idx);
        const high = Math.ceil(idx);
        return nums[low] + (nums[high] - nums[low]) * (idx - low);
      }


    default:
      return undefined;
  }
}
