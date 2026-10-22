import { Dataset } from "./types";
import { parseDatasetFromCode } from "./sampleData";

export interface SyntaxDiagnostic {
  severity: "error" | "warning" | "info";
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

export interface CodeAnalysisResult {
  valid: boolean;
  diagnostics: SyntaxDiagnostic[];
  contractFulfilled: boolean;
  reproducibleData: {
    canExtract: boolean;
    columns: string[];
    rowCount: number;
  };
}

/**
 * Levenshtein distance for fuzzy matching misspelled column names.
 */
function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix: number[][] = [];
  for (let i = 0; i <= bn; ++i) matrix[i] = [i];
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;

  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

function findClosestColumn(target: string, columns: string[]): string | null {
  if (!columns.length) return null;
  let bestMatch: string | null = null;
  let minDistance = Infinity;

  const targetLower = target.toLowerCase();
  for (const col of columns) {
    const colLower = col.toLowerCase();
    // Direct case-insensitive or punctuation match
    if (targetLower === colLower || targetLower.replace(/[-_.]/g, "") === colLower.replace(/[-_.]/g, "")) {
      return col;
    }
    const dist = levenshtein(targetLower, colLower);
    if (dist < minDistance && dist <= Math.max(3, Math.floor(target.length / 2))) {
      minDistance = dist;
      bestMatch = col;
    }
  }
  return bestMatch;
}

/**
 * Check bracket nesting balance and unclosed string literals.
 */
function checkBracketAndStringBalance(code: string, language: "python" | "r"): SyntaxDiagnostic[] {
  const diagnostics: SyntaxDiagnostic[] = [];
  const lines = code.split("\n");

  const bracketStack: Array<{ char: string; line: number; col: number }> = [];
  let inTripleDouble = false;
  let inTripleSingle = false;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false; // R variable escaping `col name`
  let stringStartLine = 1;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const lineNum = lineIdx + 1;

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      const prevChar = c > 0 ? line[c - 1] : "";
      const isEscaped = prevChar === "\\" && (c < 2 || line[c - 2] !== "\\");

      // Handle python triple quotes
      if (language === "python") {
        if (!inSingleQuote && !inDoubleQuote) {
          if (line.slice(c, c + 3) === '"""' && !isEscaped) {
            inTripleDouble = !inTripleDouble;
            c += 2;
            if (inTripleDouble) stringStartLine = lineNum;
            continue;
          }
          if (line.slice(c, c + 3) === "'''" && !isEscaped) {
            inTripleSingle = !inTripleSingle;
            c += 2;
            if (inTripleSingle) stringStartLine = lineNum;
            continue;
          }
        }
      }

      if (inTripleDouble || inTripleSingle) {
        continue; // inside multiline triple quote
      }

      // Handle R backticks
      if (language === "r" && !inSingleQuote && !inDoubleQuote) {
        if (char === "`" && !isEscaped) {
          inBacktick = !inBacktick;
          continue;
        }
      }
      if (inBacktick) continue;

      // Handle comments
      if (!inSingleQuote && !inDoubleQuote && char === "#") {
        break; // rest of line is comment
      }

      // Handle single / double quotes
      if (!isEscaped) {
        if (char === '"' && !inSingleQuote) {
          inDoubleQuote = !inDoubleQuote;
          if (inDoubleQuote) stringStartLine = lineNum;
          continue;
        }
        if (char === "'" && !inDoubleQuote) {
          inSingleQuote = !inSingleQuote;
          if (inSingleQuote) stringStartLine = lineNum;
          continue;
        }
      }

      // Inside string literal
      if (inSingleQuote || inDoubleQuote) {
        continue;
      }

      // Check brackets
      if (char === "(" || char === "[" || char === "{") {
        bracketStack.push({ char, line: lineNum, col: c + 1 });
      } else if (char === ")" || char === "]" || char === "}") {
        const expected = char === ")" ? "(" : char === "]" ? "[" : "{";
        const top = bracketStack.pop();
        if (!top) {
          diagnostics.push({
            severity: "error",
            message: `Unexpected closing '${char}' without matching opening bracket`,
            line: lineNum,
            column: c + 1,
          });
        } else if (top.char !== expected) {
          diagnostics.push({
            severity: "error",
            message: `Mismatched bracket: expected '${top.char === "(" ? ")" : top.char === "[" ? "]" : "}"}' but found '${char}'`,
            line: lineNum,
            column: c + 1,
          });
        }
      }
    }

