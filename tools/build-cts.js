/**
 * @fileoverview Creates a CommonJS type declaration file that re-exports ESM types.
 *
 * Usage:
 *    node tools/build-cts.js /path/to/esm/index.d.ts /path/to/cjs/index.d.cts
 *
 * @author Francesco Trotta
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path/posix";

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

const newDir = path.dirname(newFilename);
const esmPath = path.relative(newDir, filename).replace(/\.d\.ts$/u, ".js");
const newSourceText = `
import * as types from "${esmPath}" with { "resolution-mode": "import" };
export = types;
`.trimStart();

await mkdir(newDir, { recursive: true });
await writeFile(newFilename, newSourceText);
