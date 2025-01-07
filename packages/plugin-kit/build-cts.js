/**
 * @fileoverview Rewrites import expressions for CommonJS compatibility.
 * This script creates "dist/cjs/index.d.cts" from "dist/esm/index.d.ts" by modifying imports
 * from `"./types.ts"` to `"./types.cts"`.
 *
 * @author Francesco Trotta
 */

import { readFile, writeFile } from "node:fs/promises";

const oldSourceText = await readFile("dist/esm/index.d.ts", "utf-8");
const newSourceText = oldSourceText.replaceAll(
	'import("./types.ts")',
	'import("./types.cts")',
);
await writeFile("dist/cjs/index.d.cts", newSourceText);
