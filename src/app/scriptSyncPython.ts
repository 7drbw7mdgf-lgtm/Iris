import { Dataset } from "../types";
import { PythonGraphCandidate } from "./types";
import {
  codeValueForKey,
  firstExistingColumn,
  graphTypeFromPanelMetadata,
  inferPythonLibraryFromCode,
  inferPythonGraphTitle,
  inferGraphTypeFromCode,
  inferSpecFromCode,
} from "./specInference";

export {
  codeValueForKey,
  firstExistingColumn,
  graphTypeFromPanelMetadata,
  inferPythonLibraryFromCode,
  inferPythonGraphTitle,
  inferGraphTypeFromCode,
  inferSpecFromCode,
};

export const IRIS_PY_SYNC_START = "# --- Iris synced graph: start ---";
export const IRIS_PY_SYNC_END = "# --- Iris synced graph: end ---";

export function pythonAssignedLiteral(code: string, name: string): string {
  const match = new RegExp(`\\b${name}\\s*=\\s*[\\[\\(]`).exec(code);
  if (!match) return "";
  const start = match.index + match[0].lastIndexOf(match[0].trim().slice(-1));
  const opener = code[start];
  const closer = opener === "[" ? "]" : ")";
  let depth = 0;
  let quote = "";
  let triple = false;
  let escaped = false;
  for (let i = start; i < code.length; i += 1) {
    const char = code[i];
    const next3 = code.slice(i, i + 3);
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (triple && next3 === quote.repeat(3)) {
        i += 2;
        quote = "";
        triple = false;
        continue;
      }
      if (!triple && char === quote) quote = "";
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      triple = next3 === char.repeat(3);
      if (triple) i += 2;
      continue;
    }
    if (char === "#") {
      const newline = code.indexOf("\n", i);
      if (newline < 0) break;
      i = newline;
      continue;
    }
    if (char === opener) depth += 1;
    if (char === closer) {
      depth -= 1;
      if (depth === 0) return code.slice(start, i + 1);
    }
  }
  return "";
}

