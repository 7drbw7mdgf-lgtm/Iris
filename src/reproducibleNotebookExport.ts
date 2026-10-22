import { Dataset, PlotSpec } from "./types";

export interface NotebookExportOptions {
  title: string;
  author?: string;
  dataset: Dataset;
  spec: PlotSpec;
  rCode?: string;
  pythonCode?: string;
  statsSummary?: string;
}

export function generateQuartoNotebook(opts: NotebookExportOptions): string {
  const title = opts.title || "Iris Scientific Data Analysis";
  const author = opts.author || "Iris Scientific Studio User";
  const date = new Date().toISOString().split("T")[0];
  const colList = opts.dataset.columns.map((c) => `- **${c}** (${opts.dataset.types[c] || "string"})`).join("\n");

  const lines = [
    "---",
    `title: "${title}"`,
    `author: "${author}"`,
    `date: "${date}"`,
    "format:",
    "  html:",
    "    toc: true",
    "    number-sections: true",
    "    code-fold: show",
    "    theme: cosmo",
    "execute:",
    "  warning: false",
    "  message: false",
    "---",
    "",
    "## Executive Summary",
    "",
    `This report was generated using **Iris Scientific Studio** for reproducible scientific analysis.`,
    `The dataset **${opts.dataset.name || "Dataset"}** contains **${opts.dataset.rows.length}** observations across **${opts.dataset.columns.length}** variables.`,
    "",
    "### Data Dictionary",
    "",
    colList,
    "",
  ];

  if (opts.statsSummary) {
    lines.push(
      "## Statistical Analysis",
      "",
      "```text",
      opts.statsSummary.trim(),
      "```",
      ""
    );
  }

  lines.push(
    "## Publication Visualization",
    "",
    "```{r}",
    "#| label: fig-iris-plot",
    `#| fig-cap: "${opts.spec.title || opts.spec.graphType + ' plot'}"`,
    opts.rCode ? opts.rCode.trim() : "# R code not exported",
    "```",
    ""
  );

  return lines.join("\n");
}

export function generateJupyterNotebook(opts: NotebookExportOptions): string {
  const title = opts.title || "Iris Scientific Data Analysis";
  const colSummary = opts.dataset.columns.map((c) => `* **${c}** (${opts.dataset.types[c] || "string"})`).join("\n");

  const cells = [
    {
      cell_type: "markdown",
      metadata: {},
      source: [
        `# ${title}\n`,
        `*Generated with Iris Scientific Studio*\n\n`,
        `### Dataset: ${opts.dataset.name || "Data"} (${opts.dataset.rows.length} rows, ${opts.dataset.columns.length} columns)\n\n`,
        `${colSummary}\n`,
      ],
    },
    {
      cell_type: "code",
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        "import pandas as pd\n",
        "import numpy as np\n",
        "import matplotlib.pyplot as plt\n",
        "import seaborn as sns\n\n",
        "# Dataset loaded from Iris workspace\n",
        `raw_records = ${JSON.stringify(opts.dataset.rows.slice(0, 500))}\n`,
        "df = pd.DataFrame(raw_records)\n",
        "df.head()\n",
      ],
    },
  ];

  if (opts.pythonCode) {
    cells.push({
      cell_type: "code",
      execution_count: null,
      metadata: {},
      outputs: [],
      source: opts.pythonCode.split("\n").map((line) => line + "\n"),
    });
  }

  const notebook = {
    cells,
    metadata: {
      language_info: {
        name: "python",
        version: "3.10",
      },
    },
    nbformat: 4,
    nbformat_minor: 5,
  };

  return JSON.stringify(notebook, null, 2);
}
