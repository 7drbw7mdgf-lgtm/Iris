import { Dataset, PlotSpec } from "../types";
import { PlotlyFigure } from "./types";
import { buildSpecializedChartA } from "./specializedChartsA";
import { buildSpecializedChartB } from "./specializedChartsB";
import { buildCartesianFigure } from "./cartesianFigure";

export function buildFigureCore(spec: PlotSpec, ds: Dataset): PlotlyFigure {
  const chartA = buildSpecializedChartA(spec, ds);
  if (chartA) return chartA;

  const chartB = buildSpecializedChartB(spec, ds);
  if (chartB) return chartB;

  return buildCartesianFigure(spec, ds);
}
