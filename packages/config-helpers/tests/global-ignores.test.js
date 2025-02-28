/**
 * @fileoverview Tests for globalIgnores()
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import assert from "node:assert";
import { globalIgnores } from "../src/global-ignores.js";

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("globalIgnores", () => {
	it("should create config with custom name", () => {
		const result = globalIgnores(["*.test.js"], "custom-name");
		assert.deepStrictEqual(result, {
			name: "custom-name",
			ignores: ["*.test.js"],
		});
	});

	it("should create config with auto-generated name", () => {
		const result = globalIgnores(["*.test.js"]);
		assert.strictEqual(result.name.startsWith("globalIgnores "), true);
		assert.deepStrictEqual(result.ignores, ["*.test.js"]);
	});

	it("should increment auto-generated names", () => {
		const result1 = globalIgnores(["*.test.js"]);
		const result2 = globalIgnores(["*.spec.js"]);
		assert.notStrictEqual(result1.name, result2.name);
	});

	it("should throw error for non-array input", () => {
		assert.throws(
			() => {
				globalIgnores("*.test.js");
			},
			{
				name: "TypeError",
				message: "ignorePatterns must be an array",
			},
		);
	});

	it("should throw error for empty array", () => {
		assert.throws(
			() => {
				globalIgnores([]);
			},
			{
				name: "TypeError",
				message: "ignorePatterns must contain at least one pattern",
			},
		);
	});
});
