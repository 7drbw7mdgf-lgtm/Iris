import { Dataset } from "./types";
import { ToolkitConfig } from "./statsToolkit";
import { generateIC50_Python } from "./statsNonLinear";

// Generates self-contained Python code using scipy.stats / statsmodels / pandas
// that prints structured statistical reports and key metrics.

const lit = (s: string) => JSON.stringify(s);

function formulaName(name: string): string {
  return `Q(${JSON.stringify(name)})`;
}

function embedPythonData(ds: Dataset): string {
  const records = ds.rows.map((row) => {
    const obj: Record<string, any> = {};
    ds.columns.forEach((col) => {
      const val = row[col];
      if (val === null || val === undefined || val === "") {
        obj[col] = null;
      } else if (ds.types[col] === "numeric") {
        const n = Number(val);
        obj[col] = isNaN(n) ? null : n;
      } else {
        obj[col] = String(val);
      }
    });
    return obj;
  });

  return `import pandas as pd
import numpy as np
import scipy.stats as stats
import json

raw_data = ${JSON.stringify(records)}
df = pd.DataFrame(raw_data)
`;
}

const PREAMBLE_PY = `
import itertools

def print_describe(x, name):
    x = x.dropna().astype(float)
    if len(x) == 0:
        print(f"{name:<18} no numeric data")
        return
    mean = np.mean(x)
    std = np.std(x, ddof=1) if len(x) > 1 else 0
    se = std / np.sqrt(len(x)) if len(x) > 0 else 0
    q25, median, q75 = np.percentile(x, [25, 50, 75])
    print(f"{name:<18} n={len(x)}  missing={len(df) - len(x)}")
    print(f"{'':<18} mean={mean:.5g}  sd={std:.5g}  se={se:.5g}")
    print(f"{'':<18} min={np.min(x):.5g}  Q1={q25:.5g}  median={median:.5g}  Q3={q75:.5g}  max={np.max(x):.5g}\\n")

def print_shapiro(x, name):
    x = x.dropna().astype(float)
    if len(x) < 3:
        print(f"{name:<18} n<3 — skipped")
        return
    if len(x) > 5000:
        x = x.sample(5000, random_state=42)
    stat, p_val = stats.shapiro(x)
    status = "reject normality (non-normal)" if p_val < 0.05 else "consistent with normal"
    print(f"{name:<18} W={stat:.4f}  p={p_val:.4g}  {status}")

def cohens_d(a, b):
    a = pd.Series(a).dropna().astype(float)
    b = pd.Series(b).dropna().astype(float)
    if len(a) < 2 or len(b) < 2:
        return np.nan
    pooled = np.sqrt(((len(a)-1)*np.var(a, ddof=1) + (len(b)-1)*np.var(b, ddof=1)) / (len(a)+len(b)-2))
    return np.nan if not np.isfinite(pooled) or pooled == 0 else (np.mean(a) - np.mean(b)) / pooled

def adjust_pvalues(pvals, method):
    pvals = np.asarray(pvals, dtype=float)
    if method in ("none", "", None):
        return pvals
    try:
        from statsmodels.stats.multitest import multipletests
        sm_method = "fdr_bh" if method == "fdr" else method
        return multipletests(pvals, method=sm_method)[1]
    except Exception:
        if method == "bonferroni":
            return np.minimum(pvals * len(pvals), 1.0)
        return pvals
`;

