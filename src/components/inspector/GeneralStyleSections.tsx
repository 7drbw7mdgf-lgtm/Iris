import { PlotSpec, StatTest } from "../../types";
import { Section, Row, DualSliderInput } from "./InspectorControls";
import { ChartCapabilities } from "./inspectorHelpers";

export function GeneralStyleSections({
  spec,
  patch,
  caps,
}: {
  spec: PlotSpec;
  patch: (p: Partial<PlotSpec>) => void;
  caps: ChartCapabilities;
}) {
  return (
    <>
          {/* Colors & Opacity */}
          <Section title="Color Overrides &amp; Opacity">
            <Row label="Mark color">
              <span className="color-control">
                <input
                  type="color"
                  value={spec.markColor || "#1F77B4"}
                  onChange={(e) => patch({ markColor: e.target.value })}
                  title="Override mark color"
                />
                <button type="button" className="btn small" onClick={() => patch({ markColor: "" })}>
                  {spec.markColor ? "Reset" : "Auto"}
                </button>
              </span>
            </Row>
            {caps.hasLines && (
              <Row label="Line color">
                <span className="color-control">
                  <input
                    type="color"
                    value={spec.lineColor || spec.markColor || "#1F77B4"}
                    onChange={(e) => patch({ lineColor: e.target.value })}
                    title="Override line color"
                  />
                  <button type="button" className="btn small" onClick={() => patch({ lineColor: "" })}>
                    {spec.lineColor ? "Reset" : "Auto"}
                  </button>
                </span>
              </Row>
            )}
            <Row label="Mark opacity">
              <DualSliderInput
                min={0.1}
                max={1}
                step={0.05}
                value={spec.opacity}
                onChange={(val) => patch({ opacity: val })}
              />
            </Row>
          </Section>

          {/* Titles & Typography */}
          <Section title="Titles &amp; Typography">
            <Row label="Main title">
              <input value={spec.title} placeholder="(none)" onChange={(e) => patch({ title: e.target.value })} />
            </Row>
            <Row label="Subtitle">
              <input value={spec.subtitle} placeholder="(none)" onChange={(e) => patch({ subtitle: e.target.value })} />
            </Row>
            {caps.hasCartesianAxes && (
              <>
                <Row label="X-axis title">
                  <input
                    value={spec.xLabel}
                    placeholder={spec.xVar || "auto"}
                    onChange={(e) => patch({ xLabel: e.target.value })}
                  />
                </Row>
                <Row label="Y-axis title">
                  <input
                    value={spec.yLabel}
                    placeholder={spec.yVar || "auto"}
                    onChange={(e) => patch({ yLabel: e.target.value })}
                  />
                </Row>
              </>
            )}
            <Row label="Font family">
              <select value={spec.fontFamily} onChange={(e) => patch({ fontFamily: e.target.value })}>
                {["Helvetica", "Arial", "Times New Roman", "Courier", "Georgia", "Inter"].map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </Row>
            <Row label="Base font size">
              <DualSliderInput
                min={8}
                max={28}
                value={spec.baseFontSize}
                onChange={(val) => patch({ baseFontSize: val })}
                unit="pt"
              />
            </Row>
          </Section>

          {/* Statistical Overlays (Only if relevant!) */}
          {caps.hasStatOverlay && (
            <Section title="Statistical Trendlines">
              <Row label="Trend / Line">
                <select value={spec.stat} onChange={(e) => patch({ stat: e.target.value as StatTest })}>
                  <option value="none">None (Raw observations)</option>
                  <option value="regression">Line of best fit (Linear Regression)</option>
                  <option value="average">Group average line (Mean)</option>
                  <option value="ttest">Two-sample Student's t-test</option>
                  <option value="anova">One-way ANOVA</option>
                  <option value="correlation">Correlation ellipse</option>
                </select>
              </Row>
              <p className="muted small">Renders statistical fits directly over observation coordinates.</p>
            </Section>
          )}

    </>
  );
}
