import { Fragment, useState } from "react";
import { Dataset, PlotSpec } from "../types";

interface Props {
  spec: PlotSpec;
  patch: (p: Partial<PlotSpec>) => void;
  dataset: Dataset;
}

type Field = "xVar" | "yVar" | "groupVar" | "sizeVar" | "labelVar" | "facetVar";

const SHELVES: { field: Field; label: string; hint: string }[] = [
  { field: "xVar", label: "Columns", hint: "X" },
  { field: "yVar", label: "Rows", hint: "Y" },
  { field: "groupVar", label: "Color", hint: "group" },
  { field: "sizeVar", label: "Size", hint: "size" },
  { field: "labelVar", label: "Label", hint: "text" },
  { field: "facetVar", label: "Facet", hint: "panel" },
];

const ORIENTABLE_TYPES = ["bar", "lollipop", "errorBar", "dotPlot", "box", "violin", "beeswarm", "strip"];

function Shelf({ spec, patch, dataset, field, label, hint }: Props & { field: Field; label: string; hint: string }) {
  const [over, setOver] = useState(false);
  const value = spec[field];

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setOver(false);
    const col = e.dataTransfer.getData("text/column") || e.dataTransfer.getData("text/plain");
    if (col) patch({ [field]: col } as Partial<PlotSpec>);
  };

  return (
    <div className="shelf">
      <div className="shelf-label">
        {label} <span className="shelf-hint">{hint}</span>
      </div>
      <div
        className={`shelf-drop ${over ? "over" : ""} ${value ? "filled" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        {value ? (
          <span className="field-pill">
            <span className={`type-dot ${dataset.types[value as string] ?? "categorical"}`} />
            {value}
            <button className="pill-x" title="Remove" onClick={() => patch({ [field]: "" } as Partial<PlotSpec>)}>×</button>
          </span>
        ) : (
          <span className="shelf-placeholder">drop field</span>
        )}
      </div>
    </div>
  );
}

export default function Shelves({ spec, patch, dataset }: Props) {
  const canToggleOrientation = ORIENTABLE_TYPES.includes(spec.graphType);
  const nextOrientation = spec.orientation === "horizontal" ? "vertical" : "horizontal";
  const canSwapAxes = Boolean(spec.xVar || spec.yVar);

  const swapAxes = () => {
    if (canToggleOrientation) {
      patch({ orientation: nextOrientation });
      return;
    }
    if (!canSwapAxes) return;
    patch({
      xVar: spec.yVar,
      yVar: spec.xVar,
      xLabel: spec.yLabel,
      yLabel: spec.xLabel,
      xMin: spec.yMin,
      xMax: spec.yMax,
      yMin: spec.xMin,
      yMax: spec.xMax,
      xScale: spec.yScale,
      yScale: spec.xScale,
      xReverse: spec.yReverse,
      yReverse: spec.xReverse,
      xTickAngle: spec.yTickAngle,
      yTickAngle: spec.xTickAngle,
      xTickStep: spec.yTickStep,
      yTickStep: spec.xTickStep,
      xMinorTickStep: spec.yMinorTickStep,
      yMinorTickStep: spec.xMinorTickStep,
      xCustomTicks: spec.yCustomTicks,
      yCustomTicks: spec.xCustomTicks,
      xPrefix: spec.yPrefix,
      xSuffix: spec.ySuffix,
      yPrefix: spec.xPrefix,
      ySuffix: spec.xSuffix,
      xNumberFormat: spec.yNumberFormat,
      yNumberFormat: spec.xNumberFormat,
    });
  };

  return (
    <div className="shelves">
      {SHELVES.map((s) => (
        <Fragment key={s.field}>
          <Shelf spec={spec} patch={patch} dataset={dataset} field={s.field} label={s.label} hint={s.hint} />
          {s.field === "xVar" && (
            <button
              className="swap-axes-btn"
              type="button"
              onClick={swapAxes}
              disabled={!canToggleOrientation && !canSwapAxes}
              title={canToggleOrientation ? `Switch to ${nextOrientation} orientation` : "Swap X and Y fields"}
              aria-label={canToggleOrientation ? "Toggle vertical or horizontal chart orientation" : "Swap X and Y fields"}
            >
              {spec.orientation === "horizontal" ? "↕" : "↔"}
            </button>
          )}
        </Fragment>
      ))}
    </div>
  );
}
