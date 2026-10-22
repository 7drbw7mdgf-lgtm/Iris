import { PlotSpec, ErrorMetric, ErrorDirection } from "../../types";
import { Section, Row, DualSliderInput } from "./InspectorControls";
import {
  ChartCapabilities,
  ERROR_METRICS,
  ERROR_DIRECTIONS,
} from "./inspectorHelpers";

export function ErrorAndDistSections({
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
          {/* Error Bars & Envelopes */}
          {caps.hasErrorBars && (
            <Section title="Error Bars &amp; Envelopes">
              <Row label="Error metric">
                <select
                  value={spec.errorMetric ?? spec.barError ?? "sem"}
                  onChange={(e) =>
                    patch({
                      errorMetric: e.target.value as ErrorMetric,
                      barError: e.target.value === "sd" ? "sd" : e.target.value === "sem" ? "sem" : spec.barError,
                    })
                  }
                >
                  {ERROR_METRICS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Direction">
                <select
                  value={spec.errorDirection ?? "both"}
                  onChange={(e) => patch({ errorDirection: e.target.value as ErrorDirection })}
                >
                  {ERROR_DIRECTIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Cap thickness">
                <DualSliderInput
                  min={0.5}
                  max={6}
                  step={0.1}
                  value={spec.errorCapThickness ?? 1.4}
                  onChange={(val) => patch({ errorCapThickness: val })}
                  unit="pt"
                />
              </Row>
              <label className="check">
                <input
                  type="checkbox"
                  checked={spec.showErrorEnvelope ?? false}
                  onChange={(e) => patch({ showErrorEnvelope: e.target.checked })}
                />
                Shaded error envelope band
              </label>
            </Section>
          )}

          {/* Distribution Marks (Box / Violin / Strip) */}
          {caps.hasDistMarks && !caps.hasBars && (
            <Section title="Distribution Layout">
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
              <label className="check">
                <input
                  type="checkbox"
                  checked={spec.showPoints}
                  onChange={(e) => patch({ showPoints: e.target.checked })}
                />
                Overlay raw jittered data points
              </label>
              {spec.showPoints && (
                <Row label="Overlay point size">
                  <DualSliderInput
                    min={1}
                    max={12}
                    value={spec.pointSize}
                    onChange={(val) => patch({ pointSize: val })}
                    unit="px"
                  />
                </Row>
              )}
            </Section>
          )}

    </>
  );
}
