import { FriendlyRenderIssue } from "../types";

export function friendlyRenderIssue(rawInput: string, engine: FriendlyRenderIssue["engine"]): FriendlyRenderIssue {
  const raw = rawInput.trim() || `${engine} render failed.`;
  const moduleMatch =
    raw.match(/ModuleNotFoundError:\s*No module named ['"]([^'"]+)['"]/) ||
    raw.match(/there is no package called ['"]([^'"]+)['"]/i) ||
    raw.match(/library\(([^)]+)\).*there is no package/i);
  if (moduleMatch) {
    const name = moduleMatch[1].replace(/['"]/g, "").trim();
    return {
      engine,
      kind: "Missing dependency",
      summary: `${engine} cannot render this figure because the package '${name}' is not installed in Iris' render environment.`,
      fix:
        engine === "Python"
          ? "Open Renderer status and run Repair Python, or install the package into Iris' managed Python environment."
          : "Open Renderer status and install the missing R package, then render again.",
      raw,
    };
  }
  if (/(file not found|no such file or directory|invalid file path|none type|host\.artifact_path|ignored host\.artifact_path)/i.test(raw)) {
    return {
      engine,
      kind: "Missing file",
      summary: "The script refers to a file or host artifact that Iris cannot access from its local render environment.",
      fix: "Place the data file beside the loaded script and use a relative path, or import the table into Iris before rendering.",
      raw,
    };
  }
  const undefinedMatch =
    raw.match(/NameError:\s*name ['"]([^'"]+)['"] is not defined/) ||
    raw.match(/could not find function ['"]([^'"]+)['"]/i) ||
    raw.match(/object ['"]([^'"]+)['"] not found/i);
  if (undefinedMatch) {
    return {
      engine,
      kind: "Undefined helper",
      summary: `The script calls '${undefinedMatch[1]}', but that helper or variable is not defined inside the render script.`,
      fix: "Paste the helper definition into the script, remove the call, or use Iris' built-in style controls instead.",
      raw,
    };
  }
  if (/(no figure to render|no matplotlib figure|produced no output figure|renderer did not produce|no plotly figure|no output figure|empty canvas)/i.test(raw)) {
    return {
      engine,
      kind: "No figure exposed",
      summary: "The script ran, but Iris could not find a figure object to display.",
      fix: "Expose the final figure as 'fig' or 'chart', or leave the matplotlib figure open instead of closing it.",
      raw,
    };
  }
  if (/(unsupported|altair.*renderer|vl-convert|cannot apply|composite script)/i.test(raw)) {
    return {
      engine,
      kind: "Unsupported script source",
      summary: "This script uses a rendering path or source format that Iris can only partially control.",
      fix: "Render it as a code-backed figure, or convert/split it into visual graph panels before editing individual parts.",
      raw,
    };
  }
  if (/timed out/i.test(raw)) {
    return {
      engine,
      kind: "Render timed out",
      summary: "The render took too long and Iris stopped waiting.",
      fix: "Try a smaller dataset, reduce figure complexity, or render once manually after turning Auto-render off.",
      raw,
    };
  }
  if (/(could not interpret value|aesthetics are not valid|object .* not found|unknown column|undefined columns selected)/i.test(raw)) {
    return {
      engine,
      kind: "Column mismatch",
      summary: "The script refers to a column or aesthetic that does not exist in the active dataset.",
      fix: "Check the selected data table and update the x, y, colour, size, or label fields to existing column names.",
      raw,
    };
  }
  return {
    engine,
    kind: "Render failed",
    summary: `${engine} could not render this figure.`,
    fix: "Open the code tab, check the highlighted script, and render again after correcting the failing line.",
    raw,
  };
}

export function friendlyRenderAlert(issue: FriendlyRenderIssue): string {
  return `${issue.kind}\n\n${issue.summary}\n\nSuggested fix: ${issue.fix}`;
}
