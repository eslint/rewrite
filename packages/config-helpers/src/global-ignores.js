/**
 * @fileoverview Global ignores helper function.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Type Definitions
//-----------------------------------------------------------------------------

/** @typedef {import("eslint").Linter.Config} Config */

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

let globalIgnoreCount = 0;

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Creates a global ignores config with the given patterns.
 * @param {string[]} ignorePatterns The ignore patterns.
 * @param {string} [name] The name of the global ignores config.
 * @returns {Config} The global ignores config.
 * @throws {TypeError} If ignorePatterns is not an array or if it is empty.
 */
export function globalIgnores(ignorePatterns, name) {
	if (!Array.isArray(ignorePatterns)) {
		throw new TypeError("ignorePatterns must be an array");
	}

	if (ignorePatterns.length === 0) {
		throw new TypeError("ignorePatterns must contain at least one pattern");
	}

	const id = globalIgnoreCount++;

	return {
		name: name || `globalIgnores ${id}`,
		ignores: ignorePatterns,
	};
}