    // In Python, unclosed single-line strings at end of line (unless continued with \)
    if (language === "python" && (inSingleQuote || inDoubleQuote) && !inTripleDouble && !inTripleSingle) {
      const isLineContinued = line.trimEnd().endsWith("\\");
      if (!isLineContinued) {
        diagnostics.push({
          severity: "error",
          message: `Unclosed string literal starting on line ${stringStartLine}`,
          line: stringStartLine,
        });
        inSingleQuote = false;
        inDoubleQuote = false;
      }
    }
  }

  // If still unclosed at end of entire code
  if (language === "r" && (inSingleQuote || inDoubleQuote)) {
    diagnostics.push({
      severity: "error",
      message: `Unclosed string literal starting on line ${stringStartLine}`,
      line: stringStartLine,
    });
  }

  if (inTripleDouble || inTripleSingle) {
    diagnostics.push({
      severity: "error",
      message: `Unclosed triple-quoted string starting on line ${stringStartLine}`,
      line: stringStartLine,
    });
  }

  if (bracketStack.length > 0) {
    const unclosed = bracketStack[bracketStack.length - 1];
    diagnostics.push({
      severity: "error",
      message: `Unclosed bracket '${unclosed.char}' on line ${unclosed.line}`,
      line: unclosed.line,
      column: unclosed.col,
    });
  }

  return diagnostics;
}

/**
 * Scan Iris script execution contract rules.
 */
