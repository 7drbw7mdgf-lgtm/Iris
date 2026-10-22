import { Dataset } from "../types";

export type CellValue = string | number | null;

export interface ExcelFunctionDef {
  name: string;
  category: "Math" | "Statistical" | "Logical" | "Text" | "Lookup" | "Date";
  syntax: string;
  description: string;
  example: string;
}

export type TokenType =
  | "NUMBER"
  | "STRING"
  | "BOOLEAN"
  | "CELL"
  | "RANGE"
  | "IDENT"
  | "COMMA"
  | "LPAREN"
  | "RPAREN"
  | "OP";

export interface Token {
  type: TokenType;
  value: string | number | boolean;
}

export interface FormulaContext {
  dataset: Dataset;
  getCellValue: (r: number, c: number) => any;
  getRangeValues: (rangeStr: string) => any[];
  getRange2DMatrix: (rangeStr: string) => any[][];
}
