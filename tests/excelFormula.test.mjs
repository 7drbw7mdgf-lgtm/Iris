import test from "node:test";
import assert from "node:assert/strict";
import { evaluateExcelFormula, EXCEL_FUNCTION_CATALOG } from "../src/excelFormula.ts";

const sampleDataset = {
  name: "Test",
  columns: ["A", "B", "C"],
  types: { A: "numeric", B: "numeric", C: "categorical" },
  rows: [
    { A: 10, B: 100, C: "apple" },
    { A: 20, B: 200, C: "banana" },
    { A: 30, B: 300, C: "apple" },
    { A: 40, B: 400, C: "cherry" },
  ],
};

test("basic math formulas", () => {
  assert.equal(evaluateExcelFormula("=1+2*3", sampleDataset), 7);
  assert.equal(evaluateExcelFormula("=(1+2)*3", sampleDataset), 9);
  assert.equal(evaluateExcelFormula("=2^3", sampleDataset), 8);
  assert.equal(evaluateExcelFormula("=50%", sampleDataset), 0.5);
  assert.equal(evaluateExcelFormula("=10/0", sampleDataset), "#DIV/0!");
});

test("cell reference evaluation", () => {
  assert.equal(evaluateExcelFormula("=A1 + B1", sampleDataset), 110);
  assert.equal(evaluateExcelFormula("=A2 * 2", sampleDataset), 40);
  assert.equal(evaluateExcelFormula('="Fruit: " & C1', sampleDataset), "Fruit: apple");
});

test("SUM, AVERAGE, MIN, MAX, COUNT, MEDIAN, STDEV", () => {
  assert.equal(evaluateExcelFormula("=SUM(A1:A4)", sampleDataset), 100);
  assert.equal(evaluateExcelFormula("=AVERAGE(A1:A4)", sampleDataset), 25);
  assert.equal(evaluateExcelFormula("=MIN(A1:A4)", sampleDataset), 10);
  assert.equal(evaluateExcelFormula("=MAX(A1:A4)", sampleDataset), 40);
  assert.equal(evaluateExcelFormula("=COUNT(A1:A4)", sampleDataset), 4);
  assert.equal(evaluateExcelFormula("=MEDIAN(A1:A4)", sampleDataset), 25);
  assert.equal(Math.round(evaluateExcelFormula("=STDEV(A1:A4)", sampleDataset) * 100) / 100, 12.91);
});

test("ROUND, ROUNDUP, ROUNDDOWN, SQRT, POWER, ABS", () => {
  assert.equal(evaluateExcelFormula("=ROUND(3.14159, 2)", sampleDataset), 3.14);
  assert.equal(evaluateExcelFormula("=ROUNDUP(3.14159, 2)", sampleDataset), 3.15);
  assert.equal(evaluateExcelFormula("=ROUNDDOWN(3.149, 2)", sampleDataset), 3.14);
  assert.equal(evaluateExcelFormula("=SQRT(16)", sampleDataset), 4);
  assert.equal(evaluateExcelFormula("=ABS(-42)", sampleDataset), 42);
  assert.equal(evaluateExcelFormula("=POWER(2, 5)", sampleDataset), 32);
});

test("IF, IFS, AND, OR, NOT", () => {
  assert.equal(evaluateExcelFormula('=IF(A1 > 5, "Yes", "No")', sampleDataset), "Yes");
  assert.equal(evaluateExcelFormula('=IF(A1 > 50, "Yes", "No")', sampleDataset), "No");
  assert.equal(evaluateExcelFormula('=IFS(A1=10, "Ten", A1=20, "Twenty")', sampleDataset), "Ten");
  assert.equal(evaluateExcelFormula("=AND(A1>0, B1>0)", sampleDataset), true);
  assert.equal(evaluateExcelFormula("=OR(A1>100, B1>=100)", sampleDataset), true);
  assert.equal(evaluateExcelFormula("=NOT(A1>100)", sampleDataset), true);
});

test("COUNTIF, SUMIF, AVERAGEIF", () => {
  assert.equal(evaluateExcelFormula('=COUNTIF(C1:C4, "apple")', sampleDataset), 2);
  assert.equal(evaluateExcelFormula('=COUNTIF(A1:A4, ">20")', sampleDataset), 2);
  assert.equal(evaluateExcelFormula('=SUMIF(C1:C4, "apple", A1:A4)', sampleDataset), 40);
  assert.equal(evaluateExcelFormula('=AVERAGEIF(C1:C4, "apple", A1:A4)', sampleDataset), 20);
});

test("VLOOKUP, INDEX, MATCH", () => {
  assert.equal(evaluateExcelFormula('=VLOOKUP("banana", C1:C4, 1, FALSE)', sampleDataset), "banana");
  assert.equal(evaluateExcelFormula("=INDEX(A1:B4, 2, 2)", sampleDataset), 200);
  assert.equal(evaluateExcelFormula('=MATCH("cherry", C1:C4, 0)', sampleDataset), 4);
});

test("Text functions: CONCAT, LEFT, RIGHT, MID, UPPER, LOWER, LEN", () => {
  assert.equal(evaluateExcelFormula('=CONCAT("Hello", " ", "World")', sampleDataset), "Hello World");
  assert.equal(evaluateExcelFormula('=LEFT("Antigravity", 4)', sampleDataset), "Anti");
  assert.equal(evaluateExcelFormula('=RIGHT("Antigravity", 4)', sampleDataset), "vity");
  assert.equal(evaluateExcelFormula('=MID("Antigravity", 5, 4)', sampleDataset), "grav");
  assert.equal(evaluateExcelFormula('=UPPER("excel")', sampleDataset), "EXCEL");
  assert.equal(evaluateExcelFormula('=LOWER("EXCEL")', sampleDataset), "excel");
  assert.equal(evaluateExcelFormula('=LEN("Excel")', sampleDataset), 5);
});

test("EXCEL_FUNCTION_CATALOG contains functions across all categories", () => {
  assert.ok(EXCEL_FUNCTION_CATALOG.length >= 40);
  const categories = new Set(EXCEL_FUNCTION_CATALOG.map((f) => f.category));
  assert.ok(categories.has("Math"));
  assert.ok(categories.has("Statistical"));
  assert.ok(categories.has("Logical"));
  assert.ok(categories.has("Text"));
  assert.ok(categories.has("Lookup"));
  assert.ok(categories.has("Date"));
});