export function splitPythonDictLiterals(listLiteral: string): string[] {
  const dicts: string[] = [];
  let start = -1;
  let depth = 0;
  let quote = "";
  let triple = false;
  let escaped = false;
  for (let i = 0; i < listLiteral.length; i += 1) {
    const char = listLiteral[i];
    const next3 = listLiteral.slice(i, i + 3);
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (triple && next3 === quote.repeat(3)) {
        i += 2;
        quote = "";
        triple = false;
        continue;
      }
      if (!triple && char === quote) quote = "";
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      triple = next3 === char.repeat(3);
      if (triple) i += 2;
      continue;
    }
    if (char === "{") {
      if (depth === 0) start = i;
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        dicts.push(listLiteral.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return dicts;
}

export function pythonDictStringValue(dictLiteral: string, keys: string[]): string {
  for (const key of keys) {
    const quoted = dictLiteral.match(new RegExp(`["']${key}["']\\s*:\\s*["']([^"']+)["']`, "i"));
    if (quoted?.[1]) return quoted[1].trim();
    const bare = dictLiteral.match(new RegExp(`\\b${key}\\b\\s*:\\s*["']([^"']+)["']`, "i"));
    if (bare?.[1]) return bare[1].trim();
  }
  return "";
}

export function pythonDictListValue(dictLiteral: string, keys: string[]): string[] {
  for (const key of keys) {
    const match =
      dictLiteral.match(new RegExp(`["']${key}["']\\s*:\\s*\\[([^\\]]+)\\]`, "i")) ||
      dictLiteral.match(new RegExp(`\\b${key}\\b\\s*:\\s*\\[([^\\]]+)\\]`, "i"));
    if (match?.[1]) {
      return Array.from(match[1].matchAll(/["']([^"']+)["']/g))
        .map((entry) => entry[1].trim())
        .filter(Boolean);
    }
  }
  return [];
}

export function pythonIdentifier(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

export function stripIrisPythonSyncedBlock(code: string): string {
  const start = code.indexOf(IRIS_PY_SYNC_START);
  const end = code.indexOf(IRIS_PY_SYNC_END);
  if (start >= 0 && end >= start) {
    return `${code.slice(0, start)}${code.slice(end + IRIS_PY_SYNC_END.length)}`.trim();
  }
  return code;
}

export function pythonScriptPreamble(code: string): string {
  const withoutSyncedBlock = stripIrisPythonSyncedBlock(code);
  const lines = withoutSyncedBlock.split(/\r?\n/);
  const firstPlotLine = lines.findIndex((line) => {
    const trimmed = line.trim();
    return (
      /\bpx\./.test(trimmed) ||
      /\bgo\./.test(trimmed) ||
      /\bsns\./.test(trimmed) ||
      /\bplt\./.test(trimmed) ||
      /\balt\.Chart\b/.test(trimmed) ||
      /^fig\s*=/.test(trimmed) ||
      /^chart\s*=/.test(trimmed)
    );
  });
  const preambleLines = firstPlotLine >= 0 ? lines.slice(0, firstPlotLine) : lines;
  return preambleLines.join("\n").trim();
}

export function syncPythonScriptWithVisualCode(currentCode: string, generatedCode: string, name: string | null): string {
  const preamble = pythonScriptPreamble(currentCode);
  const header = name
    ? `# Opened from ${name}. Setup above is preserved; Iris rewrites the graph block below from the visual controls.`
    : "# Iris rewrites the graph block below from the visual controls.";
  return (
    [preamble, preamble ? "" : "", header, IRIS_PY_SYNC_START, generatedCode.trim(), IRIS_PY_SYNC_END]
      .filter((part, index) => part || index === 1)
      .join("\n")
      .trim() + "\n"
  );
}

export function stripPythonDisplayCalls(lines: string[]): string[] {
  return lines.filter((line) => {
    const trimmed = line.trim();
    return (
      !/^plt\.show\s*\(/.test(trimmed) &&
      !/^(?:plt|fig|chart)\.savefig\s*\(/.test(trimmed) &&
      !/^fig\.show\s*\(/.test(trimmed) &&
      !/^chart\.show\s*\(/.test(trimmed)
    );
  });
}

export function cleanImportedPythonCode(code: string): string {
  return stripPythonDisplayCalls(stripIrisPythonSyncedBlock(code).split(/\r?\n/)).join("\n").trim() + "\n";
}

export function pythonGraphRootLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return false;
  if (/^plt\.figure\s*\(/.test(trimmed)) return true;
  if (/^(?:plt|sns)\.(?:scatter|plot|bar|barh|hist|boxplot|violinplot|imshow|stem|errorbar|scatterplot|lineplot|barplot|histplot|kdeplot|heatmap|stripplot|swarmplot|regplot|lmplot|pairplot)\s*\(/.test(trimmed)) return true;
  if (/^(?:fig\w*|chart\w*|plot\w*)\s*=\s*(?:px\.|go\.Figure|alt\.Chart|plt\.figure|sns\.)/.test(trimmed)) return true;
  if (/^(?:fig\w*\s*,\s*)?(?:ax\w*|axs\w*)\s*=\s*plt\.subplots?\s*\(/.test(trimmed)) return true;
  return false;
}

export function pythonLineIsFigureSetup(line: string): boolean {
  const trimmed = line.trim();
  return (
    /^plt\.figure\s*\(/.test(trimmed) ||
    /^(?:fig\w*)\s*=\s*plt\.figure\s*\(/.test(trimmed) ||
    /^(?:fig\w*\s*,\s*)?(?:ax\w*|axs\w*)\s*=\s*plt\.subplots?\s*\(/.test(trimmed)
  );
}

export function pythonLineIsDisplayBoundary(line: string): boolean {
  const trimmed = line.trim();
  return (
    /^plt\.show\s*\(/.test(trimmed) ||
    /^fig\.show\s*\(/.test(trimmed) ||
    /^chart\.show\s*\(/.test(trimmed) ||
    /^(?:plt|fig|chart)\.savefig\s*\(/.test(trimmed)
  );
}

export function pythonLineContainsPlotCall(line: string): boolean {
  const trimmed = line.trim();
  return (
    /(?:plt|ax\w*|axs\w*(?:\[[^\]]+\])?)\.(?:scatter|plot|bar|barh|hist|boxplot|violinplot|imshow|stem|errorbar)\s*\(/.test(trimmed) ||
    /\bsns\.(?:scatterplot|lineplot|barplot|histplot|kdeplot|boxplot|violinplot|heatmap|stripplot|swarmplot|regplot|lmplot|pairplot)\s*\(/.test(trimmed) ||
    /\bpx\.(?:scatter|line|bar|histogram|box|violin|density_contour|imshow|area|pie)\s*\(/.test(trimmed) ||
    /\balt\.Chart\b/.test(trimmed)
  );
}

export function splitPythonShowBlocks(lines: string[]): string[] {
  const preamble: string[] = [];
  const blocks: string[][] = [];
  let current: string[] = [];
  let seenPlot = false;

  lines.forEach((line) => {
    const isDisplayBoundary = pythonLineIsDisplayBoundary(line);
    if (!seenPlot && !pythonLineContainsPlotCall(line)) {
      preamble.push(line);
      return;
    }
    if (pythonLineContainsPlotCall(line)) seenPlot = true;
    if (isDisplayBoundary) {
      if (current.some(pythonLineContainsPlotCall)) blocks.push(current);
      current = [];
      seenPlot = false;
      return;
    }
    current.push(line);
  });
  if (current.some(pythonLineContainsPlotCall)) blocks.push(current);
  if (blocks.length <= 1) return [];
  const setup = preamble.join("\n").trim();
  return blocks.map((block) => [setup, stripPythonDisplayCalls(block).join("\n").trim()].filter(Boolean).join("\n\n"));
}

export function extractIrisPanelCandidates(name: string, code: string, ds: Dataset): PythonGraphCandidate[] {
  if (!/\bIRIS_PANELS\b/.test(code)) return [];
  const listLiteral = pythonAssignedLiteral(code, "IRIS_PANELS");
  const entries = splitPythonDictLiterals(listLiteral);
  if (entries.length <= 1) return [];
  const baseCode = cleanImportedPythonCode(code);
  const candidates = entries.flatMap((entry, index) => {
    const fnName = pythonDictStringValue(entry, ["function", "function_name", "func", "plot_function", "plotter"]);
    if (!pythonIdentifier(fnName)) return [];
    const title = pythonDictStringValue(entry, ["title", "name", "id", "label"]) || `${name} ${index + 1}`;
    const xVar = firstExistingColumn(ds, [pythonDictStringValue(entry, ["x", "x_col", "x_column"])]);
    const yCandidates = [
      pythonDictStringValue(entry, ["y", "y_col", "y_column"]),
      ...pythonDictListValue(entry, ["y_cols", "y_columns", "ys"]),
    ];
    const yVar = firstExistingColumn(ds, yCandidates);
    const groupVar = firstExistingColumn(ds, [
      pythonDictStringValue(entry, ["color", "colour", "hue", "group", "group_col", "group_column"]),
    ]);
    const sizeVar = firstExistingColumn(ds, [pythonDictStringValue(entry, ["size", "size_col", "size_column"])]);
    const graphType =
      graphTypeFromPanelMetadata(pythonDictStringValue(entry, ["chart_type", "graph_type", "type", "kind"])) ||
      inferGraphTypeFromCode(entry) ||
      inferGraphTypeFromCode(baseCode);
    const inferredSpec = { title } as PythonGraphCandidate["inferredSpec"];
    if (graphType) inferredSpec.graphType = graphType;
    if (xVar) inferredSpec.xVar = xVar;
    if (yVar) inferredSpec.yVar = yVar;
    if (groupVar && ds.types[groupVar] === "categorical") inferredSpec.groupVar = groupVar;
    if (groupVar && ds.types[groupVar] === "numeric") {
      inferredSpec.colorVar = groupVar;
      inferredSpec.groupVar = "";
    }
    if (sizeVar && ds.types[sizeVar] === "numeric") inferredSpec.sizeVar = sizeVar;
    const panelCode = [
      baseCode,
      "",
      "# Iris editable panel render: generated from IRIS_PANELS metadata.",
      "try:",
      "    import matplotlib.pyplot as plt",
      "    plt.close('all')",
      "    fig, ax = plt.subplots(figsize=(7, 5))",
      `    _iris_panel = IRIS_PANELS[${index}]`,
      `    _iris_fn = globals().get(${JSON.stringify(fnName)})`,
      "    if not callable(_iris_fn):",
      `        raise RuntimeError("IRIS_PANELS references missing function: ${fnName}")`,
      "    try:",
      "        _iris_fn(ax, df)",
      "    except TypeError:",
      "        try:",
      "            _iris_fn(ax=ax, df=df, panel=_iris_panel)",
      "        except TypeError:",
      "            try:",
      "                _iris_fn(ax=ax, data=df)",
      "            except TypeError:",
      "                _iris_fn(ax)",
      `    ax.set_title(${JSON.stringify(title)})`,
      "except Exception:",
      "    raise",
    ].join("\n");
    return [
      {
        title,
        code: panelCode,
        library: inferPythonLibraryFromCode(panelCode),
        inferredSpec,
        canSyncToVisualControls: Boolean(
          inferredSpec.xVar || inferredSpec.yVar || inferredSpec.groupVar || inferredSpec.sizeVar
        ),
        contractPanel: true,
      },
    ];
  });
  return candidates.length > 1 ? candidates : [];
}

export function extractPythonGraphCandidates(name: string, code: string, ds: Dataset): PythonGraphCandidate[] {
  const irisPanelCandidates = extractIrisPanelCandidates(name, code, ds);
  if (irisPanelCandidates.length > 1) return irisPanelCandidates;
  const cleaned = stripIrisPythonSyncedBlock(code);
  const lines = cleaned.split(/\r?\n/);
  const starts = lines.reduce<number[]>((acc, line, index) => {
    if (!pythonGraphRootLine(line)) return acc;
    const previousStart = acc[acc.length - 1];
    const followsOpenFigure =
      previousStart !== undefined &&
      pythonLineIsFigureSetup(lines[previousStart]) &&
      !lines.slice(previousStart + 1, index).some(pythonLineIsDisplayBoundary);
    if (!(followsOpenFigure && pythonLineContainsPlotCall(line))) acc.push(index);
    return acc;
  }, []);
  const showBlocks = starts.length > 1 ? [] : splitPythonShowBlocks(lines);
  const blocks =
    showBlocks.length > 1
      ? showBlocks
      : starts.length > 1
      ? starts.map((start, index) => {
          const preamble = lines.slice(0, starts[0]).join("\n").trim();
          const block = stripPythonDisplayCalls(lines.slice(start, starts[index + 1] ?? lines.length))
            .join("\n")
            .trim();
          return [preamble, block].filter(Boolean).join("\n\n");
        })
      : [cleanImportedPythonCode(code)];

  return blocks.map((block, index) => {
    const fallbackTitle = blocks.length > 1 ? `${name} ${index + 1}` : name;
    const library = inferPythonLibraryFromCode(block);
    const inferredSpec = inferSpecFromCode(block, ds);
    return {
      title: inferPythonGraphTitle(block, fallbackTitle),
      code: block,
      library,
      inferredSpec,
      canSyncToVisualControls: Boolean(
        inferredSpec.xVar || inferredSpec.yVar || inferredSpec.groupVar || inferredSpec.sizeVar
      ),
    };
  });
}
