/**
 * @fileoverview Tests for package entrypoint
 */

//------------------------------------------------------------------------------
// Imports
//------------------------------------------------------------------------------

import * as api from "../src/index.js";
import assert from "node:assert";

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("index", () => {
	it("should export defineConfig()", () => {
		assert.strictEqual(typeof api.defineConfig, "function");
	});

	it("should export globalIgnores()", () => {
		assert.strictEqual(typeof api.globalIgnores, "function");
	});

	it("should export includeIgnoreFile()", () => {
		assert.strictEqual(typeof api.includeIgnoreFile, "function");
	});

	it("should export convertIgnorePatternToMinimatch()", () => {
		assert.strictEqual(
			typeof api.convertIgnorePatternToMinimatch,
			"function",
		);
	});
});
