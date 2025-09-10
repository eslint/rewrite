/**
 * @fileoverview Merge Strategy Tests
 */

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

import assert from "node:assert";
import { ValidationStrategy } from "../src/index.js";

//-----------------------------------------------------------------------------
// Class
//-----------------------------------------------------------------------------

describe("ValidationStrategy", () => {
	describe("boolean", () => {
		it("should not throw an error when the value is a boolean", () => {
			ValidationStrategy.boolean(true);
		});

		it("should throw an error when the value is null", () => {
			assert.throws(() => {
				ValidationStrategy.boolean(null);
			}, /Expected a Boolean/u);
		});

		it("should throw an error when the value is a string", () => {
			assert.throws(() => {
				ValidationStrategy.boolean("foo");
			}, /Expected a Boolean/u);
		});

		it("should throw an error when the value is a number", () => {
			assert.throws(() => {
				ValidationStrategy.boolean(123);
			}, /Expected a Boolean/u);
		});

		it("should throw an error when the value is an object", () => {
			assert.throws(() => {
				ValidationStrategy.boolean({});
			}, /Expected a Boolean/u);
		});
	});

	describe("number", () => {
		it("should not throw an error when the value is a number", () => {
			ValidationStrategy.number(25);
		});

		it("should throw an error when the value is null", () => {
			assert.throws(() => {
				ValidationStrategy.number(null);
			}, /Expected a number/u);
		});

		it("should throw an error when the value is a string", () => {
			assert.throws(() => {
				ValidationStrategy.number("foo");
			}, /Expected a number/u);
		});

		it("should throw an error when the value is a boolean", () => {
			assert.throws(() => {
				ValidationStrategy.number(true);
			}, /Expected a number/u);
		});

		it("should throw an error when the value is an object", () => {
			assert.throws(() => {
				ValidationStrategy.number({});
			}, /Expected a number/u);
		});
	});

	describe("object", () => {
		it("should not throw an error when the value is an object", () => {
			ValidationStrategy.object({});
		});

		it("should throw an error when the value is null", () => {
			assert.throws(() => {
				ValidationStrategy.object(null);
			}, /Expected an object/u);
		});

		it("should throw an error when the value is a string", () => {
			assert.throws(() => {
				ValidationStrategy.object("");
			}, /Expected an object/u);
		});
	});

	describe("array", () => {
		it("should not throw an error when the value is an array", () => {
			ValidationStrategy.array([]);
		});

		it("should throw an error when the value is null", () => {
			assert.throws(() => {
				ValidationStrategy.array(null);
			}, /Expected an array/u);
		});

		it("should throw an error when the value is a string", () => {
			assert.throws(() => {
				ValidationStrategy.array("");
			}, /Expected an array/u);
		});

		it("should throw an error when the value is an object", () => {
			assert.throws(() => {
				ValidationStrategy.array({});
			}, /Expected an array/u);
		});
	});

	describe("object?", () => {
		it("should not throw an error when the value is an object", () => {
			ValidationStrategy["object?"]({});
		});

		it("should not throw an error when the value is null", () => {
			ValidationStrategy["object?"](null);
		});

		it("should throw an error when the value is a string", () => {
			assert.throws(() => {
				ValidationStrategy["object?"]("");
			}, /Expected an object/u);
		});
	});

	describe("string", () => {
		it("should not throw an error when the value is a string", () => {
			ValidationStrategy.string("foo");
		});

		it("should not throw an error when the value is an empty string", () => {
			ValidationStrategy.string("");
		});

		it("should throw an error when the value is null", () => {
			assert.throws(() => {
				ValidationStrategy.string(null);
			}, /Expected a string/u);
		});

		it("should throw an error when the value is an object", () => {
			assert.throws(() => {
				ValidationStrategy.string({});
			}, /Expected a string/u);
		});
	});

	describe("string!", () => {
		it("should not throw an error when the value is an string", () => {
			ValidationStrategy["string!"]("foo");
		});

		it("should throw an error when the value is an empty string", () => {
			assert.throws(() => {
				ValidationStrategy["string!"]("");
			}, /Expected a non-empty string/u);
		});

		it("should throw an error when the value is null", () => {
			assert.throws(() => {
				ValidationStrategy["string!"](null);
			}, /Expected a non-empty string/u);
		});

		it("should throw an error when the value is an object", () => {
			assert.throws(() => {
				ValidationStrategy["string!"]({});
			}, /Expected a non-empty string/u);
		});
	});
});
