import { ExcelFunctionDef } from "./types";
import { CATALOG_MATH_STATS } from "./catalogMathStats";
import { CATALOG_OTHER } from "./catalogOther";

export const EXCEL_FUNCTION_CATALOG: ExcelFunctionDef[] = [
  ...CATALOG_MATH_STATS,
  ...CATALOG_OTHER,
];
