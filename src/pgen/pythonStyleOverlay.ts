import { PlotSpec } from "../types";

function pyStr(v: string): string {
  return '"' + v.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
}

export function pythonStyleOverlay(spec: PlotSpec): string {
  const L: string[] = [];
  const title = spec.title.trim();
  const subtitle = spec.subtitle.trim();
  const xLabel = spec.showAxisLabels === false ? "" : spec.xLabel.trim();
  const yLabel = spec.showAxisLabels === false ? "" : spec.yLabel.trim();
  const font = (spec.fontFamily || "").trim();
  const base = spec.baseFontSize;
  const bg = spec.backgroundColor.trim();
  const mark = spec.markColor.trim();
  const line = spec.lineColor.trim();
  const dark = spec.theme === "dark";
  const fg = dark ? "#f2f2f2" : bg ? "" : "";

  L.push("        _iax = _if.get_axes()");
  L.push("        _ione = _iax[0] if len(_iax) == 1 else None");
  // background / theme
  if (bg || dark) {
    const paper = bg || (dark ? "#111318" : "#ffffff");
    L.push(`        _if.set_facecolor(${pyStr(paper)})`);
    L.push(`        for _a in _iax: _a.set_facecolor(${pyStr(paper)})`);
  }
  if (dark) {
    L.push(`        for _a in _iax:`);
    L.push(`            _a.tick_params(colors=${pyStr(fg)})`);
    L.push(`            for _sp in _a.spines.values(): _sp.set_edgecolor(${pyStr(fg)})`);
    L.push(`            _a.xaxis.label.set_color(${pyStr(fg)}); _a.yaxis.label.set_color(${pyStr(fg)}); _a.title.set_color(${pyStr(fg)})`);
  }
  // grid
  L.push(`        for _a in _iax: _a.grid(${spec.showGrid ? "True" : "False"})`);
  // titles
  if (title) L.push(`        _if.suptitle(${pyStr(title)}, fontsize=${base + 3}${font ? `, fontfamily=${pyStr(font)}` : ""})`);
  if (subtitle) L.push(`        _if.text(0.5, 0.965, ${pyStr(subtitle)}, ha="center", va="top", fontsize=${base}${font ? `, fontfamily=${pyStr(font)}` : ""})`);
  // axis labels
  if (spec.showAxisLabels === false) L.push("        for _a in _iax: _a.set_xlabel(''); _a.set_ylabel('')");
  if (xLabel) L.push(`        for _a in _iax: _a.set_xlabel(${pyStr(xLabel)})`);
  if (yLabel) L.push(`        for _a in _iax: _a.set_ylabel(${pyStr(yLabel)})`);
  // typography (font + base size on standard text elements)
  L.push("        for _a in _iax:");
  const setters: string[] = [];
  if (font) setters.push(`_t.set_fontfamily(${pyStr(font)})`);
  setters.push(`_t.set_fontsize(${base})`);
  L.push(`            for _t in [_a.xaxis.label, _a.yaxis.label] + list(_a.get_xticklabels()) + list(_a.get_yticklabels()):`);
  L.push(`                ${setters.join("; ")}`);
  // axis limits / log scale
  if (spec.xMin.trim() || spec.xMax.trim()) L.push(`        for _a in _iax: _a.set_xlim(${spec.xMin.trim() || "None"}, ${spec.xMax.trim() || "None"})`);
  if (spec.yMin.trim() || spec.yMax.trim()) L.push(`        for _a in _iax: _a.set_ylim(${spec.yMin.trim() || "None"}, ${spec.yMax.trim() || "None"})`);
  const axisScale = (scale: string | undefined, legacyLog = false) => {
    if (legacyLog || scale === "log10" || scale === "log2" || scale === "ln") return "log";
    // Matplotlib's function scales need explicit forward/inverse callables;
    // keep unsupported transforms renderable until a callable editor exists.
    return "linear";
  };
  L.push(`        for _a in _iax: _a.set_xscale(${pyStr(axisScale(spec.xScale))})`);
  L.push(`        for _a in _iax: _a.set_yscale(${pyStr(axisScale(spec.yScale, spec.logY))})`);
  if (spec.xReverse) L.push("        for _a in _iax: _a.invert_xaxis()");
  if (spec.yReverse) L.push("        for _a in _iax: _a.invert_yaxis()");
  if (spec.showXTicks === false || spec.showYTicks === false) {
    L.push(`        for _a in _iax: _a.tick_params(axis="x", bottom=${spec.showXTicks !== false}, labelbottom=${spec.showXTicks !== false}, top=False); _a.tick_params(axis="y", left=${spec.showYTicks !== false}, labelleft=${spec.showYTicks !== false})`);
  }
  if (spec.xCustomTicks.trim()) L.push(`        for _a in _iax: _a.set_xticks([float(_v.strip()) for _v in ${pyStr(spec.xCustomTicks)}.split(',') if _v.strip()])`);
  if (spec.yCustomTicks.trim()) L.push(`        for _a in _iax: _a.set_yticks([float(_v.strip()) for _v in ${pyStr(spec.yCustomTicks)}.split(',') if _v.strip()])`);
  L.push(`        for _a in _iax: _a.tick_params(axis="x", direction=${pyStr(spec.xTickDirection === "inside" ? "in" : spec.xTickDirection === "center" ? "inout" : "out")}, colors=${pyStr(spec.axisTickColor || (dark ? "#f2f2f2" : "#111111"))}, labelsize=${spec.axisTickFontSize ?? Math.max(8, base - 2)}, pad=${spec.axisLabelOffset ?? 0})`);
  L.push(`        for _a in _iax: _a.tick_params(axis="y", direction=${pyStr(spec.yTickDirection === "inside" ? "in" : spec.yTickDirection === "center" ? "inout" : "out")}, colors=${pyStr(spec.axisTickColor || (dark ? "#f2f2f2" : "#111111"))}, labelsize=${spec.axisTickFontSize ?? Math.max(8, base - 2)}, pad=${spec.axisLabelOffset ?? 0})`);
  if (spec.axisTitleColor || spec.axisTitleFontSize || spec.axisTitleWeight || spec.axisTitleOffset) {
    L.push(`        for _a in _iax: _a.xaxis.label.set_color(${pyStr(spec.axisTitleColor || (dark ? "#f2f2f2" : "#111111"))}); _a.yaxis.label.set_color(${pyStr(spec.axisTitleColor || (dark ? "#f2f2f2" : "#111111"))}); _a.xaxis.label.set_fontsize(${spec.axisTitleFontSize ?? base}); _a.yaxis.label.set_fontsize(${spec.axisTitleFontSize ?? base}); _a.xaxis.label.set_fontweight(${pyStr(spec.axisTitleWeight === "bold" ? "bold" : "normal")}); _a.yaxis.label.set_fontweight(${pyStr(spec.axisTitleWeight === "bold" ? "bold" : "normal")}); _a.xaxis.labelpad=${spec.axisTitleOffset ?? 0}; _a.yaxis.labelpad=${spec.axisTitleOffset ?? 0}`);
  }
  if (spec.frameStyle === "openBox" || spec.frameStyle === "plain") L.push("        for _a in _iax: _a.spines['top'].set_visible(False); _a.spines['right'].set_visible(False)");
  if (spec.frameStyle === "scaleBars") L.push("        for _a in _iax: _a.spines['top'].set_visible(False); _a.spines['right'].set_visible(False); _a.spines['left'].set_bounds(*_a.get_ylim()); _a.spines['bottom'].set_bounds(*_a.get_xlim())");
  // tick angles
  if (spec.xTickAngle) L.push(`        for _a in _iax:\n            for _t in _a.get_xticklabels(): _t.set_rotation(${spec.xTickAngle})`);
  if (spec.yTickAngle) L.push(`        for _a in _iax:\n            for _t in _a.get_yticklabels(): _t.set_rotation(${spec.yTickAngle})`);
  // legend
  if (spec.legendPos === "none") {
    L.push(`        for _a in _iax:\n            _lg = _a.get_legend()\n            if _lg is not None: _lg.remove()`);
  } else {
    const loc: Record<string, string> = { right: "center right", left: "center left", top: "upper center", bottom: "lower center" };
    L.push(`        for _a in _iax:\n            if _a.get_legend() is not None: _a.legend(loc=${pyStr(loc[spec.legendPos] || "best")})`);
  }
  // colours (best-effort)
  if (mark) {
    L.push(`        for _a in _iax:`);
    L.push(`            for _c in _a.collections: _c.set_color(${pyStr(mark)})`);
    L.push(`            for _ln in _a.get_lines(): _ln.set_markerfacecolor(${pyStr(mark)}); _ln.set_markeredgecolor(${pyStr(mark)})`);
    L.push(`            for _p in _a.patches: _p.set_facecolor(${pyStr(mark)})`);
  }
  if (line) {
    L.push(`        for _a in _iax:\n            for _ln in _a.get_lines(): _ln.set_color(${pyStr(line)})`);
  }
  // geometry (marker size / line width / opacity) — best-effort, only when the
  // user changed the value from its default so loaded scripts aren't flattened.
  const geo: string[] = [];
  if (spec.opacity !== 0.9) {
    geo.push(`            for _c in _a.collections: _c.set_alpha(${spec.opacity})`);
    geo.push(`            for _ln in _a.get_lines(): _ln.set_alpha(${spec.opacity})`);
    geo.push(`            for _p in _a.patches: _p.set_alpha(${spec.opacity})`);
  }
  if (spec.lineWidth !== 2) {
    geo.push(`            for _ln in _a.get_lines(): _ln.set_linewidth(${spec.lineWidth})`);
  }
  if (spec.pointSize !== 7) {
    geo.push(`            for _c in _a.collections:`);
    geo.push(`                try: _c.set_sizes([${spec.pointSize} ** 2])`);
    geo.push(`                except Exception: pass`);
    geo.push(`            for _ln in _a.get_lines():`);
    geo.push(`                if _ln.get_marker() not in (None, "None", ""): _ln.set_markersize(${spec.pointSize})`);
  }
  if (geo.length) {
    L.push(`        for _a in _iax:`);
    L.push(...geo);
  }

  return [
    "",
    "# --- Iris style overlay (Style Inspector applied on top of the code above) ---",
    "try:",
    "    import matplotlib.pyplot as _iplt",
    "    _if = None",
    "    for _in in ('fig', 'chart'):",
    "        _io = globals().get(_in)",
    "        if _io is not None and hasattr(_io, 'get_axes'):",
    "            _if = _io; break",
    "    if _if is None:",
    "        _ig = _iplt.gcf()",
    "        if _ig.get_axes(): _if = _ig",
    "    if _if is not None and hasattr(_if, 'get_axes') and _if.get_axes():",
    ...L,
    "except Exception:",
    "    pass",
    "",
  ].join("\n");
}
