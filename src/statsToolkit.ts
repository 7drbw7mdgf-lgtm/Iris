import { Dataset } from "./types";
import { embedData } from "./rgen";
import { generateIC50_R, generateSurvival_R } from "./statsNonLinear";

export type StatTool =
  | "batchProfile"
  | "describe"
  | "normality"
  | "ttest1"
  | "ttest2"
  | "ttestPaired"
  | "wilcoxon"
  | "kruskal"
  | "anova"
  | "chisq"
  | "correlation"
  | "regression"
  | "ic50"
  | "survival";

export type StatEngine = "r" | "python";

export type InputKind = "num" | "num2" | "group" | "cat2" | "mu" | "method" | "alt" | "pAdjust" | "diagnostic";

export interface ToolkitConfig {
  tool: StatTool;
  engine: StatEngine;
  numVar: string; // primary column (value / X)
  numVar2: string; // secondary numeric (paired / Y)
  groupVar: string; // grouping factor (categorical)
  catVar2: string; // second categorical (chi-squared)
  mu: number; // reference value for one-sample t-test
  method: "pearson" | "spearman" | "kendall";
  alt: "two.sided" | "less" | "greater";
  pAdjust: "none" | "fdr" | "bonferroni" | "holm";
  generateDiagnosticPlot: boolean;
}

export interface ToolMeta {
  id: StatTool;
  label: string;
  group: string; // section heading in the picker
  needs: InputKind[];
  hint: string;
}

export const STAT_TOOLS: ToolMeta[] = [
  { id: "batchProfile", label: "Batch profile", group: "Column analysis", needs: [], hint: "Profiles every column: type, missingness, descriptives, frequencies, and normality checks." },
  { id: "describe", label: "Descriptive summary", group: "Column analysis", needs: ["num", "group"], hint: "n, mean, SD, SE, median, quartiles and range — split by a factor if one is set." },
  { id: "normality", label: "Normality — Shapiro–Wilk", group: "Column analysis", needs: ["num", "group"], hint: "Tests whether a numeric column is normally distributed. p < 0.05 → reject normality." },
  { id: "ttest1", label: "One-sample t-test", group: "t-tests", needs: ["num", "mu", "alt"], hint: "Compares a column's mean against a reference value μ." },
  { id: "ttest2", label: "Two-sample t-test (Welch)", group: "t-tests", needs: ["num", "group", "alt"], hint: "Compares a numeric column between two groups (Welch, unequal variance)." },
  { id: "ttestPaired", label: "Paired t-test", group: "t-tests", needs: ["num", "num2", "alt"], hint: "Compares two paired numeric columns (e.g. before / after)." },
  { id: "wilcoxon", label: "Wilcoxon / Mann–Whitney", group: "t-tests", needs: ["num", "group"], hint: "Non-parametric two-group comparison of medians." },
  { id: "kruskal", label: "Kruskal–Wallis", group: "Group comparison", needs: ["num", "group", "pAdjust"], hint: "Non-parametric multi-group comparison with adjusted pairwise Wilcoxon follow-up." },
  { id: "anova", label: "One-way ANOVA + Tukey HSD", group: "Group comparison", needs: ["num", "group", "pAdjust"], hint: "Compares a numeric column across ≥2 groups, with post-hoc pairwise differences." },
  { id: "chisq", label: "Chi-squared (independence)", group: "Categorical", needs: ["group", "cat2"], hint: "Tests whether two categorical columns are associated (contingency table)." },
  { id: "correlation", label: "Correlation (X–Y)", group: "X–Y analysis", needs: ["num", "num2", "method"], hint: "Pearson / Spearman / Kendall correlation between two columns." },
  { id: "regression", label: "Linear regression (X–Y)", group: "X–Y analysis", needs: ["num", "num2"], hint: "Fits Y ~ X and reports slope, intercept, R² and p-value." },
  { id: "ic50", label: "Dose–Response (4PL / IC50)", group: "Pharmacology & Kinetics", needs: ["num", "num2"], hint: "Fits a 4-Parameter Logistic curve and estimates Top, Bottom, HillSlope, and IC50." },
  { id: "survival", label: "Survival Analysis (Log-Rank)", group: "Group comparison", needs: ["num", "num2", "group"], hint: "Kaplan–Meier survival curve comparison with Log-Rank (Mantel-Cox) test and Chi-square statistic." },
];

export function toolMeta(id: StatTool): ToolMeta {
  return STAT_TOOLS.find((t) => t.id === id) ?? STAT_TOOLS[0];
}

const lit = (s: string) => JSON.stringify(s);

function rAdjustMethod(method: ToolkitConfig["pAdjust"]): string {
  if (method === "fdr") return "BH";
  return method;
}

