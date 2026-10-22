# Iris — R Graphing Studio

A desktop app with a **GraphPad Prism-style GUI** for building and restyling
graphs by point-and-click, backed by real R (ggplot2) and Python renderers.
Built with Tauri + React; your local R / Python installation does the final
plotting and statistics.

## How it works (hybrid model)

- **Live preview** — every control change instantly re-renders an interactive
  preview (Plotly) so editing feels immediate, like Prism.
- **Code engines** — the same plot spec generates real `ggplot2` code or Python
  code (Plotly, matplotlib, seaborn or Altair). **Render** produces the true
  publication figure; **Export…** saves PNG / JPEG / PDF / SVG.

## Features

- **54 graph types** in five families:
  - *Distribution* — histogram, density, ECDF, rug, ridgeline, box, violin, beeswarm, QQ
  - *Correlation* — scatter, volcano, connected, bubble, heatmap, 2D density,
    correlogram, hexbin, smooth, Bland-Altman, PCA, UMAP, t-SNE, ROC, PR curve
  - *Ranking* — bar, lollipop, strip, radar, parallel, circular bar, table,
    error bars, dot plot, forest, Manhattan, UpSet
  - *Part of a whole* — pie, doughnut, treemap, waffle, Sankey, alluvial, chord
  - *Evolution* — line, step, area, stacked area, stream, time series, slope,
    Kaplan-Meier, survival, dendrogram, small multiples
- **Prism-style styling** — axis scales (log10/log2/ln/probability/reciprocal),
  discontinuous axes, dual Y-axes, frame styles (offset, open box, scale bars),
  error bars & envelopes (SD/SEM/95% CI/range), hatch & gradient fills,
  spline/staircase connections, themes (incl. a Prism-like theme), palettes.
- **Data** — import CSV / TSV / TXT / XLS / XLSX with a preview, or paste;
  editable spreadsheet with fill handle and cell formatting. Opens with Fisher's
  iris as a sample. Column types are auto-detected.
- **Statistics toolkit** — batch column profile, descriptives, Shapiro–Wilk,
  one-sample / Welch / paired t-tests, Wilcoxon, Kruskal–Wallis, one-way ANOVA +
  Tukey HSD, chi-squared, Pearson/Spearman/Kendall correlation, linear
  regression; copy results as APA-formatted text or Markdown.
- **Workspace** — multiple data/graph/stats tabs, undo/redo and history,
  project files, multi-panel figures with panel letters and text boxes,
  dashboards, editable generated code, create a graph from existing R/Python code.

## Requirements

- **R** with **ggplot2** (`install.packages("ggplot2")`). The app probes common
  install paths; override with the `IRIS_RSCRIPT` environment variable if your
  `Rscript` is elsewhere. For SVG export `svglite` is recommended — Iris offers
  to install it.
- **Python 3** (optional, for the Python engines). On first use Iris creates its
  own environment in `~/Library/Application Support/Iris/python-venv` and
  installs numpy, pandas, matplotlib, seaborn, plotly, kaleido, altair,
  vl-convert, scipy and statsmodels. Override with `IRIS_PYTHON_VENV`.

## Develop / run

```bash
npm install
npm run tauri dev      # launches the desktop app
npm run tauri build    # produces a bundled .app / installer
npm run bundle:dmg     # macOS .dmg only
```

The frontend alone can be previewed in a browser with `npm run dev`
(R/Python-backed actions need the Tauri runtime).

## Tests

```bash
npm test
```

Runs every graph type through the preview, ggplot2 and Python generators.
Set `IRIS_RSCRIPT` (path to `Rscript`) and/or `IRIS_PYTHON` (a Python with the
packages above) to also execute the generated code and check it renders:

```bash
IRIS_RSCRIPT=$(which Rscript) IRIS_PYTHON=/path/to/venv/bin/python npm test
```

## Where things live

- `src-tauri/src/lib.rs` — Rust commands: `run_r_script`, `render_plot`,
  `run_python_script`, `render_python_plot`, `split_python_figure_panels`,
  `renderer_status`, `repair_python_env`, `install_r_svglite`, file I/O.
- `src/rgen.ts` — plot spec → self-contained ggplot2 code.
- `src/pgen.ts` — plot spec → Python code (Plotly / matplotlib / seaborn / Altair).
- `src/plotlyGen.ts` — plot spec → live Plotly preview.
- `src/statsToolkit.ts`, `src/statsPythonGen.ts` — statistics code generation (R / Python).
- `src/sampleData.ts` — sample data and CSV/Excel parsing.
- `src/components/` — DataPanel, Inspector, PlotPreview, BottomPanel, StatsToolkit, CodeEditor, …
- `tests/` — `node --test` suites; `tests/support/ts-resolve.mjs` lets Node import the TypeScript sources.
