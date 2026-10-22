import { Dataset, PlotSpec, CONT_SCALES, PointSymbol, LineConnection, LinePattern, FillPattern } from "../../types";
import { Section, Row, DualSliderInput } from "./InspectorControls";
import {
  ChartCapabilities,
  POINT_SYMBOLS,
  LINE_CONNECTIONS,
  LINE_PATTERNS,
  FILL_PATTERNS,
} from "./inspectorHelpers";

export function GeometrySections({
  spec,
  patch,
  dataset,
  caps,
  all,
}: {
  spec: PlotSpec;
  patch: (p: Partial<PlotSpec>) => void;
  dataset: Dataset;
  caps: ChartCapabilities;
  all: string[];
}) {
  const t = spec.graphType;
  return (
    <>
          {caps.hasComposition && (
            <Section title="Slice Geometry">
              {(t === "pie" || t === "donut") && (
                <>
                  <Row label="Explode slices">
                    <DualSliderInput
                      min={0}
                      max={0.6}
                      step={0.05}
                      value={spec.pieExplode}
                      onChange={(val) => patch({ pieExplode: val })}
                    />
                  </Row>
                  {t === "donut" && (
                    <Row label="Hole size">
                      <DualSliderInput
                        min={0.2}
                        max={0.8}
                        step={0.05}
                        value={spec.donutHole}
                        onChange={(val) => patch({ donutHole: val })}
                      />
                    </Row>
                  )}
                  <Row label="Slice labels">
                    <select
                      value={spec.pieLabel}
                      onChange={(e) => patch({ pieLabel: e.target.value as PlotSpec["pieLabel"] })}
                    >
                      <option value="label+percent">Label + Percentage (%)</option>
                      <option value="label+value">Label + Value</option>
                      <option value="percent">Percentage only (%)</option>
                      <option value="none">None</option>
                    </select>
                  </Row>
                </>
              )}
            </Section>
          )}

          {/* Volcano Significance Options */}
          {caps.isVolcano && (
            <Section title="Significance Thresholds">
              <label className="check">
                <input
                  type="checkbox"
                  checked={spec.volcanoColorBySig}
                  onChange={(e) => patch({ volcanoColorBySig: e.target.checked })}
                />
                Color points by significance
              </label>
              {spec.volcanoColorBySig && (
                <>
                  <div className="dual">
                    <Row label="|log₂ FC| ≥">
                      <input
                        type="number"
                        step={0.1}
                        value={spec.volcanoFcCut}
                        onChange={(e) => patch({ volcanoFcCut: +e.target.value })}
                      />
                    </Row>
                    <Row label="p-value ≤">
                      <input
                        type="number"
                        step={0.01}
                        min={0}
                        max={1}
                        value={spec.volcanoPCut}
                        onChange={(e) => patch({ volcanoPCut: +e.target.value })}
                      />
                    </Row>
                  </div>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={spec.volcanoLabelSig}
                      onChange={(e) => patch({ volcanoLabelSig: e.target.checked })}
                    />
                    Label significant points
                  </label>
                  {spec.volcanoLabelSig && !spec.labelVar && (
                    <p className="muted small">Select a label column in "Point labels" below.</p>
                  )}
                </>
              )}
            </Section>
          )}

          {/* Histogram Bins & Normalization */}
          {caps.hasHistogram && (
            <Section title="Distribution Bins">
              {t === "histogram" && (
                <Row label="Bins count">
                  <DualSliderInput
                    min={5}
                    max={100}
                    value={spec.histBins}
                    onChange={(val) => patch({ histBins: val })}
                  />
                </Row>
              )}
              <Row label="Normalization">
                <select
                  value={spec.histNorm}
                  onChange={(e) => patch({ histNorm: e.target.value as PlotSpec["histNorm"] })}
                >
                  <option value="count">Raw Count</option>
                  <option value="density">Density Area</option>
                  <option value="percent">Percentage (%)</option>
                </select>
              </Row>
            </Section>
          )}

          {/* Matrix / Heatmap Color Scale */}
          {caps.hasMatrix && (
            <Section title="Continuous Color Scale">
              <Row label="Color gradient">
                <select
                  value={spec.contColorScale}
                  onChange={(e) => patch({ contColorScale: e.target.value as PlotSpec["contColorScale"] })}
                >
                  {CONT_SCALES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Gradient field">
                <select
                  value={spec.colorVar}
                  onChange={(e) => patch({ colorVar: e.target.value, groupVar: e.target.value ? "" : spec.groupVar })}
                >
                  <option value="">Default (Value field)</option>
                  {dataset.columns
                    .filter((c) => dataset.types[c] === "numeric")
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
              </Row>
            </Section>
          )}

          {/* Point Markers */}
          {caps.hasPoints && (
            <Section title="Point Markers">
              <Row label="Point shape">
                <select
                  value={spec.pointSymbol}
                  onChange={(e) => patch({ pointSymbol: e.target.value as PointSymbol })}
                >
                  {POINT_SYMBOLS.map((symbol) => (
                    <option key={symbol.id} value={symbol.id}>
                      {symbol.label}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Point size">
                <DualSliderInput
                  min={1}
                  max={24}
                  value={spec.pointSize}
                  onChange={(val) => patch({ pointSize: val })}
                  unit="px"
                />
              </Row>
              <Row label="Point outline">
                <DualSliderInput
                  min={0}
                  max={5}
                  step={0.25}
                  value={spec.pointStroke}
                  onChange={(val) => patch({ pointStroke: val })}
                  unit="px"
                />
              </Row>
              <Row label="Point labels">
                <select value={spec.labelVar} onChange={(e) => patch({ labelVar: e.target.value })}>
                  <option value="">(None)</option>
                  {all.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Row>
              {spec.labelVar && (
                <Row label="Label font size">
                  <DualSliderInput
                    min={8}
                    max={24}
                    value={spec.labelSize}
                    onChange={(val) => patch({ labelSize: val })}
                    unit="pt"
                  />
                </Row>
              )}
            </Section>
          )}

          {/* Connecting Lines & Curves */}
          {caps.hasLines && (
            <Section title="Lines &amp; Curves">
              <Row label="Connection">
                <select
                  value={spec.lineConnection ?? "straight"}
                  onChange={(e) => patch({ lineConnection: e.target.value as LineConnection })}
                >
                  {LINE_CONNECTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Line pattern">
                <select
                  value={spec.linePattern ?? "solid"}
                  onChange={(e) => patch({ linePattern: e.target.value as LinePattern })}
                >
                  {LINE_PATTERNS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Line width">
                <DualSliderInput
                  min={0.5}
                  max={12}
                  step={0.5}
                  value={spec.lineWidth}
                  onChange={(val) => patch({ lineWidth: val })}
                  unit="pt"
                />
              </Row>
              <label className="check">
                <input
                  type="checkbox"
                  checked={spec.showDirectionalArrows ?? false}
                  onChange={(e) => patch({ showDirectionalArrows: e.target.checked })}
                />
                Show directional arrows
              </label>
              {["box", "violin", "line", "step", "connected", "timeSeries", "smooth", "slope"].includes(t) && (
                <label className="check">
                  <input
                    type="checkbox"
                    checked={spec.showPoints}
                    onChange={(e) => patch({ showPoints: e.target.checked })}
                  />
                  Overlay individual data points
                </label>
              )}
            </Section>
          )}

          {/* Bar Geometry */}
          {caps.hasBars && (
            <Section title="Bar Geometry">
              {caps.canOrient && (
                <Row label="Orientation">
                  <select
                    value={spec.orientation ?? "vertical"}
                    onChange={(e) => patch({ orientation: e.target.value as PlotSpec["orientation"] })}
                  >
                    <option value="vertical">Vertical</option>
                    <option value="horizontal">Horizontal</option>
                  </select>
                </Row>
              )}
              <Row label="Bar width">
                <DualSliderInput
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={spec.barWidth ?? 0.8}
                  onChange={(val) => patch({ barWidth: val })}
                />
              </Row>
              <Row label="Border width">
                <DualSliderInput
                  min={0}
                  max={8}
                  step={0.5}
                  value={spec.barBorderWidth ?? 0}
                  onChange={(val) => patch({ barBorderWidth: val })}
                  unit="px"
                />
              </Row>
              <Row label="Fill pattern">
                <select
                  value={spec.fillPattern ?? "solid"}
                  onChange={(e) => patch({ fillPattern: e.target.value as FillPattern })}
                >
                  {FILL_PATTERNS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Row>
              {caps.canStack && (
                <label className="check">
                  <input
                    type="checkbox"
                    checked={spec.stacked}
                    onChange={(e) => patch({ stacked: e.target.checked })}
                  />
                  Stack multiple series
                </label>
              )}
              <label className="check">
                <input
                  type="checkbox"
                  checked={spec.showDropSpikes ?? false}
                  onChange={(e) => patch({ showDropSpikes: e.target.checked })}
                />
                Baseline drop spikes
              </label>
            </Section>
          )}


    </>
  );
}