const PREAMBLE = `.col <- function(c) df[[c]]
.num <- function(c) suppressWarnings(as.numeric(df[[c]]))
.describe <- function(x, name) {
  miss <- sum(is.na(x)); x <- x[!is.na(x)]
  if (length(x) == 0) { cat(sprintf("%-18s no numeric data\\n", name)); return(invisible()) }
  cat(sprintf("%-18s n=%d  missing=%d\\n", name, length(x), miss))
  cat(sprintf("%-18s mean=%.5g  sd=%.5g  se=%.5g\\n", "", mean(x), sd(x), sd(x)/sqrt(length(x))))
  cat(sprintf("%-18s min=%.5g  Q1=%.5g  median=%.5g  Q3=%.5g  max=%.5g\\n\\n", "", min(x), quantile(x,.25), median(x), quantile(x,.75), max(x)))
}
.shapiro <- function(x, name) {
  x <- x[!is.na(x)]
  if (length(x) < 3) { cat(sprintf("%-18s n<3 — skipped\\n", name)); return(invisible()) }
  if (length(x) > 5000) x <- sample(x, 5000)
  r <- shapiro.test(x)
  cat(sprintf("%-18s W=%.4f  p=%.4g  %s\\n", name, r$statistic, r$p.value,
              if (r$p.value < 0.05) "reject normality (non-normal)" else "consistent with normal"))
}
.cohens_d <- function(a, b) {
  a <- a[!is.na(a)]; b <- b[!is.na(b)]
  if (length(a) < 2 || length(b) < 2) return(NA_real_)
  pooled <- sqrt(((length(a)-1)*var(a) + (length(b)-1)*var(b)) / (length(a)+length(b)-2))
  if (!is.finite(pooled) || pooled == 0) return(NA_real_)
  (mean(a) - mean(b)) / pooled
}
`;

