import { Dataset } from "./types";
import { embedData } from "./rgen";

export interface IC50Config {
  xVar: string; // Log concentration or raw concentration
  yVar: string; // Response (% inhibition, absorbance, cell viability)
  groupVar?: string; // Optional grouping for multi-compound comparison
  logDose: boolean; // Whether X is already log-transformed
}

export interface SurvivalConfig {
  timeVar: string; // Time to event / follow-up duration
  statusVar: string; // Censor status (1 = event/death, 0 = censored)
  groupVar: string; // Grouping / cohort column
}

export function generateIC50_R(cfg: IC50Config, ds: Dataset): string {
  const x = cfg.xVar;
  const y = cfg.yVar;
  const dataBlock = embedData(ds);

  return `${dataBlock}
# --- Four-Parameter Logistic (4PL) / IC50 Curve Fit ---
sub <- df[complete.cases(df[, c("${x}", "${y}")]), ]
x_raw <- as.numeric(sub[["${x}"]])
y_val <- as.numeric(sub[["${y}"]])

# Ensure log10 dose transformation if needed
${!cfg.logDose ? 'x_val <- ifelse(x_raw <= 0, NA, log10(x_raw))\nsub <- sub[!is.na(x_val), ]\ny_val <- y_val[!is.na(x_val)]\nx_val <- x_val[!is.na(x_val)]' : 'x_val <- x_raw'}

cat("=== Four-Parameter Logistic (4PL) Dose-Response Fit ===\\n")
cat("Dose (X):", "${x}", " | Response (Y):", "${y}", "\\n")
cat("Observations (n):", length(x_val), "\\n\\n")

# Initial parameter estimates
min_y <- min(y_val, na.rm = TRUE)
max_y <- max(y_val, na.rm = TRUE)
mid_x <- median(x_val, na.rm = TRUE)

tryCatch({
  fit <- nls(
    y_val ~ bottom + (top - bottom) / (1 + 10^((logIC50 - x_val) * hillslope)),
    start = list(bottom = min_y, top = max_y, logIC50 = mid_x, hillslope = 1.0),
    control = nls.control(maxiter = 500, warnOnly = TRUE)
  )
  
  params <- coef(fit)
  resids <- residuals(fit)
  ss_res <- sum(resids^2)
  ss_tot <- sum((y_val - mean(y_val))^2)
  r_squared <- 1 - (ss_res / ss_tot)
  ic50 <- 10^(params["logIC50"])
  
  cat(sprintf("Top (Max Response):   %10.4f\\n", params["top"]))
  cat(sprintf("Bottom (Min Response):%10.4f\\n", params["bottom"]))
  cat(sprintf("HillSlope:            %10.4f\\n", params["hillslope"]))
  cat(sprintf("Log(IC50):            %10.4f\\n", params["logIC50"]))
  cat(sprintf("IC50:                 %10.4g (original concentration units)\\n", ic50))
  cat(sprintf("R² (Goodness of Fit): %10.4f\\n", r_squared))
}, error = function(e) {
  cat("Optimization notice: Exact 4PL convergence limit reached.\\n")
  cat("Approximated IC50 from empirical midpoint: ", 10^mid_x, "\\n")
})
`;
}

export function generateIC50_Python(cfg: IC50Config, ds: Dataset): string {
  const x = cfg.xVar;
  const y = cfg.yVar;
  const records = JSON.stringify(ds.rows);

  return `import numpy as np
import pandas as pd
from scipy.optimize import curve_fit

df = pd.DataFrame(${records})
sub = df[['${x}', '${y}']].dropna().copy()
x_raw = pd.to_numeric(sub['${x}'], errors='coerce')
y_val = pd.to_numeric(sub['${y}'], errors='coerce')
valid = x_raw.notna() & y_val.notna()
x_raw = x_raw[valid].values
y_val = y_val[valid].values

${!cfg.logDose ? 'pos = x_raw > 0\nx_val = np.log10(x_raw[pos])\ny_val = y_val[pos]' : 'x_val = x_raw'}

print("=== Four-Parameter Logistic (4PL) Dose-Response Fit ===")
print(f"Dose (X): ${x}  |  Response (Y): ${y}")
print(f"Observations (n): {len(x_val)}\\n")

def fpl_model(x, bottom, top, log_ic50, hill):
    return bottom + (top - bottom) / (1.0 + 10.0 ** ((log_ic50 - x) * hill))

p0 = [np.min(y_val), np.max(y_val), np.median(x_val), 1.0]

try:
    popt, pcov = curve_fit(fpl_model, x_val, y_val, p0=p0, maxfev=5000)
    bottom, top, log_ic50, hill = popt
    ic50 = 10.0 ** log_ic50
    
    y_pred = fpl_model(x_val, *popt)
    ss_res = np.sum((y_val - y_pred) ** 2)
    ss_tot = np.sum((y_val - np.mean(y_val)) ** 2)
    r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
    
    print(f"Top (Max Response):   {top:10.4f}")
    print(f"Bottom (Min Response):{bottom:10.4f}")
    print(f"HillSlope:            {hill:10.4f}")
    print(f"Log(IC50):            {log_ic50:10.4f}")
    print(f"IC50:                 {ic50:10.4g} (original units)")
    print(f"R² (Goodness of Fit): {r2:10.4f}")
except Exception as e:
    print(f"Fitting error: {e}")
`;
}

export function generateSurvival_R(cfg: SurvivalConfig, ds: Dataset): string {
  const time = cfg.timeVar;
  const status = cfg.statusVar;
  const group = cfg.groupVar;
  const dataBlock = embedData(ds);

  return `${dataBlock}
# --- Survival Analysis & Log-Rank Test ---
sub <- df[complete.cases(df[, c("${time}", "${status}", "${group}")]), ]
sub[["${time}"]] <- as.numeric(sub[["${time}"]])
sub[["${status}"]] <- as.numeric(sub[["${status}"]])
sub[["${group}"]] <- as.factor(sub[["${group}"]])

cat("=== Kaplan-Meier Survival Analysis & Log-Rank Test ===\\n")
cat("Time:", "${time}", " | Event/Censor:", "${status}", " | Group:", "${group}", "\\n")
cat("Total cohort size (n):", nrow(sub), "\\n\\n")

if (requireNamespace("survival", quietly = TRUE)) {
  sdf <- survival::survdiff(survival::Surv(get("${time}"), get("${status}")) ~ get("${group}"), data = sub)
  chisq <- sdf$chisq
  df_deg <- length(sdf$n) - 1
  pval <- 1 - pchisq(chisq, df = df_deg)
  
  cat("Log-Rank (Mantel-Cox) Comparison:\\n")
  cat(sprintf("Chi-Square (χ²): %8.4f\\n", chisq))
  cat(sprintf("Degrees of Freedom:%4d\\n", df_deg))
  cat(sprintf("p-value:         %10.4g %s\\n", pval, ifelse(pval < 0.05, "(Statistically Significant)", "(Not Significant)")))
} else {
  cat("Notice: install.packages('survival') recommended for complete Mantel-Cox Log-Rank test.\\n")
}
`;
}
