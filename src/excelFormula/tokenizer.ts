import { parseCellAddress, parseRangeAddress } from "./addressHelpers";
import { Token } from "./types";

export function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = src.length;

  while (i < n) {
    const ch = src[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // String literal "..."
    if (ch === '"') {
      let str = "";
      i++;
      while (i < n && src[i] !== '"') {
        if (src[i] === '\\' && i + 1 < n) {
          i++;
          str += src[i];
        } else {
          str += src[i];
        }
        i++;
      }
      if (i < n && src[i] === '"') i++;
      tokens.push({ type: "STRING", value: str });
      continue;
    }

    // Two-character operators: <=, >=, <>, !=
    if (i + 1 < n) {
      const two = src.slice(i, i + 2);
      if (two === "<=" || two === ">=" || two === "<>" || two === "!=") {
        tokens.push({ type: "OP", value: two === "!=" ? "<>" : two });
        i += 2;
        continue;
      }
    }

    // Single-character operators and delimiters
    if ("+-*/^%&=><".includes(ch)) {
      tokens.push({ type: "OP", value: ch });
      i++;
      continue;
    }

    if (ch === ",") {
      tokens.push({ type: "COMMA", value: "," });
      i++;
      continue;
    }

    if (ch === "(") {
      tokens.push({ type: "LPAREN", value: "(" });
      i++;
      continue;
    }

    if (ch === ")") {
      tokens.push({ type: "RPAREN", value: ")" });
      i++;
      continue;
    }

    // Numbers: 123, 123.45, .5
    if (/\d/.test(ch) || (ch === "." && i + 1 < n && /\d/.test(src[i + 1]))) {
      let numStr = "";
      while (i < n && (/\d/.test(src[i]) || src[i] === "." || src[i] === "e" || src[i] === "E")) {
        numStr += src[i];
        i++;
      }
      tokens.push({ type: "NUMBER", value: parseFloat(numStr) });
      continue;
    }

    // Identifiers, Cell references, Range references, Booleans
    if (/[a-zA-Z_$]/.test(ch)) {
      let ident = "";
      while (i < n && /[a-zA-Z0-9_$:.]/.test(src[i])) {
        ident += src[i];
        i++;
      }

      const upper = ident.toUpperCase();
      if (upper === "TRUE") {
        tokens.push({ type: "BOOLEAN", value: true });
        continue;
      }
      if (upper === "FALSE") {
        tokens.push({ type: "BOOLEAN", value: false });
        continue;
      }

      // Check if it's a range like A1:B10 or $A$1:$B$10
      if (ident.includes(":")) {
        const range = parseRangeAddress(ident);
        if (range) {
          tokens.push({ type: "RANGE", value: ident });
          continue;
        }
      }

      // Check if it's a single cell reference like A1 or $A$1
      const cell = parseCellAddress(ident);
      if (cell) {
        // If next token is colon ':', consume it and next cell to form a RANGE
        if (i < n && src[i] === ":") {
          i++; // skip ':'
          let nextRef = "";
          while (i < n && /[a-zA-Z0-9_$]/.test(src[i])) {
            nextRef += src[i];
            i++;
          }
          const fullRange = `${ident}:${nextRef}`;
          tokens.push({ type: "RANGE", value: fullRange });
          continue;
        }
        tokens.push({ type: "CELL", value: ident });
        continue;
      }

      tokens.push({ type: "IDENT", value: upper });
      continue;
    }

    // Skip unknown character
    i++;
  }

  return tokens;
}