export function generateToolkitR(cfg: ToolkitConfig, ds: Dataset): string {
  const head = ["# Iris stats toolkit", "options(warn = -1)", embedData(ds), "", PREAMBLE];
  const num = lit(cfg.numVar);
  const num2 = lit(cfg.numVar2);
  const grp = lit(cfg.groupVar);
  const cat2 = lit(cfg.catVar2);
  const alt = `alternative = ${lit(cfg.alt)}`;
  const adjust = rAdjustMethod(cfg.pAdjust || "none");
  const out: string[] = [];

  switch (cfg.tool) {
    case "batchProfile": {
      out.push(
        `cat("=== Batch profile: all columns ===\\n\\n")`,
        `for (col in names(df)) {`,
        `  cat("---", col, "---\\n")`,
        `  miss <- sum(is.na(df[[col]]) | df[[col]] == "")`,
        `  cat("missing=", miss, " / ", nrow(df), "\\n", sep="")`,
        `  x <- suppressWarnings(as.numeric(df[[col]]))`,
        `  if (sum(!is.na(x)) >= 2) { .describe(x, col); if (sum(!is.na(x)) >= 3) .shapiro(x, col) }`,
        `  else print(table(df[[col]], useNA = "ifany"))`,
        `  cat("\\n")`,
        `}`
      );
      break;
    }
    case "describe": {
      if (ds.types[cfg.numVar] !== "numeric") {
        out.push(`cat("=== Frequencies:", ${num}, "===\\n")`, `print(table(.col(${num}), useNA = "ifany"))`);
        break;
      }
      if (cfg.groupVar) {
        out.push(
          `cat("=== Descriptives:", ${num}, "by", ${grp}, "===\\n\\n")`,
          `g <- as.factor(.col(${grp})); x <- .num(${num})`,
          `for (lvl in levels(g)) .describe(x[g == lvl], lvl)`
        );
      } else {
        out.push(`cat("=== Descriptives:", ${num}, "===\\n\\n")`, `.describe(.num(${num}), ${num})`);
      }
      break;
    }
    case "normality": {
      if (cfg.groupVar) {
        out.push(
          `cat("=== Shapiro–Wilk normality:", ${num}, "by", ${grp}, "===\\n")`,
          `g <- as.factor(.col(${grp})); x <- .num(${num})`,
          `for (lvl in levels(g)) .shapiro(x[g == lvl], lvl)`
        );
      } else {
        out.push(`cat("=== Shapiro–Wilk normality:", ${num}, "===\\n")`, `.shapiro(.num(${num}), ${num})`);
      }
      break;
    }
    case "ttest1": {
      out.push(
        `cat("=== One-sample t-test:", ${num}, "vs mu =", ${cfg.mu}, "===\\n")`,
        `print(t.test(.num(${num}), mu = ${cfg.mu}, ${alt}))`
      );
      break;
    }
    case "ttest2":
    case "wilcoxon": {
      const testCall = cfg.tool === "ttest2" ? `t.test(y ~ gg, ${alt})` : `wilcox.test(y ~ gg, ${alt})`;
      const title = cfg.tool === "ttest2" ? "Two-sample t-test (Welch)" : "Wilcoxon / Mann–Whitney";
      out.push(
        `g <- as.factor(.col(${grp})); lv <- levels(g)`,
        `cat("=== ${title}:", ${num}, "by", ${grp}, "===\\n")`,
        `if (length(lv) < 2) { cat("Need at least 2 groups.\\n") } else {`,
        `  if (length(lv) > 2) cat("Note: >2 groups; testing", lv[1], "vs", lv[2], "\\n")`,
        `  keep <- g %in% lv[1:2]`,
        `  y <- .num(${num})[keep]; gg <- droplevels(g[keep])`,
        `  print(${testCall})`,
        `  parts <- split(y, gg)`,
        `  if (length(parts) >= 2 && "${cfg.tool}" == "ttest2") cat(sprintf("\\nCohen_d=%.4f\\n", .cohens_d(parts[[1]], parts[[2]])))`,
        `}`
      );
      break;
    }
    case "ttestPaired": {
      out.push(
        `cat("=== Paired t-test:", ${num}, "vs", ${num2}, "===\\n")`,
        `print(t.test(.num(${num}), .num(${num2}), paired = TRUE, ${alt}))`
      );
      break;
    }
    case "anova": {
      out.push(
        `y <- .num(${num}); g <- as.factor(.col(${grp}))`,
        `fit <- aov(y ~ g)`,
        `cat("=== One-way ANOVA:", ${num}, "by", ${grp}, "===\\n")`,
        `print(summary(fit))`,
        `tab <- summary(fit)[[1]]`,
        `eta <- tab[1, "Sum Sq"] / (tab[1, "Sum Sq"] + tab[2, "Sum Sq"])`,
        `cat(sprintf("\\npartial_eta2=%.4f\\n", eta))`,
        `cat("\\n=== Tukey HSD (post-hoc) ===\\n")`,
        `print(TukeyHSD(fit))`,
        `cat("\\n=== Pairwise t-tests (${adjust}) ===\\n")`,
        `print(pairwise.t.test(y, g, p.adjust.method = ${lit(adjust)}))`
      );
      break;
    }
    case "kruskal": {
      out.push(
        `y <- .num(${num}); g <- as.factor(.col(${grp}))`,
        `cat("=== Kruskal-Wallis:", ${num}, "by", ${grp}, "===\\n")`,
        `print(kruskal.test(y ~ g))`,
        `cat("\\n=== Pairwise Wilcoxon (${adjust}) ===\\n")`,
        `print(pairwise.wilcox.test(y, g, p.adjust.method = ${lit(adjust)}))`
      );
      break;
    }
    case "chisq": {
      out.push(
        `tbl <- table(.col(${grp}), .col(${cat2}))`,
        `cat("=== Contingency table:", ${grp}, "x", ${cat2}, "===\\n")`,
        `print(tbl)`,
        `cat("\\n=== Chi-squared test of independence ===\\n")`,
        `test <- chisq.test(tbl)`,
        `print(test)`,
        `n <- sum(tbl); cramers_v <- sqrt(as.numeric(test$statistic) / (n * (min(dim(tbl)) - 1)))`,
        `cat(sprintf("\\nCramers_V=%.4f\\n", cramers_v))`
      );
      break;
    }
    case "correlation": {
      out.push(
        `x <- .num(${num}); y <- .num(${num2})`,
        `cat("===", ${lit(cfg.method)}, "correlation:", ${num}, "vs", ${num2}, "===\\n")`,
        `print(cor.test(x, y, method = ${lit(cfg.method)}))`
      );
      break;
    }
    case "regression": {
      out.push(
        `x <- .num(${num}); y <- .num(${num2})`,
        `fit <- lm(y ~ x)`,
        `cat("=== Linear regression:", ${num2}, "~", ${num}, "===\\n")`,
        `print(summary(fit))`,
        `cat(sprintf("\\nslope=%.5g  intercept=%.5g  R2=%.4f\\n", coef(fit)[2], coef(fit)[1], summary(fit)$r.squared))`
      );
      break;
    }
    case "ic50":
      return generateIC50_R({ xVar: cfg.numVar, yVar: cfg.numVar2, logDose: false }, ds);
    case "survival":
      return generateSurvival_R({ timeVar: cfg.numVar, statusVar: cfg.numVar2, groupVar: cfg.groupVar }, ds);
  }

  return [...head, ...out, ""].join("\n");
}

// Extracted metrics for high-level callout cards in the UI
export interface ParsedStatSummary {
  pValue?: number;
  pString?: string;
  isSignificant?: boolean;
  statisticName?: string;
  statisticValue?: number;
  effectName?: string;
  effectValue?: number;
  df?: string | number;
  sampleSize?: number;
  apaReport?: string;
}

