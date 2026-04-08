/**
 * @fileoverview Ignore file utilities for the compat package.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";

//-----------------------------------------------------------------------------
// Types
//-----------------------------------------------------------------------------

/** @typedef {import("@eslint/core").ConfigObject} FlatConfig */

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
 * Checks if a gitattributes attribute entry matches the requested attribute.
 * @param {string} entry The attribute entry from the line (e.g., "attr", "-attr", "attr=value").
 * @param {string} attrName The attribute name to match.
 * @param {string|undefined} attrValue The expected value, or undefined for bare name matching.
 * @returns {boolean} Whether the entry matches.
 */
function matchesAttribute(entry, attrName, attrValue) {
	// Unset: -attr
	if (entry.startsWith("-")) {
		return false;
	}

	const [entryName, entryValue] = entry.split("=");

	if (entryValue === undefined) {
		// Bare entry: "attr" — matches bare name queries only
		return attrValue === undefined && entryName === attrName;
	}

	if (entryName !== attrName) {
		return false;
	}

	if (attrValue !== undefined) {
		// name=value query: exact match
		return entryValue === attrValue;
	}

	// Bare name query with value entry: only "true" is truthy
	return entryValue === "true";
}

/**
 * Reads a .gitattributes file and returns an object with ignore patterns
 * for files matching the specified attribute.
 * @param {string} gitattributesPath The absolute path to the .gitattributes file.
 * @param {string} attribute The attribute to match. Either a bare name or "name=value".
 * @param {string} [name] The name of the config.
 * @returns {FlatConfig} An object with `name` and `ignores` properties.
 * @throws {Error} If the path is not an absolute path.
 */
export function ignoreFilesWithGitAttribute(
	gitattributesPath,
	attribute,
	name,
) {
	if (!path.isAbsolute(gitattributesPath)) {
		throw new Error("The ignore file location must be an absolute path.");
	}

	const [attrName, attrValue] = attribute.split("=");

	const file = fs.readFileSync(gitattributesPath, "utf8");
	const lines = file
		.split(/\r?\n/u)
		.map(line => line.trim())
		.filter(line => line && !line.startsWith("#"));

	return {
		name: name || `Imported .gitattributes patterns for ${attribute}`,
		ignores: lines
			.map(line => line.split(/\s+/u))
			.filter(parts =>
				parts
					.slice(1)
					.some(entry =>
						matchesAttribute(entry, attrName, attrValue),
					),
			)
			.map(parts => convertIgnorePatternToMinimatch(parts[0])),
	};
}

/**
 * Reads an ignore file and returns an object with the ignore patterns.
 * @param {string} ignoreFilePath The absolute path to the ignore file.
 * @param {string} [name] The name of the ignore file config.
 * @returns {FlatConfig} An object with an `ignores` property that is an array of ignore patterns.
 * @throws {Error} If the ignore file path is not an absolute path.
 */
export function includeIgnoreFile(ignoreFilePath, name) {
	if (!path.isAbsolute(ignoreFilePath)) {
		throw new Error("The ignore file location must be an absolute path.");
	}

	const ignoreFile = fs.readFileSync(ignoreFilePath, "utf8");
	const lines = ignoreFile.split(/\r?\n/u);

	return {
		name: name || "Imported .gitignore patterns",
		ignores: lines
			.map(line => line.trim())
			.filter(line => line && !line.startsWith("#"))
			.map(convertIgnorePatternToMinimatch),
	};
}
