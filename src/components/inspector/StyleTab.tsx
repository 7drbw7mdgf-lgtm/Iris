import { Dataset, PlotSpec } from "../../types";
import {
  ChartCapabilities,
  LIBRARIES,
} from "./inspectorHelpers";
import { GeometrySections } from "./GeometrySections";
import { ErrorAndDistSections } from "./ErrorAndDistSections";
import { GeneralStyleSections } from "./GeneralStyleSections";

export function StyleTab({
  spec,
  patch,
  dataset,
  caps,
  all,
  graphLibrary,
  onGraphLibraryChange,
}: {
  spec: PlotSpec;
  patch: (p: Partial<PlotSpec>) => void;
  dataset: Dataset;
  caps: ChartCapabilities;
  all: string[];
  graphLibrary: "plotly" | "ggplot2" | "matplotlib" | "seaborn" | "altair";
  onGraphLibraryChange: (library: "plotly" | "ggplot2" | "matplotlib" | "seaborn" | "altair") => void;
}) {
  const library = LIBRARIES.find((l) => l.id === graphLibrary) ?? LIBRARIES[0];
  return (
    <div className="inspector-panel-body">
      <div className="graph-library-panel">
        <label className="tk-field">
          <span>Graphing Engine</span>
          <select
            value={graphLibrary}
            onChange={(e) => {
              const next = e.target.value as "plotly" | "ggplot2" | "matplotlib" | "seaborn" | "altair";
              const nextLibrary = LIBRARIES.find((l) => l.id === next) ?? LIBRARIES[0];
              onGraphLibraryChange(next);
              if (nextLibrary.supports !== "all" && !nextLibrary.supports.includes(spec.graphType)) {
                patch({ graphType: nextLibrary.supports[0] });
              }
            }}
          >
            {LIBRARIES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <p className="muted small">{library.hint}</p>
      </div>

      <GeometrySections spec={spec} patch={patch} dataset={dataset} caps={caps} all={all} />
      <ErrorAndDistSections spec={spec} patch={patch} caps={caps} />
      <GeneralStyleSections spec={spec} patch={patch} caps={caps} />
    </div>
  );
}
