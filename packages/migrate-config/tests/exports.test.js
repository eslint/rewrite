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
		let error;

		try {
			import.meta.resolve("@eslint/migrate-config/src/migrate-config.js");
		} catch (caughtError) {
			error = caughtError;
		}

		assert.strictEqual(error.code, "ERR_PACKAGE_PATH_NOT_EXPORTED");
	});
});
