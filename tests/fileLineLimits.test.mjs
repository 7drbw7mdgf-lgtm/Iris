import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const MAX_LINES = 400;

function scanDir(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === "dist" ||
        entry.name === "target" ||
        entry.name === ".git" ||
        entry.name === ".vscode" ||
        entry.name === ".claude"
      ) {
        continue;
      }
      scanDir(fullPath, fileList);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if ([".ts", ".tsx", ".rs", ".css", ".js", ".mjs"].includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

test("all source files adhere strictly to the 400-line ceiling", () => {
  const files = scanDir(ROOT_DIR);
  assert.ok(files.length > 50, "Expected at least 50 scanned source files");

  const oversized = [];
  const genericallyNamedCode = [];

  for (const file of files) {
    const relativePath = path.relative(ROOT_DIR, file);
    const content = fs.readFileSync(file, "utf8");
    const lineCount = content.split("\n").length;

    if (lineCount > MAX_LINES) {
      oversized.push(`${relativePath} (${lineCount} lines)`);
    }

    const ext = path.extname(file);
    if ([".ts", ".tsx", ".rs"].includes(ext)) {
      if (/(^|[/\\])part[_-]?\d+\.[a-z]+$/i.test(relativePath)) {
        genericallyNamedCode.push(relativePath);
      }
    }
  }

  assert.deepEqual(
    oversized,
    [],
    `The following files exceed the strict ${MAX_LINES}-line ceiling:\n${oversized.join("\n")}`
  );

  assert.deepEqual(
    genericallyNamedCode,
    [],
    `The following code files use generic numbered names instead of semantic naming:\n${genericallyNamedCode.join("\n")}`
  );
});
