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

/** @typedef {import("@eslint/core").ConfigObject} ConfigObject */

/**
 * @typedef {Object} IncludeIgnoreFileOptionsObject
 * @property {boolean} [gitignoreResolution] Whether to interpret the contents of an ignore file relative to the config file or the ignore file.
 * - gitignoreResolution: false (default): Interprets ignore patterns relative to the config file
 * - gitignoreResolution: true: Interprets the ignore patterns in a file relative to the ignore file
 * @property {string} [name] The name to give the output config object(s).
 */

/**
 * Options for `includeIgnoreFile()`. May be provided as an object or, for
 * legacy compatibility with `@eslint/compat`, as a string which is treated as
 * the `name` option.
 * @typedef {IncludeIgnoreFileOptionsObject | string} IncludeIgnoreFileOptions
 */

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
 * Reads an ignore file and converts its entries to minimatch patterns.
 * @param {string} ignoreFilePath The absolute path to the ignore file.
 * @returns {string[]} The minimatch patterns from the ignore file.
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
 * @param {string | { gitignoreResolution?: unknown, name?: unknown } | undefined} options The options to parse.
 * @returns {{ gitignoreResolution: boolean, name: string }} The normalized options.
 * @throws {TypeError} If options is not an object or string, or if an option has an invalid type.
 */
function parseOptions(options) {
	// legacy compatibility with @eslint/compat's `includeIgnoreFile`
	if (typeof options === "string") {
		return { gitignoreResolution: false, name: options };
	}

	const optionsObject = options ?? {};
	if (typeof optionsObject !== "object" || Array.isArray(optionsObject)) {
		throw new TypeError(
			"The options argument to `includeIgnoreFile()` should be an object or a string.",
		);
	}

	const gitignoreResolution = optionsObject.gitignoreResolution ?? false;
	if (typeof gitignoreResolution !== "boolean") {
		throw new TypeError(
			"The `gitignoreResolution` option must be specified a boolean or omitted",
		);
	}

	const name = optionsObject.name ?? `Imported .gitignore patterns`;
	if (typeof name !== "string") {
		throw new TypeError(
			"The `name` option must be specified as a string or omitted.",
		);
	}

	return { gitignoreResolution, name };
}

/**
 * @overload
 * @param {string[]} ignoreFilePathArg The paths of ignore files to include.
 * @param {IncludeIgnoreFileOptions} [options]
 * @returns {ConfigObject[]}
 */

/**
 * @overload
 * @param {string} ignoreFilePathArg The path of the ignore file to include.
 * @param {IncludeIgnoreFileOptions} [options]
 * @returns {ConfigObject}
 */

/**
 * @overload
 * @param {string[] | string} ignoreFilePathArg The path(s) of the ignore file(s) to include.
 * @param {IncludeIgnoreFileOptions} [options]
 * @returns {ConfigObject[] | ConfigObject}
 */

/**
 * Reads an ignore file(s) and returns an object(s) with the ignore patterns.
 * @param {string[] | string} ignoreFilePathArg The path(s) of the ignore file(s) to include.
 * @param {IncludeIgnoreFileOptions} [options] The options for including the ignore file(s).
 * @returns {ConfigObject[] | ConfigObject} The config object(s) with the ignore patterns.
 * @throws {TypeError} If the ignore file path argument contains a non-string value or if options are invalid.
 * @throws {Error} If an ignore file path is not absolute.
 */
export function includeIgnoreFile(ignoreFilePathArg, options) {
	const returnSingleObject = !Array.isArray(ignoreFilePathArg);
	const ignoreFilePaths = Array.isArray(ignoreFilePathArg)
		? ignoreFilePathArg
		: [ignoreFilePathArg];
	for (const ignorePath of ignoreFilePaths) {
		if (typeof ignorePath !== "string") {
			throw new TypeError(
				"The first argument to `includeIgnoreFile()` should be a string or array of strings",
			);
		}
		if (!path.isAbsolute(ignorePath)) {
			throw new Error(
				`The ignore file location must be an absolute path. Received ${ignorePath}`,
			);
		}
	}

	const { gitignoreResolution, name } = parseOptions(options);

	if (returnSingleObject) {
		return {
			name,
			ignores: ignoreFilePathToPatterns(ignoreFilePathArg),
			...(gitignoreResolution
				? { basePath: path.dirname(ignoreFilePathArg) }
				: {}),
		};
	}

	return ignoreFilePaths.map((ignoreFilePath, i) => ({
		name: `${name} (${i})`,
		ignores: ignoreFilePathToPatterns(ignoreFilePath),
		...(gitignoreResolution
			? { basePath: path.dirname(ignoreFilePath) }
			: {}),
	}));
}
