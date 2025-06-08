/**
 * @fileoverview Tests for ConfigCommentParser object.
 * @author Nicholas C. Zakas
 */

//------------------------------------------------------------------------------
// Imports
//------------------------------------------------------------------------------

import assert from "node:assert";
import {
	CallMethodStep,
	VisitNodeStep,
	Directive,
	TextSourceCodeBase,
} from "../src/source-code.js";

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("source-code", () => {
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

	describe("Directive", () => {
		it("should create a new instance", () => {
			const type = "disable";
			const node = { foo: "bar" };
			const value = "baz";
			const justification = "qux";

			const directive = new Directive({
				type,
				node,
				value,
				justification,
			});

			assert.strictEqual(directive.type, type);
			assert.strictEqual(directive.node, node);
			assert.strictEqual(directive.value, value);
			assert.strictEqual(directive.justification, justification);
		});
	});

	describe("TextSourceCodeBase", () => {
		describe("new TextSourceCodeBase", () => {
			it("should create a new instance", () => {
				const ast = {};
				const text = "foo";
				const sourceCode = new TextSourceCodeBase({ ast, text });

				assert.strictEqual(sourceCode.ast, ast);
				assert.strictEqual(sourceCode.text, "foo");
			});

			it("should automatically split text into lines", () => {
				const ast = {};
				const text = "foo\nbar\nbaz";
				const sourceCode = new TextSourceCodeBase({ ast, text });

				assert.deepStrictEqual(sourceCode.lines, ["foo", "bar", "baz"]);
			});

			it("should automatically split text into lines with different lineEndingPattern", () => {
				const ast = {};
				const text = "foo\u2028bar\u2029baz";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineEndingPattern: /\u2028|\u2029/gu,
				});

				assert.deepStrictEqual(sourceCode.lines, ["foo", "bar", "baz"]);
			});
		});

		describe("getLoc()", () => {
			it("should return a location object when a loc property is present", () => {
				const ast = {
					loc: {
						start: { line: 1, column: 0 },
						end: { line: 1, column: 3 },
					},
				};
				const text = "foo";
				const sourceCode = new TextSourceCodeBase({ ast, text });

				assert.deepStrictEqual(sourceCode.getLoc(ast), ast.loc);
			});

			it("should return a location object when a position property is present", () => {
				const ast = {
					position: {
						start: { line: 1, column: 0 },
						end: { line: 1, column: 3 },
					},
				};
				const text = "foo";
				const sourceCode = new TextSourceCodeBase({ ast, text });

				assert.deepStrictEqual(sourceCode.getLoc(ast), ast.position);
			});

			it("should throw an error when neither loc nor position property is present", () => {
				const ast = {};
				const text = "foo";
				const sourceCode = new TextSourceCodeBase({ ast, text });

				assert.throws(() => {
					sourceCode.getLoc(ast);
				}, /Custom getLoc\(\) method must be implemented in the subclass\./u);
			});
		});

		describe("getLocFromIndex()", () => {
			it("should throw an error for non-numeric index", () => {
				const ast = {};
				const text = "foo\nbar";
				const sourceCode = new TextSourceCodeBase({ ast, text });

				assert.throws(
					() => {
						sourceCode.getLocFromIndex("5");
					},
					TypeError,
					"Expected `index` to be a number.",
				);
				assert.throws(
					() => {
						sourceCode.getLocFromIndex(null);
					},
					TypeError,
					"Expected `index` to be a number.",
				);
				assert.throws(
					() => {
						sourceCode.getLocFromIndex(undefined);
					},
					TypeError,
					"Expected `index` to be a number.",
				);
				assert.throws(
					() => {
						sourceCode.getLocFromIndex(true);
					},
					TypeError,
					"Expected `index` to be a number.",
				);
				assert.throws(
					() => {
						sourceCode.getLocFromIndex(false);
					},
					TypeError,
					"Expected `index` to be a number.",
				);
			});

			it("should throw an error for negative index", () => {
				const ast = {};
				const text = "foo\nbar";
				const sourceCode = new TextSourceCodeBase({ ast, text });

				assert.throws(
					() => {
						sourceCode.getLocFromIndex(-1);
					},
					RangeError,
					/Index out of range/u,
				);
			});

			it("should throw an error for index beyond text length", () => {
				const ast = {};
				const text = "foo\nbar";
				const sourceCode = new TextSourceCodeBase({ ast, text });

				assert.throws(
					() => {
						sourceCode.getLocFromIndex(text.length + 1);
					},
					RangeError,
					/Index out of range/u,
				);
			});

			it("should handle the special case of `text.length` when lineStart is 1 and columnStart is 0", () => {
				const ast = {};
				const text = "foo\nbar";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineStart: 1,
					columnStart: 0,
				});

				assert.deepStrictEqual(
					sourceCode.getLocFromIndex(text.length),
					{
						line: 2,
						column: 3,
					},
				);
			});

			it("should handle the special case of `text.length` when lineStart is 0 and columnStart is 1", () => {
				const ast = {};
				const text = "foo\nbar";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineStart: 0,
					columnStart: 1,
				});

				assert.deepStrictEqual(
					sourceCode.getLocFromIndex(text.length),
					{
						line: 1,
						column: 4,
					},
				);
			});

			it("should handle the special case of `text.length` when lineStart is 0 and columnStart is 0", () => {
				const ast = {};
				const text = "foo\nbar";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineStart: 0,
					columnStart: 0,
				});

				assert.deepStrictEqual(
					sourceCode.getLocFromIndex(text.length),
					{
						line: 1,
						column: 3,
					},
				);
			});

			it("should handle the special case of `text.length` when lineStart is 1 and columnStart is 1", () => {
				const ast = {};
				const text = "foo\nbar";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineStart: 1,
					columnStart: 1,
				});

				assert.deepStrictEqual(
					sourceCode.getLocFromIndex(text.length),
					{
						line: 2,
						column: 4,
					},
				);
			});

			it("should convert index to location when lineStart is 1 and columnStart is 0", () => {
				const ast = {};
				const text = "foo\nbar\r\nbaz";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineStart: 1,
					columnStart: 0,
				});

				assert.deepStrictEqual(sourceCode.getLocFromIndex(0), {
					line: 1,
					column: 0,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(1), {
					line: 1,
					column: 1,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(2), {
					line: 1,
					column: 2,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(3), {
					line: 1,
					column: 3,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(4), {
					line: 2,
					column: 0,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(5), {
					line: 2,
					column: 1,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(6), {
					line: 2,
					column: 2,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(7), {
					line: 2,
					column: 3,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(8), {
					line: 2,
					column: 4,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(9), {
					line: 3,
					column: 0,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(10), {
					line: 3,
					column: 1,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(11), {
					line: 3,
					column: 2,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(12), {
					line: 3,
					column: 3,
				});
			});

			it("should convert index to location when lineStart is 0 and columnStart is 1", () => {
				const ast = {};
				const text = "foo\nbar\r\nbaz";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineStart: 0,
					columnStart: 1,
				});

				assert.deepStrictEqual(sourceCode.getLocFromIndex(0), {
					line: 0,
					column: 1,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(1), {
					line: 0,
					column: 2,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(2), {
					line: 0,
					column: 3,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(3), {
					line: 0,
					column: 4,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(4), {
					line: 1,
					column: 1,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(5), {
					line: 1,
					column: 2,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(6), {
					line: 1,
					column: 3,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(7), {
					line: 1,
					column: 4,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(8), {
					line: 1,
					column: 5,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(9), {
					line: 2,
					column: 1,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(10), {
					line: 2,
					column: 2,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(11), {
					line: 2,
					column: 3,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(12), {
					line: 2,
					column: 4,
				});
			});

			it("should convert index to location when lineStart is 0 and columnStart is 0", () => {
				const ast = {};
				const text = "foo\nbar\r\nbaz";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineStart: 0,
					columnStart: 0,
				});

				assert.deepStrictEqual(sourceCode.getLocFromIndex(0), {
					line: 0,
					column: 0,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(1), {
					line: 0,
					column: 1,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(2), {
					line: 0,
					column: 2,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(3), {
					line: 0,
					column: 3,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(4), {
					line: 1,
					column: 0,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(5), {
					line: 1,
					column: 1,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(6), {
					line: 1,
					column: 2,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(7), {
					line: 1,
					column: 3,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(8), {
					line: 1,
					column: 4,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(9), {
					line: 2,
					column: 0,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(10), {
					line: 2,
					column: 1,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(11), {
					line: 2,
					column: 2,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(12), {
					line: 2,
					column: 3,
				});
			});

			it("should convert index to location when lineStart is 1 and columnStart is 1", () => {
				const ast = {};
				const text = "foo\nbar\r\nbaz";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineStart: 1,
					columnStart: 1,
				});

				assert.deepStrictEqual(sourceCode.getLocFromIndex(0), {
					line: 1,
					column: 1,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(1), {
					line: 1,
					column: 2,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(2), {
					line: 1,
					column: 3,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(3), {
					line: 1,
					column: 4,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(4), {
					line: 2,
					column: 1,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(5), {
					line: 2,
					column: 2,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(6), {
					line: 2,
					column: 3,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(7), {
					line: 2,
					column: 4,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(8), {
					line: 2,
					column: 5,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(9), {
					line: 3,
					column: 1,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(10), {
					line: 3,
					column: 2,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(11), {
					line: 3,
					column: 3,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(12), {
					line: 3,
					column: 4,
				});
			});

			it("should handle empty text", () => {
				assert.deepStrictEqual(
					new TextSourceCodeBase({
						ast: {},
						text: "",
						lineStart: 1,
						columnStart: 0,
					}).getLocFromIndex(0),
					{
						line: 1,
						column: 0,
					},
				);
				assert.deepStrictEqual(
					new TextSourceCodeBase({
						ast: {},
						text: "",
						lineStart: 0,
						columnStart: 1,
					}).getLocFromIndex(0),
					{
						line: 0,
						column: 1,
					},
				);
				assert.deepStrictEqual(
					new TextSourceCodeBase({
						ast: {},
						text: "",
						lineStart: 0,
						columnStart: 0,
					}).getLocFromIndex(0),
					{
						line: 0,
						column: 0,
					},
				);
				assert.deepStrictEqual(
					new TextSourceCodeBase({
						ast: {},
						text: "",
						lineStart: 1,
						columnStart: 1,
					}).getLocFromIndex(0),
					{
						line: 1,
						column: 1,
					},
				);
			});

			it("should handle text with only line breaks", () => {
				const ast = {};
				const text = "\n\r\n";
				const sourceCode = new TextSourceCodeBase({ ast, text });

				assert.deepStrictEqual(sourceCode.getLocFromIndex(0), {
					line: 1,
					column: 0,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(1), {
					line: 2,
					column: 0,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(2), {
					line: 2,
					column: 1,
				});
				assert.deepStrictEqual(sourceCode.getLocFromIndex(3), {
					line: 3,
					column: 0,
				});
			});

			it("should symmetric with getIndexFromLoc() when lineStart is 1 and columnStart is 0", () => {
				const ast = {};
				const text = "foo\nbar\r\nbaz";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineStart: 1,
					columnStart: 0,
				});

				for (let index = 0; index <= text.length; index++) {
					assert.strictEqual(
						index,
						sourceCode.getIndexFromLoc(
							sourceCode.getLocFromIndex(index),
						),
					);
				}
			});

			it("should symmetric with getIndexFromLoc() when lineStart is 0 and columnStart is 1", () => {
				const ast = {};
				const text = "foo\nbar\r\nbaz";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineStart: 0,
					columnStart: 1,
				});

				for (let index = 0; index <= text.length; index++) {
					assert.strictEqual(
						index,
						sourceCode.getIndexFromLoc(
							sourceCode.getLocFromIndex(index),
						),
					);
				}
			});

			it("should symmetric with getIndexFromLoc() when lineStart is 0 and columnStart is 0", () => {
				const ast = {};
				const text = "foo\nbar\r\nbaz";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineStart: 0,
					columnStart: 0,
				});

				for (let index = 0; index <= text.length; index++) {
					assert.strictEqual(
						index,
						sourceCode.getIndexFromLoc(
							sourceCode.getLocFromIndex(index),
						),
					);
				}
			});

			it("should symmetric with getIndexFromLoc() when lineStart is 1 and columnStart is 1", () => {
				const ast = {};
				const text = "foo\nbar\r\nbaz";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineStart: 1,
					columnStart: 1,
				});

				for (let index = 0; index <= text.length; index++) {
					assert.strictEqual(
						index,
						sourceCode.getIndexFromLoc(
							sourceCode.getLocFromIndex(index),
						),
					);
				}
			});
		});

		describe("getIndexFromLoc()", () => {
			it("should throw an error for non-object loc", () => {
				const ast = {};
				const text = "foo\nbar";
				const sourceCode = new TextSourceCodeBase({ ast, text });

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc("invalid");
					},
					TypeError,
					"Expected `loc` to be an object with numeric `line` and `column` properties.",
				);

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc(null);
					},
					TypeError,
					"Expected `loc` to be an object with numeric `line` and `column` properties.",
				);

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc(undefined);
					},
					TypeError,
					"Expected `loc` to be an object with numeric `line` and `column` properties.",
				);
			});

			it("should throw an error for missing or non-numeric line/column properties", () => {
				const ast = {};
				const text = "foo\nbar";
				const sourceCode = new TextSourceCodeBase({ ast, text });

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({});
					},
					TypeError,
					"Expected `loc` to be an object with numeric `line` and `column` properties.",
				);

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: "1", column: 0 });
					},
					TypeError,
					"Expected `loc` to be an object with numeric `line` and `column` properties.",
				);

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: 1, column: "0" });
					},
					TypeError,
					"Expected `loc` to be an object with numeric `line` and `column` properties.",
				);
			});

			it("should throw an error for line number out of range when lineStart is 1 and columnStart is 0", () => {
				const ast = {};
				const text = "foo\nbar";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineStart: 1,
					columnStart: 0,
				});

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: 0, column: 0 });
					},
					RangeError,
					/Line number out of range/u,
				);

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: 3, column: 0 });
					},
					RangeError,
					/Line number out of range/u,
				);
			});

			it("should throw an error for line number out of range when lineStart is 0 and columnStart is 1", () => {
				const ast = {};
				const text = "foo\nbar";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineStart: 0,
					columnStart: 1,
				});

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: -1, column: 1 });
					},
					RangeError,
					/Line number out of range/u,
				);

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: 2, column: 1 });
					},
					RangeError,
					/Line number out of range/u,
				);
			});

			it("should throw an error for line number out of range when lineStart is 0 and columnStart is 0", () => {
				const ast = {};
				const text = "foo\nbar";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineStart: 0,
					columnStart: 0,
				});

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: -1, column: 0 });
					},
					RangeError,
					/Line number out of range/u,
				);

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: 2, column: 0 });
					},
					RangeError,
					/Line number out of range/u,
				);
			});

			it("should throw an error for line number out of range when lineStart is 1 and columnStart is 1", () => {
				const ast = {};
				const text = "foo\nbar";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineStart: 1,
					columnStart: 1,
				});

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: 0, column: 1 });
					},
					RangeError,
					/Line number out of range/u,
				);

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: 3, column: 1 });
					},
					RangeError,
					/Line number out of range/u,
				);
			});

			it("should throw an error for column number out of range when lineStart is 1 and columnStart is 0", () => {
				const ast = {};
				const text = "foo\nbar";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineStart: 1,
					columnStart: 0,
				});

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: 1, column: -1 });
					},
					RangeError,
					/Column number out of range/u,
				);

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: 1, column: 4 });
					},
					RangeError,
					/Column number out of range/u,
				);

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: 2, column: 4 });
					},
					RangeError,
					/Column number out of range/u,
				);
			});

			it("should throw an error for column number out of range when lineStart is 0 and columnStart is 1", () => {
				const ast = {};
				const text = "foo\nbar";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineStart: 0,
					columnStart: 1,
				});

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: 0, column: 0 });
					},
					RangeError,
					/Column number out of range/u,
				);

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: 0, column: 5 });
					},
					RangeError,
					/Column number out of range/u,
				);

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: 1, column: 5 });
					},
					RangeError,
					/Column number out of range/u,
				);
			});

			it("should throw an error for column number out of range when lineStart is 0 and columnStart is 0", () => {
				const ast = {};
				const text = "foo\nbar";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineStart: 0,
					columnStart: 0,
				});

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: 0, column: -1 });
					},
					RangeError,
					/Column number out of range/u,
				);

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: 0, column: 4 });
					},
					RangeError,
					/Column number out of range/u,
				);

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: 1, column: 4 });
					},
					RangeError,
					/Column number out of range/u,
				);
			});

			it("should throw an error for column number out of range when lineStart is 1 and columnStart is 1", () => {
				const ast = {};
				const text = "foo\nbar";
				const sourceCode = new TextSourceCodeBase({
					ast,
					text,
					lineStart: 1,
					columnStart: 1,
				});

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: 1, column: 0 });
					},
					RangeError,
					/Column number out of range/u,
				);

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: 1, column: 5 });
					},
					RangeError,
					/Column number out of range/u,
				);

				assert.throws(
					() => {
						sourceCode.getIndexFromLoc({ line: 2, column: 5 });
					},
					RangeError,
					/Column number out of range/u,
				);
			});
		});

		describe("getRange()", () => {
			it("should return a range object when a range property is present", () => {
				const ast = {
					range: [0, 3],
				};
				const text = "foo";
				const sourceCode = new TextSourceCodeBase({ ast, text });

				assert.deepStrictEqual(sourceCode.getRange(ast), ast.range);
			});

			it("should return a range object when a position property is present", () => {
				const ast = {
					position: {
						start: { offset: 0 },
						end: { offset: 3 },
					},
				};
				const text = "foo";
				const sourceCode = new TextSourceCodeBase({ ast, text });

				assert.deepStrictEqual(sourceCode.getRange(ast), [0, 3]);
			});

			it("should throw an error when neither range nor position property is present", () => {
				const ast = {};
				const text = "foo";
				const sourceCode = new TextSourceCodeBase({ ast, text });

				assert.throws(() => {
					sourceCode.getRange(ast);
				}, /Custom getRange\(\) method must be implemented in the subclass\./u);
			});
		});

		describe("getText()", () => {
			it("should return the text of the source code", () => {
				const ast = {};
				const text = "foo";
				const sourceCode = new TextSourceCodeBase({ ast, text });

				assert.strictEqual(sourceCode.getText(), "foo");
			});

			it("should return the text of the given node", () => {
				const ast = {
					range: [0, 3],
				};
				const text = "foo-bar";
				const sourceCode = new TextSourceCodeBase({ ast, text });

				assert.strictEqual(sourceCode.getText(ast), "foo");
			});

			it("should return the text of the given node plus one character before and after", () => {
				const ast = {
					range: [2, 5],
				};
				const text = "foo-bar";
				const sourceCode = new TextSourceCodeBase({ ast, text });

				assert.strictEqual(sourceCode.getText(ast, 1, 1), "oo-ba");
			});
		});

		describe("getAncestors()", () => {
			it("should return an array of ancestors", () => {
				const node3 = {};
				const node2 = { child: node3 };
				const node1 = { child: node2 };

				const parents = new Map([
					[node3, node2],
					[node2, node1],
					[node1, undefined],
				]);

				class TextSourceCode extends TextSourceCodeBase {
					// eslint-disable-next-line class-methods-use-this -- Testing purposes
					getParent(node) {
						return parents.get(node);
					}
				}

				const ast = node1;
				const text = "foo";
				const sourceCode = new TextSourceCode({ ast, text });

				assert.deepStrictEqual(sourceCode.getAncestors(node3), [
					node1,
					node2,
				]);
			});
		});
	});
});
