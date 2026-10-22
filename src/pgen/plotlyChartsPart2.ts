import { Dataset, PlotSpec } from "../types";
import {
  pystr,
  layoutLines,
  plotlyLineShape,
  plotlyLineDash,
  aggregateCode,
  textPositionLines,
} from "./pgenHelpers";

export function handlePlotlyPart2(
  spec: PlotSpec,
  ds: Dataset,
  lines: string[],
  ctx: {
    x: string;
    y: string;
    color: string;
    title: string;
    text: string;
    palette: string;
    grp: string;
    horizontal: boolean;
    yNumeric: boolean;
    numericCols: string[];
  }
): void {
  const { x, y, color, title, text, palette, grp, horizontal, yNumeric, numericCols } = ctx;
  switch (spec.graphType) {
    case "bar":
    case "lollipop":
    case "circularBar":
    case "waffle":
      lines.push(aggregateCode(spec, ds));
      lines.push(`value_col = ${yNumeric ? y : '"count"'}`);
      lines.push(`fig = px.bar(agg, ${horizontal ? `x=value_col, y=${x}, orientation="h"` : `x=${x}, y=value_col`}${palette}${title})`);
      lines.push(`fig.update_traces(width=${spec.barWidth}, marker_line_width=${spec.barBorderWidth})`);
      if (spec.fillPattern === "hatch") lines.push('fig.update_traces(marker_pattern_shape="/", marker_pattern_solidity=0.35)');
      if (spec.fillPattern === "gradient") lines.push('fig.update_traces(marker_pattern_shape=".", marker_pattern_solidity=0.18)  # Plotly pattern approximation for gradient fills');
      if (spec.showDropSpikes) lines.push(horizontal ? `fig.add_scatter(x=agg[value_col], y=agg[${x}], mode="lines", line=dict(width=${Math.max(0.5, spec.lineWidth * 0.45)}, dash=${pystr(plotlyLineDash(spec))}), showlegend=False)` : `fig.add_scatter(x=agg[${x}], y=agg[value_col], mode="lines", line=dict(width=${Math.max(0.5, spec.lineWidth * 0.45)}, dash=${pystr(plotlyLineDash(spec))}), showlegend=False)`);
      if (spec.graphType === "lollipop") {
        lines.push('fig.update_traces(width=0.08)');
        lines.push(horizontal ? `fig.add_scatter(x=agg[value_col], y=agg[${x}], mode="markers", marker_size=${spec.pointSize}, showlegend=False)` : `fig.add_scatter(x=agg[${x}], y=agg[value_col], mode="markers", marker_size=${spec.pointSize}, showlegend=False)`);
      }
      if (spec.graphType === "circularBar") lines.push('fig.update_layout(polar=dict(radialaxis=dict(visible=True)))  # closest Plotly equivalent is a bar chart; use go.Barpolar for full polar control');
      if (spec.graphType === "waffle") lines.push('# Waffle charts usually need pywaffle; this keeps a dependency-free bar approximation.');
      lines.push(...layoutLines(spec));
      break;

    case "pie":
    case "donut":
      lines.push(aggregateCode(spec, ds, "sum"));
      lines.push(`value_col = ${yNumeric ? y : '"count"'}`);
      lines.push(`fig = px.pie(agg, names=${x}, values=value_col, hole=${spec.graphType === "donut" ? "0.45" : "0"}${palette}${title})`);
      lines.push(...layoutLines(spec, ""));
      break;

    case "treemap":
      lines.push(aggregateCode(spec, ds, "sum"));
      lines.push(`value_col = ${yNumeric ? y : '"count"'}`);
      lines.push(`fig = px.treemap(agg, path=[${x}], values=value_col${palette}${title})`);
      lines.push(...layoutLines(spec, ""));
      break;

    case "heatmap":
      lines.push(`heat = df.pivot_table(index=${pystr(grp || spec.yVar)}, columns=${x}, values=${y}, aggfunc="mean")`);
      lines.push('fig = px.imshow(heat, aspect="auto", color_continuous_scale="Viridis")');
      lines.push(...layoutLines(spec, spec.yLabel || grp || spec.yVar));
      break;

    case "density2d":
    case "hexbin":
      // density_heatmap has no `color` argument; the preview and ggplot2 bin all points together too.
      lines.push(`fig = px.density_heatmap(df, x=${x}, y=${y}, nbinsx=${spec.histBins}, nbinsy=${spec.histBins}${title})`);
      lines.push(...layoutLines(spec));
      break;

    case "correlogram":
      lines.push(`num_cols = ${JSON.stringify(numericCols)}`);
      lines.push('corr = df[num_cols].corr(numeric_only=True)');
      lines.push('fig = px.imshow(corr, color_continuous_scale="RdBu", zmin=-1, zmax=1, text_auto=".2f")');
      lines.push(...layoutLines(spec, ""));
      break;

    case "radar":
      lines.push(`num_cols = ${JSON.stringify(numericCols)}`);
      lines.push('summary = df[num_cols].mean(numeric_only=True).reset_index()');
      lines.push('summary.columns = ["variable", "value"]');
      lines.push('fig = go.Figure(go.Scatterpolar(r=summary["value"], theta=summary["variable"], fill="toself"))');
      lines.push(...layoutLines(spec, "mean value"));
      break;

    case "parallel":
      lines.push(`num_cols = ${JSON.stringify(numericCols)}`);
      lines.push('fig = px.parallel_coordinates(df, dimensions=num_cols)');
      lines.push(...layoutLines(spec, "value"));
      break;

    case "table":
      lines.push('fig = go.Figure(data=[go.Table(header=dict(values=list(df.columns)), cells=dict(values=[df[c].head(12) for c in df.columns]))])');
      lines.push(...layoutLines(spec, ""));
      break;

    case "smooth":
      lines.push(`fig = px.scatter(df, x=${x}, y=${y}${color}, trendline="lowess"${text}${palette}${title})`);
      lines.push(...layoutLines(spec));
      break;

    case "ridgeline":
      lines.push(`# Plotly has no built-in ridgeline trace; this uses grouped density-normalized histograms.`);
      lines.push(`fig = px.histogram(df, x=${x}${color}, histnorm="probability density", barmode="overlay", opacity=${Math.min(spec.opacity, 0.65)}${palette}${title})`);
      lines.push(...layoutLines(spec, "density"));
      break;

    case "qq":
      lines.push(`vals = pd.to_numeric(df[${x}], errors="coerce").dropna().sort_values().to_numpy()`);
      lines.push('probs = (np.arange(len(vals)) + 0.5) / max(len(vals), 1)');
      lines.push('theoretical = np.quantile(np.random.default_rng(1).normal(size=200000), probs) if len(vals) else []');
      lines.push('fig = go.Figure()');
      lines.push('fig.add_scatter(x=theoretical, y=vals, mode="markers", name="observed")');
      lines.push('if len(vals): fig.add_scatter(x=[min(theoretical.min(), vals.min()), max(theoretical.max(), vals.max())], y=[min(theoretical.min(), vals.min()), max(theoretical.max(), vals.max())], mode="lines", name="normal guide", line=dict(dash="dash"))');
      lines.push(...layoutLines({ ...spec, xLabel: "Theoretical quantiles", yLabel: spec.xVar }, spec.xVar));
      break;

    case "blandAltman":
      lines.push(`a = pd.to_numeric(df[${x}], errors="coerce")`);
      lines.push(`b = pd.to_numeric(df[${y}], errors="coerce")`);
      lines.push('mean_measure = (a + b) / 2');
      lines.push('difference = b - a');
      lines.push('md = difference.mean()');
      lines.push('limit = 1.96 * difference.std(ddof=1)');
      lines.push('fig = px.scatter(x=mean_measure, y=difference, labels={"x": "Mean of measures", "y": "Difference"}' + title + ')');
      lines.push('fig.add_hline(y=md, line_dash="dash", line_color="black")');
      lines.push('fig.add_hline(y=md + limit, line_dash="dot", line_color="gray")');
      lines.push('fig.add_hline(y=md - limit, line_dash="dot", line_color="gray")');
      lines.push(...layoutLines({ ...spec, xLabel: "Mean of measures", yLabel: "Difference" }, "Difference"));
      break;

    case "roc":
    case "pr":
      lines.push(`tmp = df[[${x}, ${y}]].copy()`);
      lines.push(`tmp[${x}] = pd.to_numeric(tmp[${x}], errors="coerce")`);
      lines.push(`tmp[${y}] = pd.to_numeric(tmp[${y}], errors="coerce").fillna(0).gt(0).astype(int)`);
      lines.push(`tmp = tmp.dropna().sort_values(${x}, ascending=False)`);
      lines.push(`tp = tmp[${y}].cumsum()`);
      lines.push('fp = (1 - tmp[' + y + ']).cumsum()');
      lines.push('positives = max(int(tmp[' + y + '].sum()), 1)');
      lines.push('negatives = max(int((1 - tmp[' + y + ']).sum()), 1)');
      if (spec.graphType === "roc") {
        lines.push('curve = pd.DataFrame({"x": fp / negatives, "y": tp / positives})');
        lines.push('fig = px.line(curve, x="x", y="y", labels={"x": "False positive rate", "y": "True positive rate"}' + title + ')');
        lines.push('fig.add_scatter(x=[0, 1], y=[0, 1], mode="lines", line=dict(dash="dash", color="gray"), showlegend=False)');
        lines.push(...layoutLines({ ...spec, xLabel: "False positive rate", yLabel: "True positive rate" }, "True positive rate"));
      } else {
        lines.push('curve = pd.DataFrame({"x": tp / positives, "y": tp / np.maximum(tp + fp, 1)})');
        lines.push('fig = px.line(curve, x="x", y="y", labels={"x": "Recall", "y": "Precision"}' + title + ')');
        lines.push(...layoutLines({ ...spec, xLabel: "Recall", yLabel: "Precision" }, "Precision"));
      }
      break;

    case "kaplanMeier":
    case "survivalCurve":
      lines.push(`tmp = df[[${x}, ${y}${grp ? `, ${pystr(grp)}` : ""}]].copy()`);
      lines.push(`tmp[${x}] = pd.to_numeric(tmp[${x}], errors="coerce")`);
      lines.push(`tmp[${y}] = pd.to_numeric(tmp[${y}], errors="coerce").fillna(0).gt(0)`);
      lines.push('fig = go.Figure()');
      lines.push(`grouped = tmp.groupby(${pystr(grp)}) if ${grp ? "True" : "False"} else [("Survival", tmp)]`);
      lines.push('for name, g in grouped:');
      lines.push(`    g = g.dropna(subset=[${x}]).sort_values(${x})`);
      lines.push('    at_risk = len(g); surv = 1.0; xs = [0]; ys = [1.0]');
      lines.push(`    for t, at_t in g.groupby(${x}):`);
      lines.push(`        events = int(at_t[${y}].sum())`);
      lines.push('        if at_risk > 0 and events > 0: surv *= 1 - events / at_risk');
      lines.push('        xs.extend([t, t]); ys.extend([ys[-1], surv]); at_risk -= len(at_t)');
      lines.push('    fig.add_scatter(x=xs, y=ys, mode="lines", line_shape="hv", name=str(name))');
      lines.push(...layoutLines({ ...spec, xLabel: "Time", yLabel: "Survival probability" }, "Survival probability"));
      break;

    case "pca":
    case "umap":
    case "tsne":
      lines.push(`num_cols = ${JSON.stringify(numericCols)}`);
      lines.push('xmat = df[num_cols].apply(pd.to_numeric, errors="coerce").dropna()');
      lines.push('xstd = (xmat - xmat.mean()) / xmat.std(ddof=0).replace(0, 1)');
      lines.push('u, s, vt = np.linalg.svd(xstd.to_numpy(), full_matrices=False)');
      lines.push('proj = pd.DataFrame({"x": u[:, 0] * s[0], "y": (u[:, 1] * s[1]) if u.shape[1] > 1 else 0})');
      if (grp) lines.push(`proj[${pystr(grp)}] = df.loc[xstd.index, ${pystr(grp)}].to_numpy()`);
      lines.push(`# ${spec.graphType.toUpperCase()} preview uses a dependency-free 2D numeric projection. Use sklearn/umap-learn for a formal embedding.`);
      lines.push(`fig = px.scatter(proj, x="x", y="y"${grp ? `, color=${pystr(grp)}` : ""}${title})`);
      lines.push(...layoutLines({ ...spec, xLabel: spec.graphType.toUpperCase() + " 1", yLabel: spec.graphType.toUpperCase() + " 2" }, spec.graphType.toUpperCase() + " 2"));
      break;

    case "sankey":
    case "alluvial":
    case "chord":
      lines.push(`target_col = ${pystr(grp || spec.labelVar || spec.yVar)}`);
      lines.push(`value_col = ${yNumeric ? y : "None"}`);
      lines.push(`flow = df.groupby([${x}, target_col], dropna=False).agg(value=(${y}, "sum") if value_col else (${x}, "size")).reset_index()`);
      lines.push('labels = pd.Index(pd.concat([flow[' + x + '].astype(str), flow[target_col].astype(str)]).unique())');
      lines.push('lookup = {label: i for i, label in enumerate(labels)}');
      lines.push('fig = go.Figure(go.Sankey(node=dict(label=list(labels)), link=dict(source=flow[' + x + '].astype(str).map(lookup), target=flow[target_col].astype(str).map(lookup), value=flow["value"])))');
      lines.push(...layoutLines(spec, ""));
      break;

    case "errorBar":
      lines.push(`agg = df.groupby(${x}, as_index=False)[${y}].agg(mean="mean", sd="std", n="count")`);
      if (spec.errorMetric === "sd") lines.push('agg["err"] = agg["sd"].fillna(0)');
      else if (spec.errorMetric === "ci95") lines.push('agg["err"] = (1.96 * agg["sd"] / np.sqrt(agg["n"].clip(lower=1))).fillna(0)');
      else if (spec.errorMetric === "range") lines.push(`agg["_min"] = df.groupby(${x})[${y}].min().to_numpy(); agg["_max"] = df.groupby(${x})[${y}].max().to_numpy(); agg["err"] = ((agg["_max"] - agg["_min"]) / 2).fillna(0)`);
      else lines.push('agg["err"] = (agg["sd"] / np.sqrt(agg["n"].clip(lower=1))).fillna(0)');
      lines.push(`fig = px.bar(agg, x=${x}, y="mean", error_y="err"${palette}${title})`);
      lines.push(`fig.update_traces(width=${spec.barWidth}, marker_line_width=${spec.barBorderWidth}, error_y=dict(thickness=${spec.errorCapThickness}, width=${Math.max(3, spec.errorCapThickness * 4)}, symmetric=False, array=agg["err"]${spec.errorDirection === "up" ? ', arrayminus=[0] * len(agg)' : spec.errorDirection === "down" ? ', array=[0] * len(agg), arrayminus=agg["err"]' : ', arrayminus=agg["err"]'}))`);
      if (spec.showErrorEnvelope) lines.push("# For continuous shaded error bands, add upper/lower traces with fill='tonexty' once replicate-level error columns are available.");
      lines.push(...layoutLines(spec));
      break;

    case "dotPlot":
      lines.push(aggregateCode(spec, ds));
      lines.push(`value_col = ${yNumeric ? y : '"count"'}`);
      lines.push(`fig = px.scatter(agg, x=${x}, y=value_col${palette}${title})`);
      lines.push(...layoutLines(spec));
      break;

    case "forest":
      lines.push(`tmp = df[[${x}, ${y}${spec.sizeVar ? `, ${pystr(spec.sizeVar)}` : ""}]].copy()`);
      lines.push(`tmp[${y}] = pd.to_numeric(tmp[${y}], errors="coerce")`);
      lines.push(spec.sizeVar ? `tmp["_err"] = pd.to_numeric(tmp[${pystr(spec.sizeVar)}], errors="coerce").abs().fillna(0)` : `tmp["_err"] = tmp[${y}].abs().mul(0.12).clip(lower=0.05)`);
      lines.push(`fig = px.scatter(tmp, x=${y}, y=${x}, error_x="_err"${title})`);
      lines.push(...layoutLines({ ...spec, xLabel: spec.yVar, yLabel: spec.xVar }, spec.xVar));
      break;

    case "manhattan":
      lines.push(`tmp = df.copy(); tmp["_p"] = pd.to_numeric(tmp[${y}], errors="coerce")`);
      lines.push(`tmp["_pos"] = pd.to_numeric(tmp[${x}], errors="coerce").fillna(pd.Series(range(1, len(tmp) + 1)))`);
      lines.push('tmp["_neg_log10_p"] = -np.log10(np.maximum(tmp["_p"], np.finfo(float).tiny))');
      lines.push(`fig = px.scatter(tmp, x="_pos", y="_neg_log10_p"${color}${title})`);
      lines.push(...layoutLines({ ...spec, xLabel: spec.xVar || "position", yLabel: "-log10(p-value)" }, "-log10(p-value)"));
      break;

    case "upset":
      lines.push('cat_cols = [c for c in df.columns if df[c].dtype == "object"][:5]');
      lines.push('combo = df[cat_cols].astype(str).agg(" | ".join, axis=1).value_counts().head(20).reset_index()');
      lines.push('combo.columns = ["intersection", "count"]');
      lines.push('fig = px.bar(combo, x="intersection", y="count"' + title + ')');
      lines.push(...layoutLines({ ...spec, xLabel: "Set intersection", yLabel: "Count" }, "Count"));
      break;

    case "dendrogram":
      lines.push(`num_cols = ${JSON.stringify(numericCols)}`);
      lines.push('scores = df[num_cols].apply(pd.to_numeric, errors="coerce").dropna().sum(axis=1).sort_values().head(30)');
      lines.push('fig = go.Figure()');
      lines.push('for i, (idx, score) in enumerate(scores.items()): fig.add_scatter(x=[0, abs(score)], y=[str(idx), str(idx)], mode="lines", showlegend=False)');
      lines.push(...layoutLines({ ...spec, xLabel: "Distance", yLabel: "" }, ""));
      break;

    case "facet":
      {
        const fCol = spec.facetVar || grp;
        lines.push(`fig = px.scatter(df, x=${x}, y=${y}${color}${text}${palette}${title}, facet_col=${fCol ? pystr(fCol) : "None"})`);
        lines.push(...layoutLines(spec));
      }
      break;

    case "slope":
      lines.push(`fig = px.line(df, x=${x}, y=${y}${color}${text}${palette}${title}, markers=True)`);
      lines.push(`fig.update_traces(line_shape=${pystr(plotlyLineShape(spec))}, line_dash=${pystr(plotlyLineDash(spec))}, line_width=${spec.lineWidth})`);
      lines.push(...layoutLines(spec));
      break;

    case "scatter":
    default:
      {
        const facetOpt = spec.facetVar ? `, facet_col=${pystr(spec.facetVar)}` : "";
        lines.push(`fig = px.scatter(df, x=${x}, y=${y}${color}${text}${palette}${title}${facetOpt})`);
      }
      if (spec.showDropSpikes) lines.push(`fig.add_scatter(x=np.repeat(df[${x}], 3), y=np.ravel(np.column_stack(([0] * len(df), df[${y}], [np.nan] * len(df)))), mode="lines", line=dict(width=${Math.max(0.5, spec.lineWidth * 0.45)}, dash=${pystr(plotlyLineDash(spec))}), showlegend=False)`);
      lines.push(...textPositionLines(spec));
      lines.push(...layoutLines(spec));
      break;
  }

  const traceUpdates: string[] = [];
  if (spec.markColor && !spec.colorVar) traceUpdates.push(`marker_color=${pystr(spec.markColor)}`);
  if (spec.lineColor) traceUpdates.push(`line_color=${pystr(spec.lineColor)}`);
  if (spec.pointSymbol !== "circle") traceUpdates.push(`marker_symbol=${pystr(spec.pointSymbol)}`);
  if (traceUpdates.length) lines.push(`fig.update_traces(${traceUpdates.join(", ")})`);
  if ((spec.stat === "regression" || spec.stat === "average") && spec.graphType === "scatter") {
    if (spec.stat === "regression") {
      lines.push(`fit_df = pd.DataFrame({"x": pd.to_numeric(df[${x}], errors="coerce"), "y": pd.to_numeric(df[${y}], errors="coerce")}).dropna()`);
      lines.push(`if len(fit_df) >= 2:`);
      lines.push(`    coef = np.polyfit(fit_df["x"], fit_df["y"], 1)`);
      lines.push(`    xx = np.array([fit_df["x"].min(), fit_df["x"].max()])`);
      lines.push(`    fig.add_scatter(x=xx, y=coef[0] * xx + coef[1], mode="lines", line=dict(color=${pystr(spec.lineColor || "black")}, dash="dash", width=${spec.lineWidth}), showlegend=False, name="line of best fit")`);
    } else {
      lines.push(`fig.add_hline(y=pd.to_numeric(df[${y}], errors="coerce").mean(), line_dash="dot", line_color=${pystr(spec.lineColor || "black")})`);
    }
  }
}


