import { PlotSpec, AxisScale, NumberFormat, TickDirection, AxisFrameStyle } from "../../types";
import { Section, Row, DualSliderInput } from "./InspectorControls";
import {
  ChartCapabilities,
  AXIS_SCALES,
  NUMBER_FORMATS,
  TICK_DIRECTIONS,
  FRAME_STYLES,
} from "./inspectorHelpers";

export function AxesTab({
  spec,
  patch,
  caps,
  chartTypeLabel,
}: {
  spec: PlotSpec;
  patch: (p: Partial<PlotSpec>) => void;
  caps: ChartCapabilities;
  chartTypeLabel: string;
}) {
  return (
    <div className="inspector-panel-body">
          {caps.hasCartesianAxes ? (
            <>
              {/* Scales & Limits */}
              <Section title="Scale &amp; Transforms">
                <div className="dual">
                  <Row label="X scale">
                    <select
                      value={spec.xScale ?? "linear"}
                      onChange={(e) => patch({ xScale: e.target.value as AxisScale })}
                    >
                      {AXIS_SCALES.map((scale) => (
                        <option key={scale.id} value={scale.id}>
                          {scale.label}
                        </option>
                      ))}
                    </select>
                  </Row>
                  <Row label="Y scale">
                    <select
                      value={spec.yScale ?? (spec.logY ? "log10" : "linear")}
                      onChange={(e) => patch({ yScale: e.target.value as AxisScale, logY: e.target.value === "log10" })}
                    >
                      {AXIS_SCALES.map((scale) => (
                        <option key={scale.id} value={scale.id}>
                          {scale.label}
                        </option>
                      ))}
                    </select>
                  </Row>
                </div>
              </Section>

              <Section title="Range &amp; Limits">
                <div className="dual">
                  <Row label="X min">
                    <input
                      value={spec.xMin}
                      placeholder="auto"
                      onChange={(e) => patch({ xMin: e.target.value })}
                    />
                  </Row>
                  <Row label="X max">
                    <input
                      value={spec.xMax}
                      placeholder="auto"
                      onChange={(e) => patch({ xMax: e.target.value })}
                    />
                  </Row>
                </div>
                <div className="dual">
                  <Row label="Y min">
                    <input
                      value={spec.yMin}
                      placeholder="auto"
                      onChange={(e) => patch({ yMin: e.target.value })}
                    />
                  </Row>
                  <Row label="Y max">
                    <input
                      value={spec.yMax}
                      placeholder="auto"
                      onChange={(e) => patch({ yMax: e.target.value })}
                    />
                  </Row>
                </div>
                <div className="dual">
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={spec.xReverse ?? false}
                      onChange={(e) => patch({ xReverse: e.target.checked })}
                    />
                    Reverse X-axis
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={spec.yReverse ?? false}
                      onChange={(e) => patch({ yReverse: e.target.checked })}
                    />
                    Reverse Y-axis
                  </label>
                </div>
              </Section>

              {/* Ticks & Intervals */}
              <Section title="Ticks &amp; Gridlines">
                <label className="check">
                  <input
                    type="checkbox"
                    checked={spec.showGrid}
                    onChange={(e) => patch({ showGrid: e.target.checked })}
                  />
                  Show coordinate gridlines
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={spec.showAxisLabels !== false}
                    onChange={(e) => patch({ showAxisLabels: e.target.checked })}
                  />
                  Show numerical tick labels
                </label>
                <div className="dual">
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={spec.showXTicks}
                      onChange={(e) => patch({ showXTicks: e.target.checked })}
                    />
                    Show X ticks
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={spec.showYTicks}
                      onChange={(e) => patch({ showYTicks: e.target.checked })}
                    />
                    Show Y ticks
                  </label>
                </div>
                <div className="dual">
                  <Row label="X tick step">
                    <input
                      value={spec.xTickStep}
                      placeholder="auto"
                      onChange={(e) => patch({ xTickStep: e.target.value })}
                    />
                  </Row>
                  <Row label="Y tick step">
                    <input
                      value={spec.yTickStep}
                      placeholder="auto"
                      onChange={(e) => patch({ yTickStep: e.target.value })}
                    />
                  </Row>
                </div>
                <div className="dual">
                  <Row label="X tick direction">
                    <select
                      value={spec.xTickDirection ?? "outside"}
                      onChange={(e) => patch({ xTickDirection: e.target.value as TickDirection })}
                    >
                      {TICK_DIRECTIONS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </Row>
                  <Row label="Y tick direction">
                    <select
                      value={spec.yTickDirection ?? "outside"}
                      onChange={(e) => patch({ yTickDirection: e.target.value as TickDirection })}
                    >
                      {TICK_DIRECTIONS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </Row>
                </div>
              </Section>

              {/* Numbering & Angles */}
              <Section title="Tick Angles &amp; Formatting">
                <div className="dual">
                  <Row label="X angle">
                    <DualSliderInput
                      min={-90}
                      max={90}
                      step={5}
                      value={spec.xTickAngle}
                      onChange={(val) => patch({ xTickAngle: val })}
                      unit="°"
                    />
                  </Row>
                  <Row label="Y angle">
                    <DualSliderInput
                      min={-90}
                      max={90}
                      step={5}
                      value={spec.yTickAngle}
                      onChange={(val) => patch({ yTickAngle: val })}
                      unit="°"
                    />
                  </Row>
                </div>
                <div className="dual">
                  <Row label="X format">
                    <select
                      value={spec.xNumberFormat ?? "auto"}
                      onChange={(e) => patch({ xNumberFormat: e.target.value as NumberFormat })}
                    >
                      {NUMBER_FORMATS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </Row>
                  <Row label="Y format">
                    <select
                      value={spec.yNumberFormat ?? "auto"}
                      onChange={(e) => patch({ yNumberFormat: e.target.value as NumberFormat })}
                    >
                      {NUMBER_FORMATS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </Row>
                </div>
                <div className="dual">
                  <Row label="X prefix">
                    <input
                      value={spec.xPrefix ?? ""}
                      placeholder="$"
                      onChange={(e) => patch({ xPrefix: e.target.value })}
                    />
                  </Row>
                  <Row label="X suffix">
                    <input
                      value={spec.xSuffix ?? ""}
                      placeholder="%"
                      onChange={(e) => patch({ xSuffix: e.target.value })}
                    />
                  </Row>
                </div>
              </Section>

              {/* Axis Frame Style */}
              <Section title="Axis Frame &amp; Borders">
                <Row label="Frame border">
                  <select
                    value={spec.frameStyle ?? "plain"}
                    onChange={(e) => patch({ frameStyle: e.target.value as AxisFrameStyle })}
                  >
                    {FRAME_STYLES.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </Row>
                <div className="dual">
                  <Row label="Title size">
                    <DualSliderInput
                      min={8}
                      max={26}
                      value={spec.axisTitleFontSize ?? spec.baseFontSize}
                      onChange={(val) => patch({ axisTitleFontSize: val })}
                      unit="pt"
                    />
                  </Row>
                  <Row label="Tick size">
                    <DualSliderInput
                      min={7}
                      max={22}
                      value={spec.axisTickFontSize ?? Math.max(8, spec.baseFontSize - 2)}
                      onChange={(val) => patch({ axisTickFontSize: val })}
                      unit="pt"
                    />
                  </Row>
                </div>
              </Section>
            </>
          ) : (
            <div className="non-cartesian-box">
              <div className="non-cartesian-icon">◫</div>
              <h4>Circular &amp; Relational Geometry</h4>
              <p>
                <strong>{chartTypeLabel}</strong> uses relational or proportional area geometry. Standard Cartesian X/Y coordinate axes, ticks, and breaks are omitted to maintain geometric integrity.
              </p>
            </div>
          )}

    </div>
  );
}
