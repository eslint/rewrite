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
});
