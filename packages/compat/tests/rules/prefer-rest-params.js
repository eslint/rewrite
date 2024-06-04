/**
 * @fileoverview Tests for prefer-rest-params rule.
 * @author Toru Nagashima
 */

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import rule from "../fixtures/rules/prefer-rest-params.js";
import { RuleTester } from "eslint";
import { fixupRule } from "../../src/fixup-rules.js";

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({
	languageOptions: { ecmaVersion: 6, sourceType: "script" },
});
const fixedUpRule = fixupRule(rule);

ruleTester.run("prefer-rest-params", fixedUpRule, {
	valid: [
		"arguments;",
		"function foo(arguments) { arguments; }",
		"function foo() { var arguments; arguments; }",
		"var foo = () => arguments;", // Arrows don't have "arguments".,
		"function foo(...args) { args; }",
		"function foo() { arguments.length; }",
		"function foo() { arguments.callee; }",
	],
	invalid: [
		{
			code: "function foo() { arguments; }",
			errors: [{ type: "Identifier", messageId: "preferRestParams" }],
		},
		{
			code: "function foo() { arguments[0]; }",
			errors: [{ type: "Identifier", messageId: "preferRestParams" }],
		},
		{
			code: "function foo() { arguments[1]; }",
			errors: [{ type: "Identifier", messageId: "preferRestParams" }],
		},
		{
			code: "function foo() { arguments[Symbol.iterator]; }",
			errors: [{ type: "Identifier", messageId: "preferRestParams" }],
		},
	],
});
