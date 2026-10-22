import { Dataset, PlotSpec } from "../../types";

export interface PanelBanner {
  letter: "A" | "B" | "C" | "D" | "E";
  banner: string;
  content: string;
}

export const PANEL_EDIT_BANNERS: PanelBanner[] = [
  { letter: "A", banner: "# PANEL A -- Mfuzz soft-clustering trajectories (c = 5), nested 2x3 sub-grid", content: "Mfuzz cluster trajectory lines" },
  { letter: "B", banner: "# PANEL B -- Functional enrichment dot plot per Mfuzz cluster", content: "GO/KEGG/Reactome dot plot" },
  { letter: "C", banner: "# PANEL C -- Global host expression heatmap, rows ordered by Mfuzz cluster", content: "log2FC heatmap + cluster color strip" },
  { letter: "D", banner: "# PANEL D -- TF regulon network + TF activity heatmap (decoupler + CollecTRI)", content: "TF-cluster bipartite network + activity heatmap" },
  { letter: "E", banner: "# PANEL E -- Replicate-level biomarker validation (one gene per cluster)", content: "5 per-gene replicate trajectory subplots" },
];

export type PanelLetter = typeof PANEL_EDIT_BANNERS[number]["letter"];
export type ScriptLanguage = "python" | "r";

export function detectedPanelLetters(code: string): PanelLetter[] {
  return PANEL_EDIT_BANNERS.filter((panel) => code.includes(panel.banner)).map((panel) => panel.letter);
}

export function panelEditPrompt(letter: PanelLetter, request: string): string {
  const rows = PANEL_EDIT_BANNERS.map((panel) => `| ${panel.letter} | \`${panel.banner}\` | ${panel.content} |`).join("\n");
  return `# Scoped Iris panel edit

Edit exactly one panel of \`iris_host_dashboard_panel.py\`.

\`iris_host_dashboard_panel.py\` is a self-contained Iris Code-mode script. It must expose exactly one top-level matplotlib object named \`fig\`; Iris reads that variable after executing the script. Do not call \`plt.close(fig)\`, and do not wrap the script in an \`if __name__ == "__main__":\` guard.

Panels:

| Letter | Banner comment to search for | Content |
|---|---|---|
${rows}

Target panel: ${letter}

Rules:
1. Touch only the code between the target panel banner and the next panel banner. For Panel E, stop before the render-then-verify block.
2. Do not rename or reassign shared read-only inputs decoded near the top of the file: \`memb\`, \`enr_full\`, \`lrt\` or \`lrt_trim\`, \`tf_act\`, \`tf_clust\`, \`counts\` or \`counts_trim\`, \`TP_COLS\`, \`CLUSTER_COLORS\`, and \`BIOMARKERS\`.
3. Keep that panel's \`_label_panel(ax, "${letter}")\` call exactly once.
4. Preserve the Iris contract: \`fig\` stays the single top-level figure object.
5. After editing, run the render-then-verify check at the bottom of the file and confirm it reports zero text overlaps.

Requested change:

${request.trim() || "[Describe the single-panel change here.]"}
`;
}

export function createChatGptPrompt(
  language: ScriptLanguage,
  code: string,
  dataset: Dataset,
  spec: PlotSpec,
  request: string
): string {
  const colSummary = dataset.columns.map((c) => `${c} (${dataset.types[c] || "string"})`).join(", ");
  const langName = language === "r" ? "R (ggplot2)" : "Python";
  return `# Task: Edit Iris Scientific Studio Visualization

You are an expert scientific visualization assistant editing an Iris script.

## Environment & Contract
- Target language: ${langName}
- Iris execution contract:
${language === "r"
  ? "  - The script must produce a ggplot object named `p` or be runnable to render the plot."
  : "  - Expose exactly one top-level matplotlib/plotly/altair figure object named `fig`.\n  - Iris reads `fig` directly. Do NOT call `plt.show()` or `plt.close(fig)`.\n  - Do NOT wrap the code in `if __name__ == '__main__':`."
}
- Available data columns: ${colSummary}
- Active chart type: ${spec.graphType}
- Theme & Palette: ${spec.theme} / ${spec.palette}
- Chart Title: "${spec.title || "Untitled"}"

## Current Code
\`\`\`${language}
${code}
\`\`\`

## User Modification Request
${request.trim() || "Improve layout, readability, and publication styling while preserving data integrity."}

## Output Instructions
Return ONLY the updated executable ${langName} code inside a markdown code block. Do NOT include explanatory text outside the code block.
`;
}
