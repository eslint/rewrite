/**
 * @fileoverview Polyfill for Node.js `path.toNamespacedPath`
 * @author Francesco Trotta
 */

import { resolve, sep } from "node:path";

/**
 * @param {string} path A path to be converted into a namespace-prefixed path.
 * @returns {string} A namespace-prefixed path.
 */
function win32ToNamespacedPath(path) {
	if (typeof path !== "string" || path.length === 0) {
		return path;
	}

	const resolvedPath = resolve(path);
	if (resolvedPath.length <= 2) {
		return path;
	}

	if (/^\\\\[^.?]/u.test(resolvedPath)) {
		// Matched non-long UNC root, convert the path to a long UNC path
		return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
	}
	if (/^[a-z]:\\/iu.test(resolvedPath)) {
		// Matched device root, convert the path to a long UNC path
		return `\\\\?\\${resolvedPath}`;
	}
	return resolvedPath;
}

// On non-Windows systems, `toNamespacedPath` returns the argument as is.
export default sep === "\\" ? win32ToNamespacedPath : arg => arg;
