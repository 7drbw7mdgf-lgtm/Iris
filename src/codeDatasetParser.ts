import { inflate } from "pako";
import type { Dataset } from "./types";
import { inferDatasetFromRows, parseDelimitedText } from "./dataParsing";

export function rowsToDataset(name: string, rows: unknown[][]): Dataset {
  const strRows = rows.map((r) => (r ?? []).map((v) => String(v ?? "")));
  return inferDatasetFromRows(name, strRows);
}

export function parseTableText(name: string, text: string): Dataset {
  return parseDelimitedText(name, text);
}

export function bestDataset(candidates: Dataset[]): Dataset | null {
  const usable = candidates.filter((ds) => ds.columns.length > 0 && ds.rows.length > 0);
  if (!usable.length) return null;
  return usable.sort((a, b) => b.columns.length * b.rows.length - a.columns.length * a.rows.length)[0];
}

function extractBalanced(text: string, startIndex: number, open: string, close: string): string | null {
  let depth = 0;
  let quote = "";
  let bodyStart = -1;
  for (let i = startIndex; i < text.length; i++) {
    const ch = text[i];
    const prev = text[i - 1];
    if (quote) {
      if (ch === quote && prev !== "\\") quote = "";
      continue;
    }
    if (ch === "'" || ch === "\"") {
      quote = ch;
      continue;
    }
    if (ch === open) {
      if (depth === 0) bodyStart = i + 1;
      depth++;
    } else if (ch === close) {
      depth--;
      if (depth === 0 && bodyStart >= 0) return text.slice(bodyStart, i);
    }
  }
  return null;
}

function extractCallArgs(code: string, callPattern: RegExp): string | null {
  const match = callPattern.exec(code);
  if (!match || match.index == null) return null;
  const paren = code.indexOf("(", match.index + match[0].length - 1);
  return paren >= 0 ? extractBalanced(code, paren, "(", ")") : null;
}

