/**
 * @fileoverview Ignore file utilities for the compat package.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import fs from "node:fs";

//-----------------------------------------------------------------------------
// Types
//-----------------------------------------------------------------------------

/** @typedef {import("eslint").Linter.FlatConfig} FlatConfig */

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

	const matchInsideSuffix = patternToTest.endsWith("/**") ? "/*" : "";

	return `${negatedPrefix}${matchEverywherePrefix}${patternWithoutLeadingSlash}${matchInsideSuffix}`;
}

/**
 * Reads an ignore file and returns an object with the ignore patterns.
 * @param {string} ignoreFilePath The path to the ignore file.
 * @returns {FlatConfig} An object with an `ignores` property that is an array of ignore patterns.
 */
export function includeIgnoreFile(ignoreFilePath) {
	const ignoreFile = fs.readFileSync(ignoreFilePath, "utf8");
	const lines = ignoreFile.split(/\r?\n/);

	return {
		name: "Imported .gitignore patterns",
		ignores: lines
			.map(line => line.trim())
			.filter(line => line && !line.startsWith("#"))
			.map(convertIgnorePatternToMinimatch),
	};
}
