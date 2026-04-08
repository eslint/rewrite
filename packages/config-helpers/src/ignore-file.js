/**
 * @fileoverview Ignore file utilities for the config-helpers package.
 * This file was forked from the source code for the compat package.
 *
 * @author Nicholas C. Zakas
 * @author Kirk Waiblinger
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";

//-----------------------------------------------------------------------------
// Types
//-----------------------------------------------------------------------------

/** @typedef {import("@eslint/core").ConfigObject} Config */

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Converts an ESLint ignore pattern to a minimatch pattern.
 * @param {string} pattern The .eslintignore or .gitignore pattern to convert.
 * @returns {string} The converted pattern.
 */
export function convertIgnorePatternToMinimatch(pattern) {
	const isNegated = pattern.startsWith("!");
	const negatedPrefix = isNegated ? "!" : "";
	const patternToTest = (isNegated ? pattern.slice(1) : pattern).trimEnd();

	// special cases
	if (["", "**", "/**", "**/"].includes(patternToTest)) {
		return `${negatedPrefix}${patternToTest}`;
	}

	const firstIndexOfSlash = patternToTest.indexOf("/");

	const matchEverywherePrefix =
		firstIndexOfSlash < 0 || firstIndexOfSlash === patternToTest.length - 1
			? "**/"
			: "";

	const patternWithoutLeadingSlash =
		firstIndexOfSlash === 0 ? patternToTest.slice(1) : patternToTest;

	/*
	 * Escape `{` and `(` because in gitignore patterns they are just
	 * literal characters without any specific syntactic meaning,
	 * while in minimatch patterns they can form brace expansion or extglob syntax.
	 *
	 * For example, gitignore pattern `src/{a,b}.js` ignores file `src/{a,b}.js`.
	 * But, the same minimatch pattern `src/{a,b}.js` ignores files `src/a.js` and `src/b.js`.
	 * Minimatch pattern `src/\{a,b}.js` is equivalent to gitignore pattern `src/{a,b}.js`.
	 */
	const escapedPatternWithoutLeadingSlash =
		patternWithoutLeadingSlash.replaceAll(
			// eslint-disable-next-line regexp/no-empty-lookarounds-assertion -- False positive
			/(?=((?:\\.|[^{(])*))\1([{(])/guy,
			"$1\\$2",
		);

	const matchInsideSuffix = patternToTest.endsWith("/**") ? "/*" : "";

	return `${negatedPrefix}${matchEverywherePrefix}${escapedPatternWithoutLeadingSlash}${matchInsideSuffix}`;
}

/**
 * @param {string} ignoreFilePath
 * @returns {string[]}
 */
function ignoreFilePathToPatterns(ignoreFilePath) {
	const ignoreFile = fs.readFileSync(ignoreFilePath, "utf8");
	const lines = ignoreFile.split(/\r?\n/u);

	return lines
		.map(line => line.trim())
		.filter(line => line && !line.startsWith("#"))
		.map(convertIgnorePatternToMinimatch);
}

/**
 * Helper to parse and validate the options to `includeIgnoreFile()`
 *
 * @param {{ mode?: unknown, name?: unknown } | undefined} options
 * @returns {{ mode: "eslintignore" | "gitignore", name: string }}
 */
function parseOptions(options) {
	// legacy compatibility with @eslint/compat's `includeIgnoreFile`
	if (typeof options === "string") {
		return { mode: "eslintignore", name: options };
	}

	const mode = options?.mode ?? "eslintignore";
	if (!(mode === "gitignore" || mode === "eslintignore")) {
		throw new Error(
			'The `mode` option must be specified as "gitignore" or "eslintignore"',
		);
	}

	const name = options?.name ?? `Imported .${mode} patterns`;
	if (typeof name !== "string") {
		throw new Error(
			"The `name` option must be specified as a string or omitted.",
		);
	}

	return { mode, name };
}

/**
 * @override
 *
 * Reads ignore files and returns objects with the ignore patterns.
 *
 * @param {string[]} ignoreFilePathArg
 * @param {object} [options]
 * @param {"eslintignore" | "gitignore"} [options.mode] Whether to interpret the contents of the ignore file relative to the cwd or the ignore file.
 * - mode: "eslintrc" (default): Interprets the ignore patterns relative to the cwd
 * - mode: "gitignore": Interprets the ignore patterns relative to the file
 *
 * @param {string} [options.name] The name to give the output config objects.
 *
 * @returns {Config[]}
 */

/**
 * @override
 *
 * Reads an ignore file and returns an object with the ignore patterns.
 *
 * @param {string} ignoreFilePathArg
 * @param {object} [options]
 * @param {"eslintignore" | "gitignore"} [options.mode] Whether to interpret the contents of the ignore file relative to the cwd or the ignore file.
 * - mode: "eslintrc" (default): Interprets the ignore patterns relative to the cwd
 * - mode: "gitignore": Interprets the ignore patterns relative to the file
 *
 * @param {string} [options.name] The name to give the output config object.
 *
 * @returns {Config}
 */

/**
 * @override
 *
 * Reads an ignore file(s) and returns an object(s) with the ignore patterns.
 *
 * @param {string[] | string} ignoreFilePathArg
 * @param {object} [options]
 * @param {"eslintignore" | "gitignore"} [options.mode] Whether to interpret the contents of the ignore file relative to the cwd or the ignore file.
 * - mode: "eslintrc" (default): Interprets the ignore patterns relative to the cwd
 * - mode: "gitignore": Interprets the ignore patterns relative to the file
 *
 * @param {string} [options.name] The name to give the output config objects.
 *
 * @returns {Config[] | Config}
 */
export function includeIgnoreFile(ignoreFilePathArg, options) {
	const returnSingleObject = !Array.isArray(ignoreFilePathArg);
	const ignoreFilePaths = Array.isArray(ignoreFilePathArg)
		? ignoreFilePathArg
		: [ignoreFilePathArg];
	for (const ignorePath of ignoreFilePaths) {
		if (typeof ignorePath !== "string") {
			throw new Error(
				"The first argument to `includeIgnoreFile()` should be a string or array of strings",
			);
		}
		if (!path.isAbsolute(ignorePath)) {
			throw new Error(
				`The ignore file location must be an absolute path. Received ${ignorePath}`,
			);
		}
	}

	const { mode, name } = parseOptions(options);

	if (returnSingleObject) {
		return {
			name,
			ignores: ignoreFilePathToPatterns(ignoreFilePathArg),
			...(mode === "gitignore"
				? { basePath: path.dirname(ignoreFilePathArg) }
				: {}),
		};
	}

	return ignoreFilePaths.map((ignoreFilePath, i) => ({
		name: `${name} (${i})`,
		ignores: ignoreFilePathToPatterns(ignoreFilePath),
		...(mode === "gitignore"
			? { basePath: path.dirname(ignoreFilePath) }
			: {}),
	}));
}
