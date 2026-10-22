import { Dataset } from "../types";
import { Token, CellValue, FormulaContext } from "./types";
import { tokenize } from "./tokenizer";
import { parseCellAddress, parseRangeAddress } from "./addressHelpers";
import { executeMathStatsFunction } from "./functionsMathStats";
import { executeOtherFunction } from "./functionsOther";

function executeExcelFunction(fn: string, args: any[], ctx: FormulaContext): any {
  const mathStat = executeMathStatsFunction(fn, args, ctx);
  if (mathStat !== undefined) return mathStat;
  return executeOtherFunction(fn, args, ctx);
}

export function evaluateExcelFormula(
  rawFormula: string,
  dataset: Dataset,
  _currentRow = 0,
  _currentCol = 0
): CellValue {
  const formula = rawFormula.trim();
  if (!formula.startsWith("=")) {
    // Plain literal value
    if (formula === "") return "";
    const n = Number(formula.replace(/,/g, ""));
    if (Number.isFinite(n) && !isNaN(n) && !formula.endsWith("%")) return n;
    return formula;
  }

  const exprStr = formula.slice(1).trim();
  if (!exprStr) return "";

  let tokens: Token[];
  try {
    tokens = tokenize(exprStr);
  } catch {
    return "#ERROR!";
  }

  if (tokens.length === 0) return "";

  let pos = 0;

  function peek(): Token | undefined {
    return tokens[pos];
  }

  function consume(): Token {
    return tokens[pos++];
  }

  function getCellValue(r: number, c: number): any {
    if (r < 0 || r >= dataset.rows.length || c < 0 || c >= dataset.columns.length) {
      return 0;
    }
    const colName = dataset.columns[c];
    const val = dataset.rows[r]?.[colName];
    if (val === null || val === undefined || val === "") return 0;
    const n = Number(val);
    if (Number.isFinite(n)) return n;
    return val;
  }

  function getRangeValues(rangeStr: string): any[] {
    const range = parseRangeAddress(rangeStr);
    if (!range) return [];
    const values: any[] = [];
    for (let r = range.r1; r <= range.r2; r++) {
      for (let c = range.c1; c <= range.c2; c++) {
        if (r < dataset.rows.length && c < dataset.columns.length) {
          const colName = dataset.columns[c];
          const val = dataset.rows[r]?.[colName];
          if (val !== null && val !== undefined && val !== "") {
            const n = Number(val);
            values.push(Number.isFinite(n) ? n : val);
          }
        }
      }
    }
    return values;
  }

  function getRange2DMatrix(rangeStr: string): any[][] {
    const range = parseRangeAddress(rangeStr);
    if (!range) return [];
    const matrix: any[][] = [];
    for (let r = range.r1; r <= range.r2; r++) {
      const row: any[] = [];
      for (let c = range.c1; c <= range.c2; c++) {
        if (r < dataset.rows.length && c < dataset.columns.length) {
          const colName = dataset.columns[c];
          row.push(dataset.rows[r]?.[colName] ?? "");
        } else {
          row.push("");
        }
      }
      matrix.push(row);
    }
    return matrix;
  }

  // Precedence Levels:
  // 1. Comparison: =, <>, <, <=, >, >=
  // 2. Concatenation: &
  // 3. Add / Sub: +, -
  // 4. Mul / Div: *, /
  // 5. Power: ^
  // 6. Unary: +, -
  // 7. Primary: Number, String, Bool, Cell, Function Call, (Expr)

  function parseExpression(): any {
    return parseComparison();
  }

  function parseComparison(): any {
    let left = parseConcat();
    while (peek()?.type === "OP" && ["=", "<>", "<", "<=", ">", ">="].includes(peek()!.value as string)) {
      const op = consume().value as string;
      const right = parseConcat();
      if (op === "=") left = left == right;
      else if (op === "<>") left = left != right;
      else if (op === "<") left = Number(left) < Number(right);
      else if (op === "<=") left = Number(left) <= Number(right);
      else if (op === ">") left = Number(left) > Number(right);
      else if (op === ">=") left = Number(left) >= Number(right);
    }
    return left;
  }

  function parseConcat(): any {
    let left = parseAddSub();
    while (peek()?.type === "OP" && peek()!.value === "&") {
      consume();
      const right = parseAddSub();
      left = `${String(left ?? "")}${String(right ?? "")}`;
    }
    return left;
  }

  function parseAddSub(): any {
    let left = parseMulDiv();
    while (peek()?.type === "OP" && ["+", "-"].includes(peek()!.value as string)) {
      const op = consume().value as string;
      const right = parseMulDiv();
      if (op === "+") left = Number(left) + Number(right);
      else left = Number(left) - Number(right);
    }
    return left;
  }

  function parseMulDiv(): any {
    let left = parsePower();
    while (peek()?.type === "OP" && ["*", "/"].includes(peek()!.value as string)) {
      const op = consume().value as string;
      const right = parsePower();
      if (op === "*") left = Number(left) * Number(right);
      else {
        const denom = Number(right);
        if (denom === 0) return "#DIV/0!";
        left = Number(left) / denom;
      }
    }
    return left;
  }

  function parsePower(): any {
    let left = parseUnary();
    while (peek()?.type === "OP" && peek()!.value === "^") {
      consume();
      const right = parseUnary();
      left = Math.pow(Number(left), Number(right));
    }
    return left;
  }

  function parseUnary(): any {
    if (peek()?.type === "OP" && ["+", "-"].includes(peek()!.value as string)) {
      const op = consume().value as string;
      const operand = parseUnary();
      return op === "-" ? -Number(operand) : Number(operand);
    }
    return parsePrimary();
  }

  function parsePrimary(): any {
    const tok = peek();
    if (!tok) return 0;

    if (tok.type === "NUMBER") {
      consume();
      // check trailing % operator
      if (peek()?.type === "OP" && peek()!.value === "%") {
        consume();
        return (tok.value as number) / 100;
      }
      return tok.value;
    }

    if (tok.type === "STRING" || tok.type === "BOOLEAN") {
      consume();
      return tok.value;
    }

    if (tok.type === "CELL") {
      consume();
      const cell = parseCellAddress(tok.value as string);
      if (!cell) return "#REF!";
      return getCellValue(cell.r, cell.c);
    }

    if (tok.type === "RANGE") {
      consume();
      return tok.value; // pass range string to function
    }

    if (tok.type === "LPAREN") {
      consume();
      const val = parseExpression();
      if (peek()?.type === "RPAREN") consume();
      return val;
    }

    if (tok.type === "IDENT") {
      const funcName = (consume().value as string).toUpperCase();
      if (peek()?.type === "LPAREN") {
        consume(); // skip (
        const args: any[] = [];
        if (peek()?.type !== "RPAREN") {
          while (true) {
            args.push(parseArgument());
            if (peek()?.type === "COMMA") {
              consume();
            } else {
              break;
            }
          }
        }
        if (peek()?.type === "RPAREN") consume(); // skip )
        return executeExcelFunction(funcName, args, { dataset, getCellValue, getRangeValues, getRange2DMatrix });
      }
      return "#NAME?";
    }

    consume();
    return 0;
  }

  function parseArgument(): any {
    // If the argument is an unquoted Range (e.g. A1:B10)
    if (peek()?.type === "RANGE") {
      return consume().value as string;
    }
    return parseExpression();
  }

  try {
    const result = parseExpression();
    if (typeof result === "number") {
      if (!Number.isFinite(result)) return isNaN(result) ? "#NUM!" : "#DIV/0!";
      // Round very tiny precision errors
      return Math.round(result * 1e10) / 1e10;
    }
    return result ?? "";
  } catch {
    return "#ERROR!";
  }
}
