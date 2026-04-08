/**
 * @fileoverview Rewrites import expressions for CommonJS compatibility.
 * This script creates "dist/cjs/index.d.cts" from "dist/esm/index.d.ts" by modifying imports
 * from `"./types.ts"` to `"./types.cts"`.
 *
 *    node tools/build-cts.js /path/to/esm/index.d.ts path/to/cjs/index.d.cts
 *
 * @author Francesco Trotta
 */

import { readFile, writeFile } from "node:fs/promises";

const filename = process.argv[2];
const newFilename = process.argv[3];

if (!filename) {
	console.error("No filename provided.");
	process.exit(1);
}

if (!newFilename) {
	console.error("No new filename provided.");
	process.exit(1);
}

const oldSourceText = await readFile(filename, "utf-8");
const newSourceText = oldSourceText.replaceAll('"./types.ts"', '"./types.cts"');

await writeFile(newFilename, newSourceText);
