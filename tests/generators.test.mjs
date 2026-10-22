// Every chart type in the picker, run through all three generators with the
// sample dataset — the same spec the app builds when you click that type.
// Set IRIS_RSCRIPT / IRIS_PYTHON to also execute the generated code.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { SAMPLE_DATASET } from "../src/sampleData.ts";
import { GRAPH_CATEGORIES, defaultSpec } from "../src/types.ts";
import { buildFigure } from "../src/plotlyGen.ts";
import { generateR } from "../src/rgen.ts";
import { generatePython } from "../src/pgen.ts";

const TYPES = GRAPH_CATEGORIES.flatMap((c) => c.types.map((t) => t.id));
const PY_LIBS = ["plotly", "matplotlib", "seaborn", "altair"];
const specFor = (graphType, ds = SAMPLE_DATASET) => ({ ...defaultSpec(ds), graphType });

function runPool(jobs, width, fn) {
  const queue = [...jobs];
  return Promise.all(Array.from({ length: width }, async () => {
    while (queue.length) await fn(queue.shift());
  }));
}

function exec(cmd, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd });
    let stderr = "";
    child.stderr.on("data", (d) => { stderr += d; });
    child.on("error", (e) => resolve({ code: -1, stderr: e.message }));
    child.on("close", (code) => resolve({ code, stderr }));
  });
}

const lastLine = (s) => s.trim().split("\n").filter((l) => !/warn/i.test(l)).slice(-1)[0] ?? "";

test("chart picker lists each type once", () => {
  assert.equal(new Set(TYPES).size, TYPES.length);
});

for (const type of TYPES) {
  test(`${type}: preview and code generators produce output`, () => {
    const spec = specFor(type);
    const fig = buildFigure(spec, SAMPLE_DATASET);
    assert.ok(fig.data.length > 0, "preview has no traces");
    assert.match(generateR(spec, SAMPLE_DATASET), /^p <- /m);
    for (const lib of PY_LIBS) assert.ok(generatePython(spec, SAMPLE_DATASET, lib).length > 0, lib);
  });
}

test("manual R palettes recycle to cover every category", () => {
  // Numeric Sepal.Length as pie slices: far more categories than the 7-colour palette.
  const levels = new Set(SAMPLE_DATASET.rows.map((r) => String(r["Sepal.Length"]))).size;
  assert.ok(levels > 7);
  const code = generateR({ ...specFor("pie"), xVar: "Sepal.Length" }, SAMPLE_DATASET);
  assert.match(code, new RegExp(`scale_fill_manual\\(values = rep_len\\(c\\([^)]*\\), ${levels}\\)\\)`));
  assert.match(code, /agg\$cat <- factor\(agg\$cat\)/);
});

test("facetVar generates facet_wrap in R and facet_col in Python", () => {
  const spec = { ...specFor("scatter"), facetVar: "Species" };
  const rCode = generateR(spec, SAMPLE_DATASET);
  assert.match(rCode, /facet_wrap\(~ `Species`\)/);
  const pyCode = generatePython(spec, SAMPLE_DATASET, "plotly");
  assert.match(pyCode, /facet_col="Species"/);
});

test("generated R renders for every type", { skip: !process.env.IRIS_RSCRIPT }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "iris-r-"));
  const failures = [];
  try {
    await runPool(TYPES, 6, async (type) => {
      const png = join(dir, `${type}.png`);
      const body = generateR(specFor(type), SAMPLE_DATASET).replace(/\n\s*p\s*$/, "");
      const script = join(dir, `${type}.R`);
      writeFileSync(script, `options(warn = -1)\nsuppressMessages(library(ggplot2))\npng(${JSON.stringify(png)}, width = 6, height = 4.5, units = "in", res = 72)\n${body}\nprint(p)\ninvisible(dev.off())\n`);
      const { code, stderr } = await exec(process.env.IRIS_RSCRIPT, ["--vanilla", script], dir);
      let ok = code === 0;
      try { ok &&= statSync(png).size > 2000; } catch { ok = false; }
      if (!ok) failures.push(`${type}: ${lastLine(stderr)}`);
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  assert.deepEqual(failures, []);
});

test("generated Python runs for every type and library", { skip: !process.env.IRIS_PYTHON }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "iris-py-"));
  // Plotly/Altair image export needs kaleido/Chrome or vl-convert, so for those
  // check the figure object serialises; matplotlib/seaborn really render.
  const harness = `
_o = globals().get("fig") or globals().get("chart")
if _o is not None and hasattr(_o, "savefig"):
    _o.savefig(_OUT, dpi=40)
elif _o is not None and hasattr(_o, "to_plotly_json"):
    _o.to_plotly_json()
elif _o is not None and hasattr(_o, "to_dict"):
    _o.to_dict()
else:
    import matplotlib.pyplot as plt
    assert plt.gcf().get_axes(), "no figure produced"
    plt.gcf().savefig(_OUT, dpi=40)
`;
  const failures = [];
  try {
    const jobs = TYPES.flatMap((type) => PY_LIBS.map((lib) => [type, lib]));
    await runPool(jobs, 8, async ([type, lib]) => {
      const base = join(dir, `${type}.${lib}`);
      const code = generatePython(specFor(type), SAMPLE_DATASET, lib).replace(/\n\s*(plt|fig)\.show\(\)\s*$/, "");
      writeFileSync(`${base}.py`, `import matplotlib\nmatplotlib.use("Agg")\n_OUT = ${JSON.stringify(`${base}.png`)}\n${code}\n${harness}`);
      const { code: exit, stderr } = await exec(process.env.IRIS_PYTHON, [`${base}.py`], dir);
      if (exit !== 0) failures.push(`${type}/${lib}: ${lastLine(stderr)}`);
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  assert.deepEqual(failures, []);
});
