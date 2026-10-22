import { STAT_TOOLS, StatTool } from "../../statsToolkit";

export function groupedTools(): [string, typeof STAT_TOOLS][] {
  const order: string[] = [];
  const byGroup: Record<string, typeof STAT_TOOLS> = {};
  for (const t of STAT_TOOLS) {
    if (!byGroup[t.group]) { byGroup[t.group] = []; order.push(t.group); }
    byGroup[t.group].push(t);
  }
  return order.map((g) => [g, byGroup[g]]);
}

export function toolIcon(tool: StatTool): string {
  switch (tool) {
    case "batchProfile": return "All";
    case "describe": return "Σ";
    case "normality": return "Q-Q";
    case "ttest1":
    case "ttest2":
    case "ttestPaired": return "t";
    case "wilcoxon": return "U";
    case "kruskal": return "H";
    case "anova": return "F";
    case "chisq": return "χ²";
    case "correlation": return "r";
    case "regression": return "R²";
    case "ic50": return "IC₅₀";
    case "survival": return "KM";
    default: return "•";
  }
}

export function numLabel(tool: StatTool, slot: "num" | "num2"): string {
  if (tool === "correlation" || tool === "regression") return slot === "num" ? "X column" : "Y column";
  if (tool === "ic50") return slot === "num" ? "Concentration (X)" : "Response (Y)";
  if (tool === "survival") return slot === "num" ? "Time (duration)" : "Status (1=Event, 0=Censor)";
  if (tool === "ttestPaired") return slot === "num" ? "Column A" : "Column B";
  return slot === "num" ? "Value column" : "Column 2";
}

export function isOptionalGroup(tool: StatTool): boolean {
  return tool === "describe" || tool === "normality";
}

export function safeColumnFromJson(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.column === "string" ? parsed.column : "";
  } catch {
    return "";
  }
}
