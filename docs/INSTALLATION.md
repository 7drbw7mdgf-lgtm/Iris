# Iris — Installation & Environment Guide

This guide outlines setup instructions, dependencies, and environment diagnostics for running **Iris 5.2.0** on macOS and Windows.

---

## 1. System Requirements

- **Operating System**:
  - macOS 11+ (Apple Silicon or Intel x86_64)
  - Windows 10/11 (64-bit)
- **Node.js**: v18+ (v20+ recommended)
- **Rust**: 1.77+ with Cargo (for compiling native Tauri desktop binaries)
- **R**: R 4.0+ with `Rscript` available on `PATH`
- **Python**: Python 3.10+ (optional, required for Matplotlib / Seaborn / Altair engines)

---

## 2. Quick Developer Setup

```bash
# 1. Clone repository & install dependencies
git clone <repo-url> iris
cd iris
npm install

# 2. Run in developer mode (with hot reloading)
npm run tauri dev

# 3. Build release bundle
npm run build
npm run bundle:dmg       # macOS DMG
npm run tauri build      # Platform native installer
```

---

## 3. Statistical & Visualization Engines

Iris features a dual-engine architecture: an interactive WebGL/SVG preview powered by Plotly, paired with native code compilation engines for R and Python.

### A. R Engine Setup (`ggplot2`)

Iris invokes `Rscript` to generate publication-grade vector graphics (PDF and SVG).

1. Ensure R is installed and accessible:
   ```bash
   which Rscript
   ```
2. Install recommended CRAN packages:
   ```r
   install.packages(c("ggplot2", "dplyr", "tidyr", "scales", "svglite", "ggpubr", "viridis"))
   ```
3. Custom `Rscript` path:
   If R is installed in a non-standard location, set the `IRIS_RSCRIPT` environment variable:
   ```bash
   export IRIS_RSCRIPT="/opt/homebrew/bin/Rscript"
   ```

### B. Python Engine Setup (`matplotlib`, `seaborn`, `altair`)

Iris manages an isolated virtual environment located at:
- **macOS**: `~/Library/Application Support/Iris/python-venv`
- **Windows**: `%LOCALAPPDATA%\Iris\python-venv`

On initial launch, Iris can bootstrap this environment automatically. You can also specify an existing Python interpreter or pre-configured environment:
```bash
export IRIS_PYTHON="/path/to/my-env/bin/python"
```

Required Python packages:
```bash
pip install numpy pandas matplotlib seaborn plotly kaleido altair vl-convert-python scipy statsmodels
```

---

## 4. Verification & Automated Test Suites

Iris enforces strict code quality and behavioral contracts across frontend, backend, and generators:

```bash
# Run full unit and Playwright UI regression suites
npm test

# Run Rust backend unittests (file operations, sandbox safety, process pipes)
cargo test --manifest-path src-tauri/Cargo.toml

# Compile-time TypeScript strict typecheck
npx tsc --noEmit
```

All 213+ code files across the repository adhere strictly to a **$\le 400$-line ceiling** enforced by `tests/fileLineLimits.test.mjs`.
