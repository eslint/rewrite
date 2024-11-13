/**
 * @fileoverview Tests for ConfigCommentParser object.
 * @author Nicholas C. Zakas
 */

//------------------------------------------------------------------------------
// Imports
//------------------------------------------------------------------------------

import assert from "node:assert";
import {
	ConfigCommentParser,
	DirectiveComment,
} from "../src/config-comment-parser.js";

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("ConfigCommentParser", () => {
	let commentParser;

	beforeEach(() => {
		commentParser = new ConfigCommentParser();
	});

	describe("parseStringConfig", () => {
		const comment = {};

		it("should parse String config with one item", () => {
			const code = "a: true";
			const result = commentParser.parseStringConfig(code, comment);

			assert.deepStrictEqual(result, {
				a: "true",
			});
		});

		it("should parse String config with one item and no value", () => {
			const code = "a";
			const result = commentParser.parseStringConfig(code, comment);

			assert.deepStrictEqual(result, {
				a: null,
			});
		});

		it("should parse String config with two items", () => {
			const code = "a: five b:three";
			const result = commentParser.parseStringConfig(code, comment);

			assert.deepStrictEqual(result, {
				a: "five",
				b: "three",
			});
		});

		it("should parse String config with two comma-separated items", () => {
			const code = "a: seventy, b:ELEVENTEEN";
			const result = commentParser.parseStringConfig(code, comment);

			assert.deepStrictEqual(result, {
				a: "seventy",
				b: "ELEVENTEEN",
			});
		});

		it("should parse String config with two comma-separated items and no values", () => {
			const code = "a , b";
			const result = commentParser.parseStringConfig(code, comment);

			assert.deepStrictEqual(result, {
				a: null,
				b: null,
			});
		});

		it("should return an empty object for an empty string", () => {
			const code = "";
			const result = commentParser.parseStringConfig(code, comment);

			assert.deepStrictEqual(result, {});
		});

		it("should parse string config with one item, no value, and leading whitespace", () => {
			const code = `${" ".repeat(100000)}a`;
			const result = commentParser.parseStringConfig(code, comment);

			assert.deepStrictEqual(result, {
				a: null,
			});
		});

		it("should parse string config with one item, no value, and trailing whitespace", () => {
			const code = `a${" ".repeat(100000)}`;
			const result = commentParser.parseStringConfig(code, comment);

			assert.deepStrictEqual(result, {
				a: null,
			});
		});

		it("should parse string config with two items, no values, and whitespace in the middle", () => {
			const code = `a${" ".repeat(100000)}b`;
			const result = commentParser.parseStringConfig(code, comment);

			assert.deepStrictEqual(result, {
				a: null,
				b: null,
			});
		});

		it("should parse string config with multiple items with values separated by commas and lots of whitespace", () => {
			const whitespace = " ".repeat(100000);
			const code = `a: 1${whitespace},${whitespace}b: 2${whitespace},${whitespace}c: 3${whitespace},${whitespace}d: 4`;
			const result = commentParser.parseStringConfig(code, comment);

			assert.deepStrictEqual(result, {
				a: "1",
				b: "2",
				c: "3",
				d: "4",
			});
		});

	});

	describe("parseListConfig", () => {
		it("should parse list config with one item", () => {
			const code = "a";
			const result = commentParser.parseListConfig(code);

			assert.deepStrictEqual(result, {
				a: true,
			});
		});

		it("should parse list config with two items", () => {
			const code = "a, b";
			const result = commentParser.parseListConfig(code);

			assert.deepStrictEqual(result, {
				a: true,
				b: true,
			});
		});

		it("should parse list config with two items and extra whitespace", () => {
			const code = "  a , b  ";
			const result = commentParser.parseListConfig(code);

			assert.deepStrictEqual(result, {
				a: true,
				b: true,
			});
		});

		it("should parse list config with quoted items", () => {
			const code = "'a', \"b\", 'c\", \"d'";
			const result = commentParser.parseListConfig(code);

			assert.deepStrictEqual(result, {
				a: true,
				b: true,
				"\"d'": true, // This result is correct because used mismatched quotes.
				"'c\"": true, // This result is correct because used mismatched quotes.
			});
		});
		it("should parse list config with spaced items", () => {
			const code = " a b , 'c d' , \"e f\" ";
			const result = commentParser.parseListConfig(code);

			assert.deepStrictEqual(result, {
				"a b": true,
				"c d": true,
				"e f": true,
			});
		});
	});

	describe("parseJSONLikeConfig()", () => {
		it("should parse JSON config with one item", () => {
			const code = "no-alert:0";
			const result = commentParser.parseJSONLikeConfig(code);

			assert.deepStrictEqual(result, {
				ok: true,
				config: {
					"no-alert": 0,
				},
			});
		});

		it("should parse JSON config with two items", () => {
			const code = "no-alert:0 semi: 2";
			const result = commentParser.parseJSONLikeConfig(code);

			assert.deepStrictEqual(result, {
				ok: true,
				config: {
					"no-alert": 0,
					semi: 2,
				},
			});
		});

		it("should parse JSON config with two comma-separated items", () => {
			const code = "no-alert:0,semi: 2";
			const result = commentParser.parseJSONLikeConfig(code);

			assert.deepStrictEqual(result, {
				ok: true,
				config: {
					"no-alert": 0,
					semi: 2,
				},
			});
		});

		it("should parse JSON config with two items and a string severity", () => {
			const code = "no-alert:off,semi: 2";
			const result = commentParser.parseJSONLikeConfig(code);

			assert.deepStrictEqual(result, {
				ok: true,
				config: {
					"no-alert": "off",
					semi: 2,
				},
			});
		});

		it("should parse JSON config with two items and options", () => {
			const code = "no-alert:off, semi: [2, always]";
			const result = commentParser.parseJSONLikeConfig(code);

			assert.deepStrictEqual(result, {
				ok: true,
				config: {
					"no-alert": "off",
					semi: [2, "always"],
				},
			});
		});

		it("should parse JSON config with two items and options from plugins", () => {
			const code = "plugin/no-alert:off, plugin/semi: [2, always]";
			const result = commentParser.parseJSONLikeConfig(code);

			assert.deepStrictEqual(result, {
				ok: true,
				config: {
					"plugin/no-alert": "off",
					"plugin/semi": [2, "always"],
				},
			});
		});
	});

	describe("parseDirective", () => {
		it("should parse a directive comment with a justification", () => {
			const comment = "eslint no-unused-vars: error -- test ";
			const result = commentParser.parseDirective(comment);

			assert.deepStrictEqual(
				result,
				new DirectiveComment("eslint", "no-unused-vars: error", "test"),
			);
		});

		it("should parse a directive comment without a justification", () => {
			const comment = "global foo";
			const result = commentParser.parseDirective(comment);

			assert.deepStrictEqual(
				result,
				new DirectiveComment("global", "foo", ""),
			);
		});

		it("should parse a directive comment with one dash and a justification", () => {
			const comment = "eslint-disable foo -- not needed";
			const result = commentParser.parseDirective(comment);

			assert.deepStrictEqual(
				result,
				new DirectiveComment("eslint-disable", "foo", "not needed"),
			);
		});

		it("should parse a directive comment with dashes and a justification", () => {
			const comment = "eslint-disable-next-line foo -- not needed";
			const result = commentParser.parseDirective(comment);

			assert.deepStrictEqual(
				result,
				new DirectiveComment(
					"eslint-disable-next-line",
					"foo",
					"not needed",
				),
			);
		});

		it("should parse a directive comment with dashes and commas and a justification with leading space", () => {
			const comment = " eslint-disable no-alert, no-console -- j1";
			const result = commentParser.parseDirective(comment);

			assert.deepStrictEqual(
				result,
				new DirectiveComment(
					"eslint-disable",
					"no-alert, no-console",
					"j1",
				),
			);
		});

		it("should return undefined for an empty string", () => {
			const comment = "";
			const result = commentParser.parseDirective(comment);

			assert.deepStrictEqual(result, undefined);
		});

		it("should return undefined for a string with only whitespace", () => {
			const comment = " ";
			const result = commentParser.parseDirective(comment);

			assert.deepStrictEqual(result, undefined);
		});
	});
});