function parseNumber(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const value = Number(text.replace(/\s/g, ""));
  return Number.isFinite(value) ? value : undefined;
}

function firstNumberMatch(rawOutput: string, patterns: RegExp[]): number | undefined {
  for (const pattern of patterns) {
    const match = rawOutput.match(pattern);
    const value = parseNumber(match?.[1]);
    if (value !== undefined) return value;
  }
  return undefined;
}

export function parseStatOutput(rawOutput: string, tool: StatTool): ParsedStatSummary {
  const result: ParsedStatSummary = {};
  if (!rawOutput) return result;

  // Extract p-value
  const pMatch = rawOutput.match(/p(?:-value|\.value)?\s*(?:[=:]|<)\s*([<>]?\s*[\d.]+(?:e[-+]?\d+)?)/i);
  if (pMatch) {
    const valStr = pMatch[1].trim();
    if (valStr.startsWith("<")) {
      result.pValue = 0.0001;
      result.pString = "p < 0.001";
      result.isSignificant = true;
    } else {
      const numVal = parseNumber(valStr);
      if (numVal !== undefined) {
        result.pValue = numVal;
        result.pString = numVal < 0.001 ? "p < 0.001" : `p = ${numVal.toFixed(3)}`;
        result.isSignificant = numVal < 0.05;
      }
    }
  }

  const statisticByTool: Partial<Record<StatTool, { name: string; patterns: RegExp[] }>> = {
    ttest1: { name: "t", patterns: [/t(?:-statistic)?\s*[=:]\s*(-?[\d.]+(?:e[-+]?\d+)?)/i] },
    ttest2: { name: "t", patterns: [/t(?:-statistic)?\s*[=:]\s*(-?[\d.]+(?:e[-+]?\d+)?)/i] },
    ttestPaired: { name: "t", patterns: [/t(?:-statistic)?\s*[=:]\s*(-?[\d.]+(?:e[-+]?\d+)?)/i] },
    wilcoxon: { name: "U", patterns: [/U-statistic\s*[=:]\s*(-?[\d.]+(?:e[-+]?\d+)?)/i, /W\s*=\s*(-?[\d.]+(?:e[-+]?\d+)?)/i] },
    anova: { name: "F", patterns: [/F\s*(?:value|\s*stat(?:istic)?)?\s*[=:]\s*(-?[\d.]+(?:e[-+]?\d+)?)/i, /^\s*\S+\s+\d+\s+[\d.eE+-]+\s+[\d.eE+-]+\s+(-?[\d.]+(?:e[-+]?\d+)?)/m] },
    chisq: { name: "X²", patterns: [/(?:X-squared|Chi2 statistic)\s*[=:]\s*(-?[\d.]+(?:e[-+]?\d+)?)/i] },
    correlation: { name: "r", patterns: [/correlation coefficient r:\s*(-?[\d.]+(?:e[-+]?\d+)?)/i, /cor\s+(-?[\d.]+(?:e[-+]?\d+)?)/i] },
    regression: { name: "R²", patterns: [/R-squared:\s*(-?[\d.]+(?:e[-+]?\d+)?)/i, /R2\s*=\s*(-?[\d.]+(?:e[-+]?\d+)?)/i] },
    normality: { name: "W", patterns: [/W\s*[=:]\s*(-?[\d.]+(?:e[-+]?\d+)?)/i] },
  };
  const statDef = statisticByTool[tool];
  const statisticValue = statDef ? firstNumberMatch(rawOutput, statDef.patterns) : undefined;
  if (statDef && statisticValue !== undefined) {
    result.statisticName = statDef.name;
    result.statisticValue = statisticValue;
  }

  const effectDefs = [
    { name: "Cohen's d", patterns: [/Cohen[_ ]d\s*[=:]\s*(-?[\d.]+(?:e[-+]?\d+)?)/i] },
    { name: "partial η²", patterns: [/partial_eta2\s*[=:]\s*(-?[\d.]+(?:e[-+]?\d+)?)/i] },
    { name: "Cramér's V", patterns: [/Cramers?_V\s*[=:]\s*(-?[\d.]+(?:e[-+]?\d+)?)/i] },
  ];
  for (const def of effectDefs) {
    const value = firstNumberMatch(rawOutput, def.patterns);
    if (value !== undefined) {
      result.effectName = def.name;
      result.effectValue = value;
      break;
    }
  }

  // Generate APA Style string summary
  if (result.statisticName && result.statisticValue !== undefined && result.pString) {
    result.apaReport = `${result.statisticName} = ${result.statisticValue.toFixed(2)}, ${result.pString}`;
  }

  return result;
}
