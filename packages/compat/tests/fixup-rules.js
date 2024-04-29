/**
 * @filedescription Fixup tests
 */
/* global it, describe */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import assert from "node:assert";
import {
	fixupRule,
	fixupPluginRules,
	fixupConfigRules,
} from "../src/fixup-rules.js";
import { Linter } from "eslint";

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const REPLACEMENT_METHODS = [
	"getScope",
	"getAncestors",
	"getDeclaredVariables",
];

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("@eslint/backcompat", () => {
	describe("fixupRule()", () => {
		it("should return a new rule object with the same own properties", () => {
			const rule = {
				create(context) {
					return {
						Identifier(node) {
							context.report(node, "Identifier");
						},
					};
				},
			};
			const fixedUpRule = fixupRule(rule);

			assert.notStrictEqual(rule, fixedUpRule);
			assert.deepStrictEqual(Object.keys(rule), Object.keys(fixedUpRule));
		});

		it("should return the same fixed up rule when applied to the same rule multiple times", () => {
			const rule = {
				create(context) {
					return {
						Identifier(node) {
							context.report(node, "Identifier");
						},
					};
				},
			};

			const fixedUpRule1 = fixupRule(rule);
			const fixedUpRule2 = fixupRule(rule);

			assert.strictEqual(fixedUpRule1, fixedUpRule2);
		});

		it("should return the same fixed up rule when a fixed up rule is passed to fixupRule", () => {
			const rule = {
				create(context) {
					return {
						Identifier(node) {
							context.report(node, "Identifier");
						},
					};
				},
			};

			const fixedUpRule = fixupRule(rule);
			const fixedUpRule2 = fixupRule(fixedUpRule);

			assert.strictEqual(fixedUpRule, fixedUpRule2);
		});

		REPLACEMENT_METHODS.forEach(method => {
			it(`should create a rule where context.${method}() returns the same value as sourceCode.${method}(node)`, () => {
				const rule = {
					create(context) {
						const { sourceCode } = context;

						return {
							Program(node) {
								const result = context[method]();
								const expected = sourceCode[method](node);
								assert.deepStrictEqual(result, expected);
								context.report(node, "Program");
							},

							FunctionDeclaration(node) {
								const result = context[method]();
								const expected = sourceCode[method](node);
								assert.deepStrictEqual(result, expected);
								context.report(node, "FunctionDeclaration");
							},

							ArrowFunctionExpression(node) {
								const result = context[method]();
								const expected = sourceCode[method](node);
								assert.deepStrictEqual(result, expected);
								context.report(node, "ArrowFunctionExpression");
							},

							Identifier(node) {
								const result = context[method]();
								const expected = sourceCode[method](node);
								assert.deepStrictEqual(result, expected);
								context.report(node, "Identifier");
							},
						};
					},
				};

				const config = {
					plugins: {
						test: {
							rules: {
								"test-rule": fixupRule(rule),
							},
						},
					},
					rules: {
						"test/test-rule": "error",
					},
				};

				const linter = new Linter();
				const code =
					"var foo = () => 123; function bar() { return 123; }";
				const messages = linter.verify(code, config, {
					filename: "test.js",
				});

				assert.deepStrictEqual(
					messages.map(message => message.message),
					[
						"Program",
						"Identifier",
						"ArrowFunctionExpression",
						"FunctionDeclaration",
						"Identifier",
					],
				);
			});
		});
	});

	describe("fixupPluginRules()", () => {
		it("should return a new plugin object with the same own properties", () => {
			const plugin = {
				configs: {
					recommended: {
						rules: {
							"test-rule": "error",
						},
					},
				},
				rules: {
					"test-rule": {
						create(context) {
							return {
								Identifier(node) {
									context.report(node, "Identifier");
								},
							};
						},
					},
				},
			};

			const fixedUpPlugin = fixupPluginRules(plugin);

			assert.notStrictEqual(plugin, fixedUpPlugin);
			assert.deepStrictEqual(
				Object.keys(plugin),
				Object.keys(fixedUpPlugin),
			);
			assert.strictEqual(
				plugin.configs.recommended,
				fixedUpPlugin.configs.recommended,
			);
		});

		it("should return the same fixed up plugin when applied to the same plugin multiple times", () => {
			const plugin = {
				configs: {
					recommended: {
						rules: {
							"test-rule": "error",
						},
					},
				},
				rules: {
					"test-rule": {
						create(context) {
							return {
								Identifier(node) {
									context.report(node, "Identifier");
								},
							};
						},
					},
				},
			};

			const fixedUpPlugin1 = fixupPluginRules(plugin);
			const fixedUpPlugin2 = fixupPluginRules(plugin);

			assert.strictEqual(fixedUpPlugin1, fixedUpPlugin2);
		});

		it("should return the same fixed up plugin when a fixed up plugin is passed to fixupPlugin", () => {
			const plugin = {
				configs: {
					recommended: {
						rules: {
							"test-rule": "error",
						},
					},
				},
				rules: {
					"test-rule": {
						create(context) {
							return {
								Identifier(node) {
									context.report(node, "Identifier");
								},
							};
						},
					},
				},
			};

			const fixedUpPlugin = fixupPluginRules(plugin);
			const fixedUpPlugin2 = fixupPluginRules(fixedUpPlugin);

			assert.strictEqual(fixedUpPlugin, fixedUpPlugin2);
		});

		it("should return the original plugin when it doesn't have rules", () => {
			const plugin = {
				configs: {
					recommended: {
						rules: {
							"test-rule": "error",
						},
					},
				},
			};

			const fixedUpPlugin = fixupPluginRules(plugin);

			assert.strictEqual(plugin, fixedUpPlugin);
		});

		REPLACEMENT_METHODS.forEach(method => {
			it(`should create a plugin where context.${method}() returns the same value as sourceCode.${method}(node)`, () => {
				const plugin = {
					configs: {
						recommended: {
							rules: {
								"test-rule": "error",
							},
						},
					},
					rules: {
						"test-rule": {
							create(context) {
								const { sourceCode } = context;

								return {
									Program(node) {
										const result = context[method]();
										const expected =
											sourceCode[method](node);
										assert.deepStrictEqual(
											result,
											expected,
										);
										context.report(node, "Program");
									},
									FunctionDeclaration(node) {
										const result = context[method]();
										const expected =
											sourceCode[method](node);
										assert.deepStrictEqual(
											result,
											expected,
										);
										context.report(
											node,
											"FunctionDeclaration",
										);
									},
									ArrowFunctionExpression(node) {
										const result = context[method]();
										const expected =
											sourceCode[method](node);
										assert.deepStrictEqual(
											result,
											expected,
										);
										context.report(
											node,
											"ArrowFunctionExpression",
										);
									},
									Identifier(node) {
										const result = context[method]();
										const expected =
											sourceCode[method](node);
										assert.deepStrictEqual(
											result,
											expected,
										);
										context.report(node, "Identifier");
									},
								};
							},
						},
					},
				};

				const linter = new Linter();
				const code =
					"var foo = () => 123; function bar() { return 123; }";
				const messages = linter.verify(
					code,
					{
						plugins: {
							test: fixupPluginRules(plugin),
						},
						rules: {
							"test/test-rule": "error",
						},
					},
					{
						filename: "test.js",
					},
				);

				assert.deepStrictEqual(
					messages.map(message => message.message),
					[
						"Program",
						"Identifier",
						"ArrowFunctionExpression",
						"FunctionDeclaration",
						"Identifier",
					],
				);
			});
		});
	});

	describe("fixupConfigRules()", () => {
		it("should return an array with the same number of items and objects with the same properties", () => {
			const config = [
				{
					rules: {
						"test-rule": "error",
					},
				},
				{
					plugins: {
						foo: {},
					},
					rules: {
						"foo/bar": "error",
					},
				},
			];

			const fixedUpConfig = fixupConfigRules(config);

			assert.notStrictEqual(config, fixedUpConfig);
			assert.deepStrictEqual(config, fixedUpConfig);
		});

		REPLACEMENT_METHODS.forEach(method => {
			it(`should create a configuration where context.${method}() returns the same value as sourceCode.${method}(node)`, () => {
				const config = [
					{
						plugins: {
							test: {
								rules: {
									"test-rule": fixupRule({
										create(context) {
											const { sourceCode } = context;

											return {
												Program(node) {
													const result =
														context[method]();
													const expected =
														sourceCode[method](
															node,
														);
													assert.deepStrictEqual(
														result,
														expected,
													);
													context.report(
														node,
														"Program",
													);
												},
												FunctionDeclaration(node) {
													const result =
														context[method]();
													const expected =
														sourceCode[method](
															node,
														);
													assert.deepStrictEqual(
														result,
														expected,
													);
													context.report(
														node,
														"FunctionDeclaration",
													);
												},
												ArrowFunctionExpression(node) {
													const result =
														context[method]();
													const expected =
														sourceCode[method](
															node,
														);
													assert.deepStrictEqual(
														result,
														expected,
													);
													context.report(
														node,
														"ArrowFunctionExpression",
													);
												},
												Identifier(node) {
													const result =
														context[method]();
													const expected =
														sourceCode[method](
															node,
														);
													assert.deepStrictEqual(
														result,
														expected,
													);
													context.report(
														node,
														"Identifier",
													);
												},
											};
										},
									}),
								},
							},
						},
						rules: {
							"test/test-rule": "error",
						},
					},
				];

				const linter = new Linter();
				const code =
					"var foo = () => 123; function bar() { return 123; }";
				const messages = linter.verify(code, fixupConfigRules(config), {
					filename: "test.js",
				});

				assert.deepStrictEqual(
					messages.map(message => message.message),
					[
						"Program",
						"Identifier",
						"ArrowFunctionExpression",
						"FunctionDeclaration",
						"Identifier",
					],
				);
			});
		});
	});
});
