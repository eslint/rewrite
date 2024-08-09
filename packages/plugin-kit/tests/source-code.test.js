/**
 * @fileoverview Tests for ConfigCommentParser object.
 * @author Nicholas C. Zakas
 */

//------------------------------------------------------------------------------
// Imports
//------------------------------------------------------------------------------

import assert from "node:assert";
import { CallMethodStep, VisitNodeStep } from "../src/source-code.js";

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("SourceCode", () => {
	describe("CallMethodStep", () => {
		it("should create a CallMethodStep instance", () => {
			const step = new CallMethodStep({
				target: "foo",
				args: ["bar"],
			});

			assert.strictEqual(step.type, "call");
			assert.strictEqual(step.kind, 2);
			assert.strictEqual(step.target, "foo");
			assert.deepStrictEqual(step.args, ["bar"]);
		});
	});

	describe("VisitNodeStep", () => {
		it("should create a VisitNodeStep instance", () => {
			const step = new VisitNodeStep({
				target: "foo",
				phase: 1,
				args: ["bar"],
			});

			assert.strictEqual(step.type, "visit");
			assert.strictEqual(step.kind, 1);
			assert.strictEqual(step.target, "foo");
			assert.strictEqual(step.phase, 1);
			assert.deepStrictEqual(step.args, ["bar"]);
		});

		it("should create a VisitNodeStep instance in phase 2", () => {
			const step = new VisitNodeStep({
				target: "foo",
				phase: 2,
				args: ["bar"],
			});

			assert.strictEqual(step.type, "visit");
			assert.strictEqual(step.kind, 1);
			assert.strictEqual(step.target, "foo");
			assert.strictEqual(step.phase, 2);
			assert.deepStrictEqual(step.args, ["bar"]);
		});
	});
});
