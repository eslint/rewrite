/**
 * @fileoverview Tests for `package.json` exports.
 * @author lumir(lumirlumir)
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import assert from "node:assert";

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("package exports", () => {
	it("should prevent imports of internal modules", () => {
		assert.throws(
			() =>
				import.meta
					.resolve("@eslint/migrate-config/src/migrate-config.js"),
			{
				code: process.version.bun
					? "ERR_MODULE_NOT_FOUND"
					: "ERR_PACKAGE_PATH_NOT_EXPORTED",
			},
		);
	});
});
