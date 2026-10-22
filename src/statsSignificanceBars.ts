export interface SignificanceComparison {
  group1: string | number;
  group2: string | number;
  pValue: number;
  yPosition: number;
  barHeight?: number;
}

export interface SignificanceBracketLayout {
  group1: string | number;
  group2: string | number;
  stars: string;
  pValue: number;
  yBar: number;
  yTick: number;
  yText: number;
}

export function pValueToStars(p: number): string {
  if (p < 0.001) return "***";
  if (p < 0.01) return "**";
  if (p < 0.05) return "*";
  return "ns";
}

export function calculateSignificanceBrackets(
  comparisons: SignificanceComparison[],
  stepOffset = 0.08
): SignificanceBracketLayout[] {
  return comparisons.map((comp, idx) => {
    const stars = pValueToStars(comp.pValue);
    const yBar = comp.yPosition * (1 + idx * stepOffset);
    const tickDepth = comp.barHeight ?? comp.yPosition * 0.02;
    const yTick = yBar - tickDepth;
    const yText = yBar + tickDepth * 0.5;

    return {
      group1: comp.group1,
      group2: comp.group2,
      stars,
      pValue: comp.pValue,
      yBar,
      yTick,
      yText,
    };
  });
}

export function buildPlotlySignificanceShapes(
  brackets: SignificanceBracketLayout[]
): { shapes: any[]; annotations: any[] } {
  const shapes: any[] = [];
  const annotations: any[] = [];

  for (const b of brackets) {
    // Horizontal bridge line
    shapes.push({
      type: "line",
      x0: b.group1,
      x1: b.group2,
      y0: b.yBar,
      y1: b.yBar,
      xref: "x",
      yref: "y",
      line: { color: "#1f2937", width: 1.5 },
    });

    // Left vertical drop tick
    shapes.push({
      type: "line",
      x0: b.group1,
      x1: b.group1,
      y0: b.yBar,
      y1: b.yTick,
      xref: "x",
      yref: "y",
      line: { color: "#1f2937", width: 1.5 },
    });

    // Right vertical drop tick
    shapes.push({
      type: "line",
      x0: b.group2,
      x1: b.group2,
      y0: b.yBar,
      y1: b.yTick,
      xref: "x",
      yref: "y",
      line: { color: "#1f2937", width: 1.5 },
    });

    // Centered star annotation
    annotations.push({
      x: (Number(b.group1) + Number(b.group2)) / 2 || b.group1,
      y: b.yText,
      xref: "x",
      yref: "y",
      text: b.stars,
      showarrow: false,
      font: { size: 14, color: "#111827", family: "Helvetica, Arial, sans-serif" },
    });
  }

  return { shapes, annotations };
}

export function buildGgplotSignificanceCode(
  brackets: SignificanceBracketLayout[]
): string[] {
  const lines: string[] = [];
  for (const b of brackets) {
    const x1 = typeof b.group1 === "string" ? JSON.stringify(b.group1) : b.group1;
    const x2 = typeof b.group2 === "string" ? JSON.stringify(b.group2) : b.group2;
    lines.push(
      `# Significance bracket: ${b.group1} vs ${b.group2} (${b.stars}, p = ${b.pValue})`,
      `p <- p + annotate("segment", x = ${x1}, xend = ${x2}, y = ${b.yBar}, yend = ${b.yBar}, colour = "#222222", linewidth = 0.5)`,
      `p <- p + annotate("segment", x = ${x1}, xend = ${x1}, y = ${b.yBar}, yend = ${b.yTick}, colour = "#222222", linewidth = 0.5)`,
      `p <- p + annotate("segment", x = ${x2}, xend = ${x2}, y = ${b.yBar}, yend = ${b.yTick}, colour = "#222222", linewidth = 0.5)`,
      `p <- p + annotate("text", x = mean(c(${x1}, ${x2})), y = ${b.yText}, label = "${b.stars}", size = 4.5, fontface = "bold")`
    );
  }
  return lines;
}