export function generateToolkitPython(cfg: ToolkitConfig, ds: Dataset): string {
  const head = ["# Iris Python Stats Toolkit", embedPythonData(ds), PREAMBLE_PY];
  const num = cfg.numVar;
  const num2 = cfg.numVar2;
  const grp = cfg.groupVar;
  const cat2 = cfg.catVar2;
  const alt = cfg.alt === "two.sided" ? "two-sided" : cfg.alt;
  const adjust = cfg.pAdjust || "none";
  const out: string[] = [];

  switch (cfg.tool) {
    case "batchProfile": {
      out.push(
        `print("=== Batch profile: all columns ===\\n")`,
        `for col in df.columns:`,
        `    print(f"--- {col} ---")`,
        `    miss = df[col].isna().sum() + (df[col].astype(str) == "").sum()`,
        `    print(f"missing={miss} / {len(df)}")`,
        `    x = pd.to_numeric(df[col], errors="coerce")`,
        `    if x.notna().sum() >= 2:`,
        `        print_describe(x, col)`,
        `        if x.notna().sum() >= 3: print_shapiro(x, col)`,
        `    else:`,
        `        print(df[col].value_counts(dropna=False))`,
        `    print("")`
      );
      break;
    }
    case "describe": {
      if (ds.types[num] !== "numeric") {
        out.push(
          `print(f"=== Frequencies: ${num} ===")`,
          `print(df[${lit(num)}].value_counts(dropna=False))`
        );
        break;
      }
      if (grp) {
        out.push(
          `print(f"=== Descriptives: ${num} by ${grp} ===\\n")`,
          `for lvl, group_df in df.groupby(${lit(grp)}):`,
          `    print_describe(group_df[${lit(num)}], str(lvl))`
        );
      } else {
        out.push(
          `print(f"=== Descriptives: ${num} ===\\n")`,
          `print_describe(df[${lit(num)}], ${lit(num)})`
        );
      }
      break;
    }
    case "normality": {
      if (grp) {
        out.push(
          `print(f"=== Shapiro–Wilk normality: ${num} by ${grp} ===")`,
          `for lvl, group_df in df.groupby(${lit(grp)}):`,
          `    print_shapiro(group_df[${lit(num)}], str(lvl))`
        );
      } else {
        out.push(
          `print(f"=== Shapiro–Wilk normality: ${num} ===")`,
          `print_shapiro(df[${lit(num)}], ${lit(num)})`
        );
      }
      break;
    }
    case "ttest1": {
      out.push(
        `x = df[${lit(num)}].dropna().astype(float)`,
        `res = stats.ttest_1samp(x, popmean=${cfg.mu}, alternative=${lit(alt)})`,
        `print(f"=== One-sample t-test: ${num} vs mu = ${cfg.mu} ===")`,
        `print(f"t-statistic: {res.statistic:.5f}")`,
        `print(f"p-value:     {res.pvalue:.5g}")`,
        `print(f"df:          {res.df if hasattr(res, 'df') else len(x)-1}")`
      );
      break;
    }
    case "ttest2": {
      out.push(
        `groups = [group.dropna().astype(float) for _, group in df.groupby(${lit(grp)})[${lit(num)}]]`,
        `print(f"=== Two-sample Welch t-test: ${num} by ${grp} ===")`,
        `if len(groups) < 2:`,
        `    print("Need at least 2 groups.")`,
        `else:`,
        `    res = stats.ttest_ind(groups[0], groups[1], equal_var=False, alternative=${lit(alt)})`,
        `    print(f"t-statistic: {res.statistic:.5f}")`,
        `    print(f"p-value:     {res.pvalue:.5g}")`,
        `    print(f"Cohen_d:     {cohens_d(groups[0], groups[1]):.4f}")`
      );
      break;
    }
    case "wilcoxon": {
      out.push(
        `groups = [group.dropna().astype(float) for _, group in df.groupby(${lit(grp)})[${lit(num)}]]`,
        `print(f"=== Wilcoxon / Mann–Whitney: ${num} by ${grp} ===")`,
        `if len(groups) < 2:`,
        `    print("Need at least 2 groups.")`,
        `else:`,
        `    res = stats.mannwhitneyu(groups[0], groups[1], alternative=${lit(alt)})`,
        `    print(f"U-statistic: {res.statistic:.5f}")`,
        `    print(f"p-value:     {res.pvalue:.5g}")`
      );
      break;
    }
    case "ttestPaired": {
      out.push(
        `valid = df[[${lit(num)}, ${lit(num2)}]].dropna().astype(float)`,
        `res = stats.ttest_rel(valid[${lit(num)}], valid[${lit(num2)}], alternative=${lit(alt)})`,
        `print(f"=== Paired t-test: ${num} vs ${num2} ===")`,
        `print(f"t-statistic: {res.statistic:.5f}")`,
        `print(f"p-value:     {res.pvalue:.5g}")`
      );
      break;
    }
    case "anova": {
      out.push(
        `import statsmodels.api as sm`,
        `from statsmodels.formula.api import ols`,
        `from statsmodels.stats.multicomp import pairwise_tukeyhsd`,
        `valid = df[[${lit(num)}, ${lit(grp)}]].dropna()`,
        `model = ols(${lit(`${formulaName(num)} ~ C(${formulaName(grp)})`)}, data=valid).fit()`,
        `anova_table = sm.stats.anova_lm(model, typ=2)`,
        `print(f"=== One-way ANOVA: ${num} by ${grp} ===\\n")`,
        `print(anova_table)`,
        `print("\\n=== Tukey HSD (post-hoc) ===\\n")`,
        `tukey = pairwise_tukeyhsd(endog=valid[${lit(num)}], groups=valid[${lit(grp)}], alpha=0.05)`,
        `print(tukey)`,
        `ss_effect = anova_table["sum_sq"].iloc[0]`,
        `ss_error = anova_table["sum_sq"].iloc[-1]`,
        `print(f"partial_eta2: {ss_effect / (ss_effect + ss_error):.4f}")`,
        `print("\\n=== Pairwise Welch t-tests (${adjust}) ===")`,
        `pairs, pvals = [], []`,
        `for a, b in itertools.combinations(valid[${lit(grp)}].dropna().unique(), 2):`,
        `    xa = valid.loc[valid[${lit(grp)}] == a, ${lit(num)}].astype(float)`,
        `    xb = valid.loc[valid[${lit(grp)}] == b, ${lit(num)}].astype(float)`,
        `    pairs.append((a, b))`,
        `    pvals.append(stats.ttest_ind(xa, xb, equal_var=False).pvalue)`,
        `for (a, b), p, padj in zip(pairs, pvals, adjust_pvalues(pvals, ${lit(adjust)})):`,
        `    print(f"{a} vs {b}: p={p:.5g}  p_adj={padj:.5g}")`
      );
      break;
    }
    case "kruskal": {
      out.push(
        `valid = df[[${lit(num)}, ${lit(grp)}]].dropna()`,
        `groups = [group.astype(float) for _, group in valid.groupby(${lit(grp)})[${lit(num)}]]`,
        `print(f"=== Kruskal-Wallis: ${num} by ${grp} ===")`,
        `if len(groups) < 2:`,
        `    print("Need at least 2 groups.")`,
        `else:`,
        `    res = stats.kruskal(*groups)`,
        `    print(f"H-statistic: {res.statistic:.5f}")`,
        `    print(f"p-value:     {res.pvalue:.5g}")`,
        `    print("\\n=== Pairwise Mann-Whitney (${adjust}) ===")`,
        `    pairs, pvals = [], []`,
        `    for a, b in itertools.combinations(valid[${lit(grp)}].dropna().unique(), 2):`,
        `        xa = valid.loc[valid[${lit(grp)}] == a, ${lit(num)}].astype(float)`,
        `        xb = valid.loc[valid[${lit(grp)}] == b, ${lit(num)}].astype(float)`,
        `        pairs.append((a, b))`,
        `        pvals.append(stats.mannwhitneyu(xa, xb).pvalue)`,
        `    for (a, b), p, padj in zip(pairs, pvals, adjust_pvalues(pvals, ${lit(adjust)})):`,
        `        print(f"{a} vs {b}: p={p:.5g}  p_adj={padj:.5g}")`
      );
      break;
    }
    case "chisq": {
      out.push(
        `contingency = pd.crosstab(df[${lit(grp)}], df[${lit(cat2)}])`,
        `print(f"=== Contingency table: ${grp} x ${cat2} ===\\n")`,
        `print(contingency)`,
        `res = stats.chi2_contingency(contingency)`,
        `print("\\n=== Chi-squared test of independence ===")`,
        `print(f"Chi2 statistic: {res.statistic:.5f}")`,
        `print(f"p-value:        {res.pvalue:.5g}")`,
        `print(f"degrees of freedom: {res.dof}")`,
        `n = contingency.to_numpy().sum()`,
        `cramers_v = np.sqrt(res.statistic / (n * (min(contingency.shape) - 1))) if n and min(contingency.shape) > 1 else np.nan`,
        `print(f"Cramers_V:      {cramers_v:.4f}")`
      );
      break;
    }
    case "correlation": {
      out.push(
        `valid = df[[${lit(num)}, ${lit(num2)}]].dropna().astype(float)`,
        `x, y = valid[${lit(num)}], valid[${lit(num2)}]`,
        `print(f"=== ${cfg.method.toUpperCase()} correlation: ${num} vs ${num2} ===")`,
        `if ${lit(cfg.method)} == "pearson":`,
        `    r, p = stats.pearsonr(x, y)`,
        `elif ${lit(cfg.method)} == "spearman":`,
        `    r, p = stats.spearmanr(x, y)`,
        `else:`,
        `    r, p = stats.kendalltau(x, y)`,
        `print(f"correlation coefficient r: {r:.5f}")`,
        `print(f"p-value:                   {p:.5g}")`
      );
      break;
    }
    case "regression": {
      out.push(
        `valid = df[[${lit(num)}, ${lit(num2)}]].dropna().astype(float)`,
        `x, y = valid[${lit(num)}], valid[${lit(num2)}]`,
        `res = stats.linregress(x, y)`,
        `print(f"=== Linear regression: ${num2} ~ ${num} ===")`,
        `print(f"slope:     {res.slope:.5g}")`,
        `print(f"intercept: {res.intercept:.5g}")`,
        `print(f"r-value:   {res.rvalue:.5f}")`,
        `print(f"R-squared: {res.rvalue**2:.4f}")`,
        `print(f"p-value:   {res.pvalue:.5g}")`,
        `print(f"stderr:    {res.stderr:.5g}")`
      );
      break;
    }
    case "ic50":
      return generateIC50_Python({ xVar: cfg.numVar, yVar: cfg.numVar2, logDose: false }, ds);
  }

  return [...head, ...out, ""].join("\n");
}