function checkIrisContract(code: string, language: "python" | "r"): { fulfilled: boolean; diagnostics: SyntaxDiagnostic[] } {
  const diagnostics: SyntaxDiagnostic[] = [];
  let fulfilled = true;

  if (language === "python") {
    // Contract 1: Must declare fig
    const hasFigAssignment = /\bfig\s*(=|,)/.test(code) || /\bfig\b/.test(code);
    if (!hasFigAssignment) {
      fulfilled = false;
      diagnostics.push({
        severity: "warning",
        message: "Iris Python contract: script should expose a top-level figure object named 'fig' (e.g. `fig, ax = plt.subplots()` or `fig = px.scatter(...)`).",
        suggestion: "fig, ax = plt.subplots()",
      });
    }

    // Contract 2: Do not call plt.show()
    if (/\bplt\.show\s*\(/.test(code)) {
      diagnostics.push({
        severity: "warning",
        message: "Calling `plt.show()` can block execution or freeze the preview. Iris renders `fig` directly.",
        suggestion: "Remove `plt.show()`",
      });
    }

    // Contract 3: Do not call plt.close(fig)
    if (/\bplt\.close\s*\(\s*fig\s*\)/.test(code)) {
      diagnostics.push({
        severity: "warning",
        message: "Calling `plt.close(fig)` destroys the figure before Iris can inspect its artists and save high-res exports.",
        suggestion: "Remove `plt.close(fig)`",
      });
    }

    // Contract 4: Main guard unnecessary
    if (/if\s+__name__\s*==\s*['"]__main__['"]\s*:/.test(code)) {
      diagnostics.push({
        severity: "info",
        message: "Iris executes scripts directly in an active Python environment; `if __name__ == '__main__':` guards are not needed.",
      });
    }
  } else {
    // R contract: should assign p or evaluate p
    const hasPAssignment = /\bp\s*(?:<-|=)/.test(code) || /\bp\s*$/.test(code.trim());
    if (!hasPAssignment) {
      diagnostics.push({
        severity: "warning",
        message: "Iris R contract: script should produce a ggplot object named 'p' (e.g. `p <- ggplot(...)`).",
        suggestion: "p <- ggplot(...) + ...",
      });
    }
  }

  return { fulfilled, diagnostics };
}

/**
 * Check column references in the code against the active dataset.
 */
function checkColumnReferences(code: string, dataset: Dataset, language: "python" | "r"): SyntaxDiagnostic[] {
  const diagnostics: SyntaxDiagnostic[] = [];
  if (!dataset.columns.length) return diagnostics;

  const datasetCols = new Set(dataset.columns);
  const detectedCols: string[] = [];

  if (language === "python") {
    // e.g. df['Column'] or df["Column"]
    const colBracketMatches = code.matchAll(/\bdf\s*\[\s*['"]([^'"]+)['"]\s*\]/g);
    for (const match of colBracketMatches) detectedCols.push(match[1]);

    // e.g. x="Column", y="Column", color="Column", hue="Column"
    const kwargMatches = code.matchAll(/\b(?:x|y|color|hue|size|style|facet_col|facet_row)\s*=\s*['"]([^'"]+)['"]/g);
    for (const match of kwargMatches) detectedCols.push(match[1]);
  } else {
    // R: df$Column or df$`Column` or aes(x = Column, y = `Column`)
    const dollarMatches = code.matchAll(/\bdf\$`?([a-zA-Z0-9_.-]+)`?/g);
    for (const match of dollarMatches) detectedCols.push(match[1]);

    const aesMatches = code.matchAll(/\baes\s*\([^)]*\b(?:x|y|fill|colour|color|shape|size)\s*=\s*`?([a-zA-Z0-9_.-]+)`?/g);
    for (const match of aesMatches) detectedCols.push(match[1]);
  }

  const warned = new Set<string>();
  for (const col of detectedCols) {
    if (!datasetCols.has(col) && !warned.has(col)) {
      warned.add(col);
      const closest = findClosestColumn(col, dataset.columns);
      diagnostics.push({
        severity: "warning",
        message: closest
          ? `Column "${col}" referenced in code was not found in active dataset. Did you mean "${closest}"?`
          : `Column "${col}" referenced in code was not found in active dataset.`,
        suggestion: closest ?? undefined,
      });
    }
  }

  return diagnostics;
}

/**
 * Comprehensive static scanner for Iris scripts.
 */
export function scanCodeSyntax(
  code: string,
  language: "python" | "r",
  dataset: Dataset
): CodeAnalysisResult {
  if (!code.trim()) {
    return {
      valid: true,
      diagnostics: [],
      contractFulfilled: false,
      reproducibleData: { canExtract: false, columns: [], rowCount: 0 },
    };
  }

  const bracketDiagnostics = checkBracketAndStringBalance(code, language);
  const contractCheck = checkIrisContract(code, language);
  const columnDiagnostics = checkColumnReferences(code, dataset, language);

  const allDiagnostics = [
    ...bracketDiagnostics,
    ...contractCheck.diagnostics,
    ...columnDiagnostics,
  ];

  const hasErrors = allDiagnostics.some((d) => d.severity === "error");

  // Check data parsing & faithful reproduction
  let canExtract = false;
  let extractedCols: string[] = [];
  let extractedRows = 0;
  try {
    const extracted = parseDatasetFromCode("reproduced", code);
    if (extracted.columns.length > 0 && extracted.rows.length > 0) {
      canExtract = true;
      extractedCols = extracted.columns;
      extractedRows = extracted.rows.length;
    }
  } catch {
    canExtract = false;
  }

  return {
    valid: !hasErrors,
    diagnostics: allDiagnostics,
    contractFulfilled: contractCheck.fulfilled,
    reproducibleData: {
      canExtract,
      columns: extractedCols,
      rowCount: extractedRows,
    },
  };
}
