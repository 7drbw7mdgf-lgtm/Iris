import { Dataset, PlotSpec } from "./types";
import { PlotlyFigure } from "./plotlyGen/types";
import { applyAxisControls } from "./plotlyGen/layoutAxes";
import { buildFigureCore } from "./plotlyGen/buildFigureCore";

export type { PlotlyFigure } from "./plotlyGen/types";
export { linreg } from "./plotlyGen/plotlyMathHelpers";

export function buildFigure(spec: PlotSpec, ds: Dataset): PlotlyFigure {
  return applyAxisControls(buildFigureCore(spec, ds), spec, ds);
}
