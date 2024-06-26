/**
 * @fileoverview Tests for consistent-this rule.
 * @author Raphael Pigulla
 */

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import rule from "../fixtures/rules/consistent-this.js";
import { RuleTester } from "eslint";
import { fixupRule } from "../../src/fixup-rules.js";

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * A destructuring Test
 * @param {string} code source code
 * @returns {Object} Suitable object
 * @private
 */
function destructuringTest(code) {
	return {
		code,
		options: ["self"],
		languageOptions: { ecmaVersion: 6 },
	};
}

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({
	languageOptions: {
		ecmaVersion: 5,
		sourceType: "script",
	},
});

const fixedUpRule = fixupRule(rule);

ruleTester.run("consistent-this", fixedUpRule, {
	valid: [
		"var foo = 42, that = this",
		{ code: "var foo = 42, self = this", options: ["self"] },
		{ code: "var self = 42", options: ["that"] },
		{ code: "var self", options: ["that"] },
		{ code: "var self; self = this", options: ["self"] },
		{ code: "var foo, self; self = this", options: ["self"] },
		{ code: "var foo, self; foo = 42; self = this", options: ["self"] },
		{ code: "self = 42", options: ["that"] },
		{ code: "var foo = {}; foo.bar = this", options: ["self"] },
		{ code: "var self = this; var vm = this;", options: ["self", "vm"] },
		destructuringTest("var {foo, bar} = this"),
		destructuringTest("({foo, bar} = this)"),
		destructuringTest("var [foo, bar] = this"),
		destructuringTest("[foo, bar] = this"),
	],
	invalid: [
		{
			code: "var context = this",
			errors: [
				{
					messageId: "unexpectedAlias",
					data: { name: "context" },
					type: "VariableDeclarator",
				},
			],
		},
		{
			code: "var that = this",
			options: ["self"],
			errors: [
				{
					messageId: "unexpectedAlias",
					data: { name: "that" },
					type: "VariableDeclarator",
				},
			],
		},
		{
			code: "var foo = 42, self = this",
			options: ["that"],
			errors: [
				{
					messageId: "unexpectedAlias",
					data: { name: "self" },
					type: "VariableDeclarator",
				},
			],
		},
		{
			code: "var self = 42",
			options: ["self"],
			errors: [
				{
					messageId: "aliasNotAssignedToThis",
					data: { name: "self" },
					type: "VariableDeclarator",
				},
			],
		},
		{
			code: "var self",
			options: ["self"],
			errors: [
				{
					messageId: "aliasNotAssignedToThis",
					data: { name: "self" },
					type: "VariableDeclarator",
				},
			],
		},
		{
			code: "var self; self = 42",
			options: ["self"],
			errors: [
				{
					messageId: "aliasNotAssignedToThis",
					data: { name: "self" },
					type: "VariableDeclarator",
				},
				{
					messageId: "aliasNotAssignedToThis",
					data: { name: "self" },
					type: "AssignmentExpression",
				},
			],
		},
		{
			code: "context = this",
			options: ["that"],
			errors: [
				{
					messageId: "unexpectedAlias",
					data: { name: "context" },
					type: "AssignmentExpression",
				},
			],
		},
		{
			code: "that = this",
			options: ["self"],
			errors: [
				{
					messageId: "unexpectedAlias",
					data: { name: "that" },
					type: "AssignmentExpression",
				},
			],
		},
		{
			code: "self = this",
			options: ["that"],
			errors: [
				{
					messageId: "unexpectedAlias",
					data: { name: "self" },
					type: "AssignmentExpression",
				},
			],
		},
		{
			code: "self += this",
			options: ["self"],
			errors: [
				{
					messageId: "aliasNotAssignedToThis",
					data: { name: "self" },
					type: "AssignmentExpression",
				},
			],
		},
		{
			code: "var self; (function() { self = this; }())",
			options: ["self"],
			errors: [
				{
					messageId: "aliasNotAssignedToThis",
					data: { name: "self" },
					type: "VariableDeclarator",
				},
			],
		},
	],
});
