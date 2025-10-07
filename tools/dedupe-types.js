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
	const importSpecs = new Set();
	const outputLines = [];

	for (const line of lines) {
		const match = line.match(
			/^(?<start>\/\*\*\s*@typedef\s+\{)import\("(?<importSpec>[^)]+)"\)(?<end>.*)/u,
		);
		if (!match) {
			outputLines.push(line);
		} else if (!typedefs.has(line)) {
			typedefs.add(line);
			const { start, importSpec, end } = match.groups;
			const importName = `_${importSpec.replaceAll(/\W/gu, "")}`;
			if (!importSpecs.has(importSpec)) {
				importSpecs.add(importSpec);
				outputLines.push(
					`/** @import * as ${importName} from "${importSpec}"; */`,
				);
			}
			outputLines.push(`${start}${importName}${end}`);
		}
	}

	fs.writeFileSync(filePath, outputLines.join("\n"), "utf8");
});
