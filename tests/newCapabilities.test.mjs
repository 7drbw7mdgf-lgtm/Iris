import assert from "node:assert/strict";
import test from "node:test";
import { SAMPLE_DATASET } from "../src/sampleData.ts";
import { defaultSpec } from "../src/types.ts";
import { JOURNAL_EXPORT_PRESETS, findPreset } from "../src/app/exportPresets.ts";
import { generateIC50_R, generateIC50_Python, generateSurvival_R } from "../src/statsNonLinear.ts";
import { pValueToStars, calculateSignificanceBrackets, buildPlotlySignificanceShapes, buildGgplotSignificanceCode } from "../src/statsSignificanceBars.ts";
import { generateQuartoNotebook, generateJupyterNotebook } from "../src/reproducibleNotebookExport.ts";
import { snapToAlignmentGuides } from "../src/app/dashboardAlignment.ts";
import { profileDatasetVolume, createPreviewSample, isParquetFile } from "../src/app/dataEngineUtils.ts";

test("journal export presets provide valid dimensions and DPI standards", () => {
  assert.ok(JOURNAL_EXPORT_PRESETS.length >= 8);
  const natureSingle = findPreset("nature_single");
  assert.ok(natureSingle);
  assert.equal(natureSingle.widthIn, 3.5);
  assert.ok(natureSingle.dpi >= 300);

  const cellDouble = findPreset("cell_double");
  assert.ok(cellDouble);
  assert.equal(cellDouble.widthIn, 6.85);

  const plosDouble = findPreset("plos_double");
  assert.ok(plosDouble);
  assert.equal(plosDouble.widthIn, 6.81);
});

test("4PL IC50 curve fit and survival analysis generators produce valid scripts", () => {
  const rIC50 = generateIC50_R({ xVar: "Sepal.Length", yVar: "Petal.Length", logDose: false }, SAMPLE_DATASET);
  assert.ok(rIC50.includes("Four-Parameter Logistic"));
  assert.ok(rIC50.includes("logIC50"));

  const pyIC50 = generateIC50_Python({ xVar: "Sepal.Length", yVar: "Petal.Length", logDose: false }, SAMPLE_DATASET);
  assert.ok(pyIC50.includes("fpl_model"));
  assert.ok(pyIC50.includes("curve_fit"));

  const rSurv = generateSurvival_R({ timeVar: "Sepal.Length", statusVar: "Sepal.Width", groupVar: "Species" }, SAMPLE_DATASET);
  assert.ok(rSurv.includes("survdiff"));
  assert.ok(rSurv.includes("Log-Rank"));
});

test("significance brackets convert p-values to stars and calculate correct geometries", () => {
  assert.equal(pValueToStars(0.0001), "***");
  assert.equal(pValueToStars(0.005), "**");
  assert.equal(pValueToStars(0.03), "*");
  assert.equal(pValueToStars(0.2), "ns");

  const brackets = calculateSignificanceBrackets([
    { group1: "Control", group2: "Treated", pValue: 0.004, yPosition: 100 },
  ]);

  assert.equal(brackets.length, 1);
  assert.equal(brackets[0].stars, "**");
  assert.equal(brackets[0].yBar, 100);

  const plotlyObjs = buildPlotlySignificanceShapes(brackets);
  assert.equal(plotlyObjs.shapes.length, 3);
  assert.equal(plotlyObjs.annotations.length, 1);

  const ggplotCode = buildGgplotSignificanceCode(brackets);
  assert.ok(ggplotCode.some((l) => l.includes("annotate(\"segment\"")));
});

test("reproducible notebooks export valid Quarto (.qmd) and Jupyter (.ipynb) documents", () => {
  const spec = defaultSpec(SAMPLE_DATASET);
  const qmd = generateQuartoNotebook({
    title: "Iris Benchmark",
    dataset: SAMPLE_DATASET,
    spec,
    rCode: "ggplot(df, aes(x = Sepal.Length, y = Sepal.Width)) + geom_point()",
    statsSummary: "F = 119.26, p < 0.001",
  });

  assert.ok(qmd.includes("title: \"Iris Benchmark\""));
  assert.ok(qmd.includes("```{r}"));
  assert.ok(qmd.includes("Data Dictionary"));

  const ipynbStr = generateJupyterNotebook({
    title: "Iris Benchmark Python",
    dataset: SAMPLE_DATASET,
    spec,
    pythonCode: "import matplotlib.pyplot as plt\nplt.scatter(df['Sepal.Length'], df['Sepal.Width'])\nplt.show()",
  });

  const parsed = JSON.parse(ipynbStr);
  assert.equal(parsed.nbformat, 4);
  assert.ok(parsed.cells.length >= 2);
});

test("smart alignment guides accurately snap coordinates within threshold", () => {
  const existing = [
    { id: "card-1", x: 100, y: 100, w: 200, h: 150 },
  ];

  // Moving item near left edge of card-1 (x = 104 -> snaps to 100)
  const snappedLeft = snapToAlignmentGuides("moving-card", 104, 250, 150, 100, existing, 8);
  assert.equal(snappedLeft.x, 100);
  assert.ok(snappedLeft.guides.length >= 1);

  // Moving item far away (x = 180, y = 500 -> no snap)
  const noSnap = snapToAlignmentGuides("moving-card", 180, 500, 150, 100, existing, 8);
  assert.equal(noSnap.x, 180);
  assert.equal(noSnap.y, 500);
  assert.equal(noSnap.guides.length, 0);
});

test("data engine utilities profile volume and identify parquet formats", () => {
  assert.equal(isParquetFile("experiment.parquet"), true);
  assert.equal(isParquetFile("experiment.pq"), true);
  assert.equal(isParquetFile("experiment.csv"), false);

  const profile = profileDatasetVolume(SAMPLE_DATASET);
  assert.equal(profile.totalRows, SAMPLE_DATASET.rows.length);
  assert.equal(profile.isHighVolume, false);

  const sampled = createPreviewSample(SAMPLE_DATASET, 20);
  assert.equal(sampled.rows.length, 20);
});
