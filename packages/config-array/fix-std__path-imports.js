/*
 * Replace import specifiers in "dist" modules to use the bundled versions of "@jsr/std__path".
 *
 * In "dist/cjs/index.cjs":
 * - '@jsr/std__path/posix'     → './std__path/posix.cjs'
 * - '@jsr/std__path/windows'   → './std__path/windows.cjs'
 *
 * In "dist/esm/index.js":
 * - '@jsr/std__path/posix'     → './std__path/posix.js'
 * - '@jsr/std__path/windows'   → './std__path/windows.js'
 */

import { readFile, writeFile } from "node:fs/promises";

async function replaceInFile(file, search, replacement) {
	let text = await readFile(file, "utf-8");
	text = text.replace(search, replacement);
	await writeFile(file, text);
}

const SEARCH_REGEXP = /'@jsr\/std__path\/(.+?)'/gu;

await Promise.all([
	replaceInFile("dist/cjs/index.cjs", SEARCH_REGEXP, "'./std__path/$1.cjs'"),
	replaceInFile("dist/esm/index.js", SEARCH_REGEXP, "'./std__path/$1.js'"),
]);
