import { flattenAll, matchesCriteria } from "./functionHelpers";
import { FormulaContext } from "./types";

export function executeOtherFunction(fn: string, args: any[], ctx: FormulaContext): any {
  switch (fn) {
      // --- Logical ---
      case "IF": {
        const cond = Boolean(args[0]);
        return cond ? args[1] : (args[2] !== undefined ? args[2] : false);
      }
      case "IFS": {
        for (let i = 0; i < args.length; i += 2) {
          if (Boolean(args[i])) return args[i + 1] ?? "";
        }
        return "#N/A";
      }
      case "AND": {
        return args.every((a) => Boolean(a));
      }
      case "OR": {
        return args.some((a) => Boolean(a));
      }
      case "NOT": {
        return !Boolean(args[0]);
      }
      case "IFERROR": {
        const val = args[0];
        const isErr = typeof val === "string" && val.startsWith("#") && val.endsWith("!");
        return isErr ? args[1] : val;
      }
      case "IFNA": {
        const val = args[0];
        return val === "#N/A" ? args[1] : val;
      }
      case "COUNTIF": {
        const items = flattenAll([args[0]], ctx.getRangeValues);
        const criteria = args[1];
        return items.filter((item) => matchesCriteria(item, criteria)).length;
      }
      case "SUMIF": {
        const condItems = flattenAll([args[0]], ctx.getRangeValues);
        const criteria = args[1];
        const sumItems = args[2] ? flattenAll([args[2]], ctx.getRangeValues) : condItems;
        let sum = 0;
        for (let i = 0; i < condItems.length; i++) {
          if (matchesCriteria(condItems[i], criteria)) {
            const n = Number(sumItems[i] ?? 0);
            if (Number.isFinite(n)) sum += n;
          }
        }
        return sum;
      }
      case "AVERAGEIF": {
        const condItems = flattenAll([args[0]], ctx.getRangeValues);
        const criteria = args[1];
        const sumItems = args[2] ? flattenAll([args[2]], ctx.getRangeValues) : condItems;
        let sum = 0;
        let count = 0;
        for (let i = 0; i < condItems.length; i++) {
          if (matchesCriteria(condItems[i], criteria)) {
            const n = Number(sumItems[i] ?? 0);
            if (Number.isFinite(n)) {
              sum += n;
              count++;
            }
          }
        }
        return count > 0 ? sum / count : "#DIV/0!";
      }

      // --- Text ---
      case "CONCAT":
      case "CONCATENATE": {
        return flattenAll(args, ctx.getRangeValues).join("");
      }
      case "LEFT": {
        const str = String(args[0] ?? "");
        const num = args[1] !== undefined ? Math.max(0, Number(args[1])) : 1;
        return str.slice(0, num);
      }
      case "RIGHT": {
        const str = String(args[0] ?? "");
        const num = args[1] !== undefined ? Math.max(0, Number(args[1])) : 1;
        return num === 0 ? "" : str.slice(-num);
      }
      case "MID": {
        const str = String(args[0] ?? "");
        const start = Math.max(1, Number(args[1] ?? 1)) - 1;
        const len = Math.max(0, Number(args[2] ?? str.length));
        return str.substr(start, len);
      }
      case "LEN": {
        return String(args[0] ?? "").length;
      }
      case "LOWER": {
        return String(args[0] ?? "").toLowerCase();
      }
      case "UPPER": {
        return String(args[0] ?? "").toUpperCase();
      }
      case "PROPER": {
        return String(args[0] ?? "").replace(/\b\w/g, (c) => c.toUpperCase());
      }
      case "TRIM": {
        return String(args[0] ?? "").trim().replace(/\s+/g, " ");
      }
      case "SUBSTITUTE": {
        const str = String(args[0] ?? "");
        const oldText = String(args[1] ?? "");
        const newText = String(args[2] ?? "");
        return str.split(oldText).join(newText);
      }
      case "EXACT": {
        return String(args[0] ?? "") === String(args[1] ?? "");
      }

      // --- Lookup ---
      case "VLOOKUP": {
        const lookupVal = args[0];
        const rangeStr = typeof args[1] === "string" ? args[1] : "";
        const colIdx = Number(args[2] ?? 1) - 1;
        const matrix = ctx.getRange2DMatrix(rangeStr);
        if (!matrix.length || colIdx < 0) return "#REF!";
        for (const row of matrix) {
          if (row[0] == lookupVal || String(row[0]).toLowerCase() === String(lookupVal).toLowerCase()) {
            return row[colIdx] ?? "";
          }
        }
        return "#N/A";
      }
      case "INDEX": {
        const rangeStr = typeof args[0] === "string" ? args[0] : "";
        const rowNum = Number(args[1] ?? 1) - 1;
        const colNum = Number(args[2] ?? 1) - 1;
        const matrix = ctx.getRange2DMatrix(rangeStr);
        if (rowNum < 0 || rowNum >= matrix.length) return "#REF!";
        if (colNum < 0 || colNum >= (matrix[rowNum]?.length ?? 0)) return "#REF!";
        return matrix[rowNum][colNum];
      }
      case "MATCH": {
        const lookupVal = args[0];
        const items = flattenAll([args[1]], ctx.getRangeValues);
        for (let i = 0; i < items.length; i++) {
          if (items[i] == lookupVal || String(items[i]).toLowerCase() === String(lookupVal).toLowerCase()) {
            return i + 1; // 1-indexed in Excel
          }
        }
        return "#N/A";
      }
      case "CHOOSE": {
        const idx = Math.floor(Number(args[0] ?? 1));
        if (idx < 1 || idx >= args.length) return "#VALUE!";
        return args[idx];
      }

      // --- Date ---
      case "TODAY": {
        return new Date().toISOString().slice(0, 10);
      }
      case "NOW": {
        return new Date().toLocaleString();
      }
      case "YEAR": {
        const d = new Date(args[0]);
        return isNaN(d.getTime()) ? "#VALUE!" : d.getFullYear();
      }
      case "MONTH": {
        const d = new Date(args[0]);
        return isNaN(d.getTime()) ? "#VALUE!" : d.getMonth() + 1;
      }
      case "DAY": {
        const d = new Date(args[0]);
        return isNaN(d.getTime()) ? "#VALUE!" : d.getDate();
      }

      // --- Info ---
      case "ISNUMBER": {
        return typeof args[0] === "number" || (!isNaN(Number(args[0])) && args[0] !== "");
      }
      case "ISTEXT": {
        return typeof args[0] === "string" && isNaN(Number(args[0]));
      }
      case "ISBLANK": {
        return args[0] === null || args[0] === undefined || args[0] === "";
      }
      case "NA": {
        return "#N/A";
      }
      default:
        return "#NAME?";
    }
}