function splitTopLevel(text: string): string[] {
  const result: string[] = [];
  let current = "";
  let depth = 0;
  let quote = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const prev = text[i - 1];
    if (quote) {
      current += ch;
      if (ch === quote && prev !== "\\") quote = "";
      continue;
    }
    if (ch === "'" || ch === "\"") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") depth--;
    if (ch === "," && depth === 0) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

function parseCodeScalar(token: string): string | number | null {
  const trimmed = token.trim();
  if (!trimmed || trimmed === "None" || trimmed === "NA" || trimmed === "null" || trimmed === "NaN") return null;
  const num = Number(trimmed);
  if (!isNaN(num)) return num;
  const strMatch = trimmed.match(/^(['"])([\s\S]*)\1$/);
  return strMatch ? strMatch[2] : trimmed;
}

function stringLiteralValue(token: string): string {
  const trimmed = token.trim();
  const triple = trimmed.match(/^(?:[rRuUbBfF]*)("""|''')([\s\S]*)\1$/);
  if (triple) return triple[2];
  const quoted = trimmed.match(/^(?:[rRuUbBfF]*)(['"])((?:\\.|[\s\S])*?)\1$/);
  if (!quoted) return "";
  return quoted[2].replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\"/g, "\"").replace(/\\'/g, "'");
}

function extractAssignedString(name: string, code: string): string | null {
  const assignment = new RegExp(`\\b${name}\\s*=\\s*`, "m").exec(code);
  if (!assignment || assignment.index == null) return null;
  const after = code.slice(assignment.index + assignment[0].length).trimStart();
  let expression = "";
  if (after.startsWith("(")) {
    const body = extractBalanced(after, 0, "(", ")");
    if (body == null) return null;
    expression = body;
  } else {
    expression = after.split(/\n/)[0] ?? "";
  }
  const literalRe = /(?:[rRuUbBfF]*)("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:(?:\\.)|[^"\\])*"|'(?:(?:\\.)|[^'\\])*')/g;
  const parts: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = literalRe.exec(expression))) {
    parts.push(stringLiteralValue(match[0]));
  }
  return parts.length ? parts.join("") : null;
}

function decodeBase64(text: string): Uint8Array {
  const cleaned = text.replace(/\s+/g, "");
  if (typeof atob === "function") {
    const binary = atob(cleaned);
    return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  }
  const bufferCtor = (globalThis as unknown as { Buffer?: { from: (value: string, encoding: string) => Uint8Array } }).Buffer;
  if (bufferCtor) return bufferCtor.from(cleaned, "base64");
  throw new Error("No base64 decoder available");
}

function inflateToText(bytes: Uint8Array): string {
  const inflated = inflate(bytes, { to: "string" } as unknown as Parameters<typeof inflate>[1]) as unknown;
  if (typeof inflated === "string") return inflated;
  if (inflated instanceof Uint8Array) return new TextDecoder().decode(inflated);
  if (Array.isArray(inflated)) return new TextDecoder().decode(Uint8Array.from(inflated));
  return String(inflated ?? "");
}

function parseCompressedBase64Csv(name: string, code: string): Dataset[] {
  if (!/\bzlib\.decompress\s*\(/.test(code) || !/\bbase64\.b64decode\s*\(/.test(code)) return [];
  const variableNames = Array.from(code.matchAll(/\bbase64\.b64decode\s*\(\s*([A-Za-z_]\w*)\s*\)/g)).map((match) => match[1]);
  if (!variableNames.length) {
    variableNames.push(...Array.from(code.matchAll(/\b([A-Za-z_]\w*(?:B64|_B64|BASE64|_BASE64))\b/g)).map((match) => match[1]));
  }
  const candidates: Dataset[] = [];
  for (const variableName of Array.from(new Set(variableNames))) {
    const encoded = extractAssignedString(variableName, code);
    if (!encoded) continue;
    try {
      const inflated = inflateToText(decodeBase64(encoded));
      const parsed = parseTableText(name, inflated);
      if (parsed.columns.length > 1 && parsed.rows.length > 0) candidates.push(parsed);
    } catch {
      // Ignore
    }
  }
  return candidates;
}

function parsePandasDataFrame(name: string, code: string): Dataset | null {
  const args = extractCallArgs(code, /\b(?:pd|pandas)\.DataFrame\s*\(/);
  if (!args) return null;
  const braceStart = args.indexOf("{");
  const body = braceStart >= 0 ? extractBalanced(args, braceStart, "{", "}") : null;
  if (!body) return null;
  const entries = splitTopLevel(body);
  const columns: string[] = [];
  const values: (string | number | null)[][] = [];
  for (const entry of entries) {
    const pair = entry.match(/^(['"]?)([^'":=]+)\1\s*:\s*\[([\s\S]*)\]$/);
    if (!pair) continue;
    columns.push(pair[2].trim());
    values.push(splitTopLevel(pair[3]).map(parseCodeScalar));
  }
  if (!columns.length) return null;
  const height = Math.max(...values.map((col) => col.length));
  const rows = Array.from({ length: height }, (_, r) => columns.map((_, c) => values[c]?.[r] ?? null));
  return rowsToDataset(name, [columns, ...rows]);
}

function parseRDataFrame(name: string, code: string): Dataset | null {
  const args = extractCallArgs(code, /\bdata\.frame\s*\(/);
  if (!args) return null;
  const entries = splitTopLevel(args);
  const columns: string[] = [];
  const values: (string | number | null)[][] = [];
  for (const entry of entries) {
    const pair = entry.match(/^`?([\w .-]+)`?\s*=\s*c\s*\(([\s\S]*)\)$/);
    if (!pair) continue;
    columns.push(pair[1].trim());
    values.push(splitTopLevel(pair[2]).map(parseCodeScalar));
  }
  if (!columns.length) return null;
  const height = Math.max(...values.map((col) => col.length));
  const rows = Array.from({ length: height }, (_, r) => columns.map((_, c) => values[c]?.[r] ?? null));
  return rowsToDataset(name, [columns, ...rows]);
}

function parseRecordsLiteral(name: string, code: string): Dataset | null {
  const match = code.match(/\[\s*\{[\s\S]*?\}\s*\]/);
  if (!match) return null;
  const normalised = match[0]
    .replace(/'/g, "\"")
    .replace(/\bNone\b/g, "null")
    .replace(/\bTrue\b/g, "true")
    .replace(/\bFalse\b/g, "false")
    .replace(/([{,]\s*)([A-Za-z_][\w .-]*)(\s*:)/g, "$1\"$2\"$3");
  try {
    const records = JSON.parse(normalised) as unknown;
    if (!Array.isArray(records) || !records.every((row) => row && typeof row === "object" && !Array.isArray(row))) return null;
    const columns = (Array.from(new Set(records.flatMap((row) => Object.keys(row as Record<string, unknown>)))));
    const rows = records.map((row) => columns.map((col) => (row as Record<string, unknown>)[col] ?? null));
    return rowsToDataset(name, [columns, ...rows]);
  } catch {
    return null;
  }
}

function parseDelimitedStringLiterals(name: string, code: string): Dataset[] {
  const candidates: Dataset[] = [];
  const literalRe = /(?:r|R|f|F|b|B|u|U)*(?:"""([\s\S]*?)"""|'''([\s\S]*?)'''|`([\s\S]*?)`|"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)')/g;
  let match: RegExpExecArray | null;
  while ((match = literalRe.exec(code))) {
    const raw = match.slice(1).find((value) => value != null) ?? "";
    const text = raw.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\"/g, "\"").replace(/\\'/g, "'");
    if (!/[,\t|;]/.test(text) && text.trim().split(/\n/).length < 2) continue;
    const parsed = parseTableText(name, text);
    if (parsed.columns.length > 1 && parsed.rows.length > 0) candidates.push(parsed);
  }
  return candidates;
}

export function parseDatasetFromCode(name: string, code: string): Dataset {
  const candidates = [
    parsePandasDataFrame(name, code),
    parseRDataFrame(name, code),
    parseRecordsLiteral(name, code),
    ...parseCompressedBase64Csv(name, code),
    ...parseDelimitedStringLiterals(name, code),
  ].filter((ds): ds is Dataset => !!ds);
  return bestDataset(candidates) ?? { name, columns: [], types: {}, rows: [] };
}
