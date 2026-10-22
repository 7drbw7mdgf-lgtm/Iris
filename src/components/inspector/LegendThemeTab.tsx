import { PlotSpec, ThemeName, PaletteName, LegendPos } from "../../types";
import { Section, Row } from "./InspectorControls";
import { ComponentEditScope, GraphComponentSelection } from "./inspectorHelpers";

export function LegendThemeTab({
  spec,
  patch,
  componentEditScope,
  onComponentEditScopeChange,
  selectedComponent,
  selectedComponentColor,
  onSelectedComponentColorChange,
  onResetSelectedComponentColor,
  onClearSelectedComponent,
}: {
  spec: PlotSpec;
  patch: (p: Partial<PlotSpec>) => void;
  componentEditScope: ComponentEditScope;
  onComponentEditScopeChange: (scope: ComponentEditScope) => void;
  selectedComponent: GraphComponentSelection | null;
  selectedComponentColor: string;
  onSelectedComponentColorChange: (color: string) => void;
  onResetSelectedComponentColor: () => void;
  onClearSelectedComponent: () => void;
}) {
  return (
    <div className="inspector-panel-body">
          {/* Publication Themes & Palettes */}
          <Section title="Scientific Theme &amp; Palette">
            <Row label="Color palette">
              <select value={spec.palette} onChange={(e) => patch({ palette: e.target.value as PaletteName })}>
                <option value="prism">Prism Primary</option>
                <option value="set1">Set 1 (ColorBrewer)</option>
                <option value="viridis">Viridis (Colorblind safe)</option>
                <option value="pastel">Pastel Subtle</option>
                <option value="grayscale">Grayscale Tones</option>
              </select>
            </Row>
            <Row label="Journal theme">
              <select value={spec.theme} onChange={(e) => patch({ theme: e.target.value as ThemeName })}>
                <option value="classic">Classic (Nature / Science)</option>
                <option value="minimal">Minimal (Clean grid)</option>
                <option value="bw">Black &amp; White (Monochrome)</option>
                <option value="dark">Dark Lab (High contrast)</option>
                <option value="prism">Prism (GraphPad standard)</option>
              </select>
            </Row>
            <Row label="Canvas paper">
              <span className="color-control">
                <input
                  type="color"
                  value={spec.backgroundColor || (spec.theme === "dark" ? "#1e1e22" : "#ffffff")}
                  onChange={(e) => patch({ backgroundColor: e.target.value })}
                  title="Override background"
                />
                <button type="button" className="btn small" onClick={() => patch({ backgroundColor: "" })}>
                  {spec.backgroundColor ? "Reset" : "Auto"}
                </button>
              </span>
            </Row>
          </Section>

          {/* Legend Options */}
          <Section title="Legend Placement">
            <Row label="Position">
              <select
                value={spec.legendPos}
                onChange={(e) => patch({ legendPos: e.target.value as LegendPos, legendX: undefined, legendY: undefined })}
              >
                <option value="right">Right side</option>
                <option value="left">Left side</option>
                <option value="top">Top header</option>
                <option value="bottom">Bottom footer</option>
                <option value="none">Hidden (None)</option>
              </select>
            </Row>
            {spec.legendX != null && (
              <label className="check">
                <input type="checkbox" checked readOnly /> Manually repositioned on plot
                <button
                  className="btn small"
                  style={{ marginLeft: "auto" }}
                  onClick={() => patch({ legendX: undefined, legendY: undefined })}
                >
                  Reset Position
                </button>
              </label>
            )}
          </Section>

          {/* Interactive Direct Element / Series Override */}
          <Section title="Direct Series Overrides">
            <Row label="Edit scope">
              <select
                value={componentEditScope}
                onChange={(e) => onComponentEditScopeChange(e.target.value as ComponentEditScope)}
              >
                <option value="series">Selected Series</option>
                <option value="point">Selected Point Only</option>
                <option value="graph">Whole Graph</option>
              </select>
            </Row>
            <div className="selected-component-card">
              <div>
                <span>{componentEditScope === "graph" ? "Target" : componentEditScope === "series" ? "Series" : "Point"}</span>
                <strong>
                  {componentEditScope === "graph"
                    ? "Whole Graph"
                    : selectedComponent
                    ? componentEditScope === "series"
                      ? selectedComponent.traceName
                      : selectedComponent.label
                    : componentEditScope === "series"
                    ? "Click any series on the plot"
                    : "Click any mark on the plot"}
                </strong>
              </div>
              {(selectedComponent || componentEditScope === "graph") && (
                <div className="selected-component-actions">
                  <input
                    type="color"
                    value={selectedComponentColor}
                    onChange={(e) => onSelectedComponentColorChange(e.target.value)}
                    aria-label="Component color"
                  />
                  <button className="btn small" type="button" onClick={onResetSelectedComponentColor}>
                    Auto
                  </button>
                  <button className="btn small" type="button" onClick={onClearSelectedComponent}>
                    Clear
                  </button>
                </div>
              )}
            </div>
          </Section>

    </div>
  );
}
