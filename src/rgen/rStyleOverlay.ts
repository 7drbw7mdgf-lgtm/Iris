import { PlotSpec } from "../types";
import { rstr } from "./rEmbedder";

export function rStyleOverlay(spec: PlotSpec): string {
  const add: string[] = [];
  const title = spec.title.trim();
  const subtitle = spec.subtitle.trim();
  const xLabel = spec.xLabel.trim();
  const yLabel = spec.yLabel.trim();
  const font = (spec.fontFamily || "").trim();
  const base = spec.baseFontSize;
  const bg = spec.backgroundColor.trim();
  const mark = spec.markColor.trim();
  const dark = spec.theme === "dark";

  const labs: string[] = [];
  if (title) labs.push(`title = ${rstr(title)}`);
  if (subtitle) labs.push(`subtitle = ${rstr(subtitle)}`);
  if (spec.showAxisLabels === false) {
    labs.push("x = NULL");
    labs.push("y = NULL");
  } else {
    if (xLabel) labs.push(`x = ${rstr(xLabel)}`);
    if (yLabel) labs.push(`y = ${rstr(yLabel)}`);
  }
  if (labs.length) add.push(`ggplot2::labs(${labs.join(", ")})`);

  const themeArgs: string[] = [];
  themeArgs.push(`text = ggplot2::element_text(${font ? `family = ${rstr(font)}, ` : ""}size = ${base})`);
  themeArgs.push(`legend.position = ${rstr(spec.legendPos)}`);
  if (spec.axisTitleFontSize) {
    themeArgs.push(`axis.title = ggplot2::element_text(size = ${spec.axisTitleFontSize}${spec.axisTitleWeight === "bold" ? ', face = "bold"' : ""})`);
  }
  if (spec.axisTickFontSize) {
    themeArgs.push(`axis.text = ggplot2::element_text(size = ${spec.axisTickFontSize})`);
  }
  const panelBg = bg || (dark ? "#111318" : "");
  if (panelBg) {
    themeArgs.push(`panel.background = ggplot2::element_rect(fill = ${rstr(panelBg)}, colour = NA)`);
    themeArgs.push(`plot.background = ggplot2::element_rect(fill = ${rstr(panelBg)}, colour = NA)`);
  }
  if (dark) {
    themeArgs.push(`axis.text = ggplot2::element_text(colour = "#f2f2f2")`);
    themeArgs.push(`axis.title = ggplot2::element_text(colour = "#f2f2f2")`);
    themeArgs.push(`plot.title = ggplot2::element_text(colour = "#f2f2f2")`);
  }
  if (!spec.showGrid) themeArgs.push(`panel.grid = ggplot2::element_blank()`);
  add.push(`ggplot2::theme(${themeArgs.join(", ")})`);

  if (spec.xScale === "log10") add.push(`ggplot2::scale_x_log10()`);
  else if (spec.xReverse) add.push(`ggplot2::scale_x_reverse()`);

  if (spec.logY || spec.yScale === "log10") add.push(`ggplot2::scale_y_log10()`);
  else if (spec.yReverse) add.push(`ggplot2::scale_y_reverse()`);

  const xlim = spec.xMin.trim() || spec.xMax.trim() ? `xlim = c(${spec.xMin.trim() || "NA"}, ${spec.xMax.trim() || "NA"})` : "";
  const ylim = spec.yMin.trim() || spec.yMax.trim() ? `ylim = c(${spec.yMin.trim() || "NA"}, ${spec.yMax.trim() || "NA"})` : "";
  if (xlim || ylim) add.push(`ggplot2::coord_cartesian(${[xlim, ylim].filter(Boolean).join(", ")})`);
  if (spec.xTickAngle) add.push(`ggplot2::theme(axis.text.x = ggplot2::element_text(angle = ${spec.xTickAngle}, hjust = 1))`);

  if (spec.pointSize) {
    add.push(`tryCatch(ggplot2::update_geom_defaults("point", list(size = ${spec.pointSize / 2.5})), error = function(e) NULL)`);
  }
  if (spec.lineWidth) {
    add.push(`tryCatch(ggplot2::update_geom_defaults("line", list(linewidth = ${spec.lineWidth / 1.5})), error = function(e) NULL)`);
  }

  if (spec.facetVar && spec.facetVar.trim() !== "") {
    add.push(`tryCatch(ggplot2::facet_wrap(as.formula(paste("~", ${rstr(spec.facetVar.trim())}))), error = function(e) NULL)`);
  }

  const colourLayer = mark
    ? `  if (${"TRUE"}) .pp <- tryCatch(.pp + ggplot2::scale_colour_manual(values = grDevices::colorRampPalette(c(${rstr(mark)}, ${rstr(mark)}))(12)) + ggplot2::scale_fill_manual(values = grDevices::colorRampPalette(c(${rstr(mark)}, ${rstr(mark)}))(12)), error = function(e) .pp)`
    : "";

  const body = add.map((a) => `  .pp <- .pp + ${a}`).join("\n");
  return [
    "",
    "# --- Iris style overlay (Style Inspector applied on top of the code above) ---",
    ".iris_overlay <- function(.pp) {",
    "  if (!inherits(.pp, \"ggplot\")) return(.pp)",
    body,
    colourLayer,
    "  .pp",
    "}",
    "if (exists(\"p\", inherits = TRUE) && inherits(p, \"ggplot\")) {",
    "  p <- .iris_overlay(p)",
    "} else {",
    "  .iris_last <- tryCatch(ggplot2::last_plot(), error = function(e) NULL)",
    "  if (!is.null(.iris_last)) assign(\"p\", .iris_overlay(.iris_last))",
    "}",
    "",
  ].filter((l) => l !== "").join("\n") + "\n";
}
