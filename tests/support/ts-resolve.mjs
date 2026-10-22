// Lets `node --test` import the app's TypeScript sources. They use
// extensionless relative imports (`./types`) and mix type/value imports,
// both of which Vite allows but Node's built-in type stripping rejects,
// so resolve the extension here and compile .ts with esbuild (Vite's own).
import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transformSync } from "esbuild";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (err) {
      if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw err;
    }
  },
  load(url, context, nextLoad) {
    // papaparse is a UMD bundle, so Node sees no named exports and
    // `import * as Papa` has no `parse`; expose the CJS object as ESM.
    if (/\/papaparse\/papaparse(\.min)?\.js$/.test(url) && !context.conditions?.includes("require")) {
      return {
        format: "module",
        shortCircuit: true,
        source: `import { createRequire } from "node:module";
const Papa = createRequire(${JSON.stringify(url)})(${JSON.stringify(fileURLToPath(url))});
export const { parse, unparse } = Papa;
export default Papa;`,
      };
    }
    if (!url.startsWith("file:") || !/\.tsx?$/.test(url)) return nextLoad(url, context);
    const path = fileURLToPath(url);
    const { code } = transformSync(readFileSync(path, "utf8"), {
      loader: path.endsWith(".tsx") ? "tsx" : "ts",
      format: "esm",
      sourcefile: path,
      sourcemap: "inline",
    });
    return { format: "module", source: code, shortCircuit: true };
  },
});
