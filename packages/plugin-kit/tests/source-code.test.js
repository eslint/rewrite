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
