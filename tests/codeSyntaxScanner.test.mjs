import assert from "node:assert/strict";
import test from "node:test";
import { scanCodeSyntax } from "../src/codeSyntaxScanner.ts";
import { SAMPLE_DATASET } from "../src/sampleData.ts";
import { generatePython } from "../src/pgen.ts";
import { generateR } from "../src/rgen.ts";
import { defaultSpec } from "../src/types.ts";

test("generated Python code passes syntax scan and contract fulfillment", () => {
  const spec = { ...defaultSpec(SAMPLE_DATASET), graphType: "scatter" };
  const pyCode = generatePython(spec, SAMPLE_DATASET, "matplotlib");
  const result = scanCodeSyntax(pyCode, "python", SAMPLE_DATASET);

  assert.equal(result.valid, true);
  assert.equal(result.contractFulfilled, true);
  assert.equal(result.diagnostics.filter((d) => d.severity === "error").length, 0);
  assert.equal(result.reproducibleData.canExtract, true);
  assert.deepEqual(result.reproducibleData.columns, SAMPLE_DATASET.columns);
  assert.equal(result.reproducibleData.rowCount, SAMPLE_DATASET.rows.length);
});

test("generated R code passes syntax scan and contract fulfillment", () => {
  const spec = { ...defaultSpec(SAMPLE_DATASET), graphType: "scatter" };
  const rCode = generateR(spec, SAMPLE_DATASET);
  const result = scanCodeSyntax(rCode, "r", SAMPLE_DATASET);

  assert.equal(result.valid, true);
  assert.equal(result.diagnostics.filter((d) => d.severity === "error").length, 0);
  assert.equal(result.reproducibleData.canExtract, true);
  assert.deepEqual(result.reproducibleData.columns, SAMPLE_DATASET.columns);
  assert.equal(result.reproducibleData.rowCount, SAMPLE_DATASET.rows.length);
});

test("detects unclosed parentheses and brackets", () => {
  const badCode = `
import matplotlib.pyplot as plt
fig, ax = plt.subplots(
ax.scatter([1, 2, 3], [4, 5, 6]
`;
  const result = scanCodeSyntax(badCode, "python", SAMPLE_DATASET);
  assert.equal(result.valid, false);
  const errs = result.diagnostics.filter((d) => d.severity === "error");
  assert.ok(errs.some((e) => e.message.includes("Unclosed bracket '('")));
});

test("detects column typos and suggests closest match", () => {
  const typoCode = `
import matplotlib.pyplot as plt
fig, ax = plt.subplots()
ax.scatter(df['Sepal_Length'], df['Petal_Width'])
`;
  const result = scanCodeSyntax(typoCode, "python", SAMPLE_DATASET);
  const warnings = result.diagnostics.filter((d) => d.severity === "warning");
  const sepalWarn = warnings.find((w) => w.message.includes("Sepal_Length"));
  assert.ok(sepalWarn, "should warn about Sepal_Length");
  assert.equal(sepalWarn?.suggestion, "Sepal.Length");
});

test("flags forbidden plt.show() and plt.close(fig) calls", () => {
  const code = `
import matplotlib.pyplot as plt
fig, ax = plt.subplots()
plt.show()
plt.close(fig)
`;
  const result = scanCodeSyntax(code, "python", SAMPLE_DATASET);
  const warnings = result.diagnostics.filter((d) => d.severity === "warning");
  assert.ok(warnings.some((w) => w.message.includes("plt.show()")));
  assert.ok(warnings.some((w) => w.message.includes("plt.close(fig)")));
});
