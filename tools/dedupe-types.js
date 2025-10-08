/**
 * @fileoverview Strips typedef aliases from the rolled-up file. This
 * is necessary because the TypeScript compiler throws an error when
 * it encounters a duplicate typedef.
 *
 * Usage:
 *  node scripts/strip-typedefs.js filename1.js filename2.js ...
 *
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import fs from "node:fs";

//-----------------------------------------------------------------------------
// Main
//-----------------------------------------------------------------------------

// read files from the command line
const files = process.argv.slice(2);

files.forEach(filePath => {
	const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/gu);
	const typedefs = new Set();
	const importSources = new Set();
	const outputLines = [];

	for (const line of lines) {
		const match = line.match(
			/^(?<start>\/\*\*\s*@typedef\s+\{)import\("(?<importSource>.+?)"\)(?<end>.*)/u,
		);
		if (!match) {
			// not a typedef, so just copy the line
			outputLines.push(line);
		} else if (!typedefs.has(line)) {
			// we haven't seen this typedef before, so process it
			typedefs.add(line);
			const { start, importSource, end } = match.groups;
			const importName = `_${importSource.replace(/\W/gu, "")}`;
			if (!importSources.has(importSource)) {
				// we haven't seen this import before, so add an @import comment
				importSources.add(importSource);
				outputLines.push(
					`/** @import * as ${importName} from "${importSource}"; */`,
				);
			}
			outputLines.push(`${start}${importName}${end}`);
		}
	}

	fs.writeFileSync(filePath, outputLines.join("\n"), "utf8");
});
