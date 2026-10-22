import { useMemo, useState } from "react";
import { save } from "@tauri-apps/plugin-dialog";
import { Dataset } from "../types";
import { runPythonScript, runRScript, writeTextFile } from "../tauri";
import { StatTool, ToolkitConfig, generateToolkitR, toolMeta, InputKind, parseStatOutput } from "../statsToolkit";
import { generateToolkitPython } from "../statsPythonGen";
import { DropSlot } from "./stats/DropSlot";
import { StatsMetricCallout } from "./stats/StatsMetricCallout";
import { groupedTools, toolIcon, numLabel, isOptionalGroup } from "./stats/statsHelpers";

export interface StatsToolkitResult {
  title: string;
  tool: StatTool;
  datasetName: string;
  fields: string[];
  output: string;
  code: string;
}

export default function StatsToolkit({ dataset, onResult }: { dataset: Dataset; onResult?: (result: StatsToolkitResult) => void }) {
  const numeric = dataset.columns.filter((c) => dataset.types[c] === "numeric");
  const categorical = dataset.columns.filter((c) => dataset.types[c] === "categorical");
  const all = dataset.columns;

  const [cfg, setCfg] = useState<ToolkitConfig>(() => ({
    tool: "describe",
    engine: "r",
    numVar: numeric[0] ?? all[0] ?? "",
    numVar2: numeric[1] ?? numeric[0] ?? "",
    groupVar: categorical[0] ?? "",
    catVar2: categorical[1] ?? categorical[0] ?? "",
    mu: 0,
    method: "pearson",
    alt: "two.sided",
    pAdjust: "fdr",
    generateDiagnosticPlot: true,
  }));
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [showR, setShowR] = useState(false);

  const meta = toolMeta(cfg.tool);
  const set = (p: Partial<ToolkitConfig>) => setCfg((c) => ({ ...c, ...p }));
  
  const code = useMemo(() => {
    return cfg.engine === "python" ? generateToolkitPython(cfg, dataset) : generateToolkitR(cfg, dataset);
  }, [cfg, dataset]);

  const parsedMetrics = useMemo(() => parseStatOutput(out, cfg.tool), [out, cfg.tool]);

  const needs = (k: InputKind) => meta.needs.includes(k);
  const numOptions = cfg.tool === "describe" ? all : numeric;
  const groupOptions = cfg.tool === "chisq" ? all : categorical.length ? categorical : all;

  const unmet: string[] = [];
  if (needs("num") && !cfg.numVar) unmet.push(numLabel(cfg.tool, "num"));
  if (needs("num2") && !cfg.numVar2) unmet.push(numLabel(cfg.tool, "num2"));
  if (needs("group") && !isOptionalGroup(cfg.tool) && !cfg.groupVar) unmet.push("a grouping factor");
  if (needs("cat2") && !cfg.catVar2) unmet.push("a second category");
  const hasData = dataset.rows.length > 0;
  const canRun = hasData && unmet.length === 0;

  const run = async () => {
    setBusy(true);
    setOut("");
    let output = "";
    let executedCode = code;
    try {
      if (cfg.engine === "r") {
        const r = await runRScript(code);
        output = (r.stdout || "") + (r.stderr ? "\n[stderr]\n" + r.stderr : "") + (!r.success ? "\n[R exited non-zero]" : "");
        if (!r.success && /Rscript not found|Failed to launch Rscript|No such file|not found/i.test(output)) {
          const fallbackCode = generateToolkitPython({ ...cfg, engine: "python" }, dataset);
          const py = await runPythonScript(fallbackCode);
          executedCode = fallbackCode;
          output = `[R unavailable; automatically ran with Python Engine]\n\n${(py.stdout || "") + (py.stderr ? "\n[stderr]\n" + py.stderr : "") + (!py.success ? "\n[Python exited non-zero]" : "")}`;
        }
      } else {
        const py = await runPythonScript(code);
        output = (py.stdout || "") + (py.stderr ? "\n[stderr]\n" + py.stderr : "") + (!py.success ? "\n[Python exited non-zero]" : "");
      }
    } catch (error) {
      if (cfg.engine === "r") {
        const fallbackCode = generateToolkitPython({ ...cfg, engine: "python" }, dataset);
        const py = await runPythonScript(fallbackCode);
        executedCode = fallbackCode;
        const reason = error instanceof Error ? error.message : String(error);
        output = `[R unavailable; automatically ran with Python Engine]\n${reason}\n\n${(py.stdout || "") + (py.stderr ? "\n[stderr]\n" + py.stderr : "") + (!py.success ? "\n[Python exited non-zero]" : "")}`;
      } else {
        output = error instanceof Error ? error.message : String(error);
      }
    }
    try {
      setOut(output);
      onResult?.({
        title: meta.label,
        tool: cfg.tool,
        datasetName: dataset.name || "Dataset",
        fields: [cfg.numVar, cfg.numVar2, cfg.groupVar, cfg.catVar2].filter(Boolean),
        output,
        code: executedCode,
      });
    } finally {
      setBusy(false);
    }
  };

  const copyResult = () => {
    const text = out || (showR ? code : "");
    if (text) navigator.clipboard?.writeText(text);
  };

  const copyAPA = () => {
    if (parsedMetrics.apaReport) {
      navigator.clipboard?.writeText(parsedMetrics.apaReport);
    }
  };

  const copyMarkdown = () => {
    const md = `### ${meta.label}\n**Variables**: ${[cfg.numVar, cfg.numVar2, cfg.groupVar, cfg.catVar2].filter(Boolean).join(", ")}\n\n\`\`\`text\n${out}\n\`\`\``;
    navigator.clipboard?.writeText(md);
  };

  const exportResult = async () => {
    const text = out || code;
    const path = await save({
      title: "Export statistics result",
      defaultPath: `${dataset.name || "iris"}_${cfg.tool}_stats.txt`,
      filters: [{ name: "Text file", extensions: ["txt"] }],
    });
    if (!path) return;
    const result = await writeTextFile(path, text);
    if (!result.success) alert(result.error);
  };

  const assignBestSlot = (col: string) => {
    const isNum = dataset.types[col] === "numeric";
    if (cfg.tool === "chisq") {
      if (!cfg.groupVar) set({ groupVar: col });
      else set({ catVar2: col });
      return;
    }
    if (isNum) {
      if (needs("num") && (!cfg.numVar || cfg.numVar === cfg.numVar2)) set({ numVar: col });
      else if (needs("num2")) set({ numVar2: col });
      else set({ numVar: col });
      return;
    }
    if (needs("group")) set({ groupVar: col });
    else if (needs("cat2")) set({ catVar2: col });
  };

  const onToolChange = (tool: StatTool) => {
    const next = toolMeta(tool);
    setCfg((c) => {
      const patch: Partial<ToolkitConfig> = { tool };
      if (next.needs.includes("num") && !c.numVar) patch.numVar = numeric[0] ?? all[0] ?? "";
      if (next.needs.includes("num2") && !c.numVar2) patch.numVar2 = numeric[1] ?? numeric[0] ?? "";
      if (next.needs.includes("group") && !c.groupVar) patch.groupVar = categorical[0] ?? "";
      if (next.needs.includes("cat2") && !c.catVar2) patch.catVar2 = categorical[1] ?? categorical[0] ?? "";
      return { ...c, ...patch };
    });
  };

  return (
    <div className="stats-workbench stats-workbench-revamp">
      <div className="stats-hero">
        <div>
          <div className="view-eyebrow">Analysis</div>
          <h2>Statistics workspace</h2>
          <p>Drag fields into the analysis slots, choose your execution engine, and run the test.</p>
        </div>
        
        {/* Engine Picker (R vs Python) */}
        <div className="stats-engine-picker" aria-label="Engine Picker">
          <button
            type="button"
            className={cfg.engine === "r" ? "engine-tab active" : "engine-tab"}
            onClick={() => set({ engine: "r" })}
            title="Execute using R / ggplot2 ecosystem"
          >
            R Engine
          </button>
          <button
            type="button"
            className={cfg.engine === "python" ? "engine-tab active" : "engine-tab"}
            onClick={() => set({ engine: "python" })}
            title="Execute using Python / SciPy / Statsmodels ecosystem"
          >
            Python Engine
          </button>
        </div>

        <div className="stats-dataset-pills" aria-label="Dataset summary">
          <span>{dataset.rows.length} rows</span>
          <span>{dataset.columns.length} columns</span>
          <span>{numeric.length} numeric</span>
          <span>{categorical.length} categorical</span>
        </div>
      </div>

      <div className="stats-layout stats-layout-revamp">
        <aside className="stats-fields-rail">
          <div className="stats-panel-title">Fields</div>
          <p className="muted small">Drag fields into the slots or double-click to place automatically.</p>
          <div className="stats-field-list">
            {dataset.columns.map((c) => (
              <button
                key={c}
                className="stats-field-chip"
                draggable
                type="button"
                onDoubleClick={() => assignBestSlot(c)}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/column", c);
                  e.dataTransfer.setData("text/plain", c);
                  e.dataTransfer.setData("application/json", JSON.stringify({ column: c }));
                  e.dataTransfer.effectAllowed = "copy";
                }}
              >
                <span className={`type-dot ${dataset.types[c]}`} />
                <span>{c}</span>
                <em>{dataset.types[c]}</em>
              </button>
            ))}
          </div>
        </aside>

        <aside className="stats-tool-list stats-tool-cards" aria-label="Analysis tools">
          {groupedTools().map(([group, tools]) => (
            <div className="stats-tool-group" key={group}>
              <div className="stats-tool-group-title">{group}</div>
              <div className="stats-tool-pill-row">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  className={cfg.tool === tool.id ? "stats-tool stats-tool-pill active" : "stats-tool stats-tool-pill"}
                  type="button"
                  onClick={() => onToolChange(tool.id)}
                  title={tool.hint}
                >
                  <span className="stats-tool-icon" aria-hidden="true">{toolIcon(tool.id)}</span>
                  <strong>{tool.label}</strong>
                </button>
              ))}
              </div>
            </div>
          ))}
        </aside>

        <section className="stats-run-card stats-run-card-revamp">
          <div className="stats-run-head">
            <div>
              <div className="view-eyebrow">Selected analysis ({cfg.engine.toUpperCase()})</div>
              <h3>{meta.label}</h3>
              <p>{meta.hint}</p>
            </div>
            <div className="tk-actions">
              {parsedMetrics.apaReport && (
                <button className="btn small" onClick={copyAPA} title="Copy APA formatted statistic">Copy APA</button>
              )}
              <button className="btn small" disabled={!out} onClick={copyMarkdown} title="Copy Markdown block">Copy MD</button>
              <button className="btn small" disabled={!out} onClick={copyResult} title="Copy raw text result">Copy Raw</button>
              <button className="btn small" disabled={!out && !showR} onClick={exportResult}>Export TXT</button>
              <button className="btn small" onClick={() => setShowR((v) => !v)}>{showR ? "Hide Code" : "Show Code"}</button>
              <button className="btn small primary" disabled={!canRun || busy} onClick={run}>{busy ? "Running..." : "Run analysis"}</button>
            </div>
          </div>

          <div className="stats-drop-board">
            {needs("num") && (
              <DropSlot
                label={numLabel(cfg.tool, "num")}
                value={cfg.numVar}
                dataset={dataset}
                options={numOptions}
                onChange={(numVar) => set({ numVar })}
              />
            )}
            {needs("num2") && (
              <DropSlot
                label={numLabel(cfg.tool, "num2")}
                value={cfg.numVar2}
                dataset={dataset}
                options={numeric}
                onChange={(numVar2) => set({ numVar2 })}
              />
            )}
            {needs("group") && (
              <DropSlot
                label={cfg.tool === "chisq" ? "Category 1" : `Group factor${isOptionalGroup(cfg.tool) ? " (optional)" : ""}`}
                value={cfg.groupVar}
                dataset={dataset}
                options={groupOptions}
                allowEmpty={isOptionalGroup(cfg.tool)}
                onChange={(groupVar) => set({ groupVar })}
              />
            )}
            {needs("cat2") && (
              <DropSlot
                label="Category 2"
                value={cfg.catVar2}
                dataset={dataset}
                options={all}
                onChange={(catVar2) => set({ catVar2 })}
              />
            )}
            {needs("mu") && (
              <label className="tk-field stats-parameter">
                <span>μ reference</span>
                <input type="number" step="any" value={cfg.mu} onChange={(e) => set({ mu: +e.target.value })} />
              </label>
            )}
            {needs("method") && (
              <label className="tk-field stats-parameter">
                <span>Method</span>
                <select value={cfg.method} onChange={(e) => set({ method: e.target.value as ToolkitConfig["method"] })}>
                  <option value="pearson">Pearson</option>
                  <option value="spearman">Spearman</option>
                  <option value="kendall">Kendall</option>
                </select>
              </label>
            )}
            {needs("alt") && (
              <label className="tk-field stats-parameter">
                <span>Alternative</span>
                <select value={cfg.alt} onChange={(e) => set({ alt: e.target.value as ToolkitConfig["alt"] })}>
                  <option value="two.sided">Two-sided</option>
                  <option value="less">Less</option>
                  <option value="greater">Greater</option>
                </select>
              </label>
            )}
            {needs("pAdjust") && (
              <label className="tk-field stats-parameter">
                <span>P adjustment</span>
                <select value={cfg.pAdjust} onChange={(e) => set({ pAdjust: e.target.value as ToolkitConfig["pAdjust"] })}>
                  <option value="none">None</option>
                  <option value="fdr">FDR / BH</option>
                  <option value="bonferroni">Bonferroni</option>
                  <option value="holm">Holm</option>
                </select>
              </label>
            )}
            <label className="tk-field stats-parameter stats-check">
              <span>Diagnostics</span>
              <label className="check">
                <input type="checkbox" checked={cfg.generateDiagnosticPlot} onChange={(e) => set({ generateDiagnosticPlot: e.target.checked })} />
                Prepare plot metadata
              </label>
            </label>
          </div>

          {!hasData && <div className="stats-notice">Load data to run statistics.</div>}
          {hasData && unmet.length > 0 && <div className="stats-notice">Drop or select {unmet.join(" and ")} to run this test.</div>}

          {/* Metric Callout Highlight Banner */}
          {out && <StatsMetricCallout parsedMetrics={parsedMetrics} />}

          {showR && (
            <div className="stats-code-panel">
              <div className="stats-panel-title">Generated {cfg.engine === "python" ? "Python" : "R"} code</div>
              <pre className="output toolkit-rcode">{code}</pre>
            </div>
          )}

          <div className="stats-result-panel">
            <div className="stats-panel-title">Report Output</div>
            <pre className="output stats-output">{out || (canRun ? "Ready to run." : "Waiting for required inputs.")}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}


