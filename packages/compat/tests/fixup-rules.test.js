/**
 * @fileoverview Fixup tests
 */

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

const REPLACEMENT_METHODS = ["getScope", "getAncestors"];

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("@eslint/compat", () => {
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

		it("should return a new rule object with `meta.schema` when a rule with top-level `schema` and without `meta` is passed to fixupRule", () => {
			const schema = [{ type: "string" }];
			const rule = {
				schema,
				create(context) {
					return {
						Identifier(node) {
							context.report(node, context.options[0]);
						},
					};
				},
			};
			const fixedUpRule = fixupRule(rule);

			assert.notStrictEqual(rule, fixedUpRule);
			assert.deepStrictEqual(Object.keys(fixedUpRule), [
				...Object.keys(rule),
				"meta",
			]);
			assert.strictEqual(typeof fixedUpRule.meta, "object");
			assert.deepStrictEqual(fixedUpRule.meta.schema, schema);

			const config = {
				plugins: {
					test: {
						rules: {
							"test-rule": fixedUpRule,
						},
					},
				},
				rules: {
					"test/test-rule": ["error", "my-option"],
				},
			};

			const linter = new Linter();
			const code = "var foo;";
			const messages = linter.verify(code, config, {
				filename: "test.js",
			});

			assert.strictEqual(messages.length, 1);
			assert.strictEqual(messages[0].message, "my-option");
		});

		it("should return a new rule object with `meta.schema` when a rule with top-level `schema` and with `meta` is passed to fixupRule", () => {
			const schema = [{ type: "string" }];
			const rule = {
				schema,
				meta: {
					docs: {},
				},
				create(context) {
					return {
						Identifier(node) {
							context.report(node, context.options[0]);
						},
					};
				},
			};
			const fixedUpRule = fixupRule(rule);

			assert.notStrictEqual(rule, fixedUpRule);
			assert.deepStrictEqual(Object.keys(rule), Object.keys(fixedUpRule));
			assert.deepStrictEqual(Object.keys(fixedUpRule.meta), [
				...Object.keys(rule.meta),
				"schema",
			]);
			assert.deepStrictEqual(fixedUpRule.meta.schema, schema);

			const config = {
				plugins: {
					test: {
						rules: {
							"test-rule": fixedUpRule,
						},
					},
				},
				rules: {
					"test/test-rule": ["error", "my-option"],
				},
			};

			const linter = new Linter();
			const code = "var foo;";
			const messages = linter.verify(code, config, {
				filename: "test.js",
			});

			assert.strictEqual(messages.length, 1);
			assert.strictEqual(messages[0].message, "my-option");
		});

		it("should return a rule object when a function-style rule is passed to fixupRule", () => {
			function rule(context) {
				return {
					Identifier(node) {
						context.report(node, "My message.");
					},
				};
			}
			const fixedUpRule = fixupRule(rule);

			assert.strictEqual(typeof fixedUpRule, "object");
			assert.deepStrictEqual(Object.keys(fixedUpRule), ["create"]);
			assert.strictEqual(typeof fixedUpRule.create, "function");
			assert.notStrictEqual(rule, fixedUpRule.create); // the original rule should be wrapped in `create`

			const config = {
				plugins: {
					test: {
						rules: {
							"test-rule": fixedUpRule,
						},
					},
				},
				rules: {
					"test/test-rule": "error",
				},
			};

			const linter = new Linter();
			const code = "var foo;";
			const messages = linter.verify(code, config, {
				filename: "test.js",
			});

			assert.strictEqual(messages.length, 1);
			assert.strictEqual(messages[0].message, "My message.");
		});

		it("should return a rule object with `meta.schema` when a function-style rule with schema is passed to fixupRule", () => {
			function rule(context) {
				return {
					Identifier(node) {
						context.report(node, context.options[0]);
					},
				};
			}

			const schema = [{ type: "string" }];
			rule.schema = schema;

			const fixedUpRule = fixupRule(rule);

			assert.strictEqual(typeof fixedUpRule, "object");
			assert.deepStrictEqual(Object.keys(fixedUpRule), [
				"create",
				"meta",
			]);
			assert.strictEqual(typeof fixedUpRule.create, "function");
			assert.notStrictEqual(rule, fixedUpRule.create); // the original rule should be wrapped in `create`
			assert.strictEqual(typeof fixedUpRule.meta, "object");
			assert.deepStrictEqual(fixedUpRule.meta.schema, schema);

			const config = {
				plugins: {
					test: {
						rules: {
							"test-rule": fixedUpRule,
						},
					},
				},
				rules: {
					"test/test-rule": ["error", "my-option"],
				},
			};

			const linter = new Linter();
			const code = "var foo;";
			const messages = linter.verify(code, config, {
				filename: "test.js",
			});

			assert.strictEqual(messages.length, 1);
			assert.strictEqual(messages[0].message, "my-option");
		});

		it("should create a rule where getDeclaredVariables() returns the same value as sourceCode.getDeclaredVariables(node)", () => {
			const rule = {
				create(context) {
					const { sourceCode } = context;

					return {
						Program(node) {
							const result = context.getDeclaredVariables(node);
							const expected =
								sourceCode.getDeclaredVariables(node);
							assert.deepStrictEqual(result, expected);
							context.report(node, "Program");
						},

						FunctionDeclaration(node) {
							const result = context.getDeclaredVariables(node);
							const expected =
								sourceCode.getDeclaredVariables(node);
							assert.deepStrictEqual(result, expected);
							context.report(node, "FunctionDeclaration");
						},

						ArrowFunctionExpression(node) {
							const result = context.getDeclaredVariables(node);
							const expected =
								sourceCode.getDeclaredVariables(node);
							assert.deepStrictEqual(result, expected);
							context.report(node, "ArrowFunctionExpression");
						},

						Identifier(node) {
							const result = context.getDeclaredVariables(node);
							const expected =
								sourceCode.getDeclaredVariables(node);
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
			const code = "var foo = () => 123; function bar() { return 123; }";
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

		REPLACEMENT_METHODS.forEach(method => {
			it(`should create a rule where context.${method}() returns the same value as sourceCode.${method}(node) in visitor methods`, () => {
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

			it(`should create a rule where context.${method}() returns the same value as sourceCode.${method}(node) in code path methods`, () => {
				const rule = {
					create(context) {
						const sourceCode = context.sourceCode;

						return {
							onCodePathSegmentLoop(
								fromSegment,
								toSegment,
								node,
							) {
								const result = context[method]();
								const expected = sourceCode[method](node);
								assert.deepStrictEqual(result, expected);
								context.report(node, "onCodePathSegmentLoop");
							},

							onCodePathStart(codePath, node) {
								const result = context[method]();
								const expected = sourceCode[method](node);
								assert.deepStrictEqual(result, expected);
								context.report(node, "onCodePathStart");
							},

							onCodePathEnd(codePath, node) {
								const result = context[method]();
								const expected = sourceCode[method](node);
								assert.deepStrictEqual(result, expected);
								context.report(node, "onCodePathEnd");
							},

							onCodePathSegmentStart(segment, node) {
								const result = context[method]();
								const expected = sourceCode[method](node);
								assert.deepStrictEqual(result, expected);
								context.report(node, "onCodePathSegmentStart");
							},

							onCodePathSegmentEnd(segment, node) {
								const result = context[method]();
								const expected = sourceCode[method](node);
								assert.deepStrictEqual(result, expected);
								context.report(node, "onCodePathSegmentEnd");
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
					"var foo = () => 123; function bar() { for (const x of y) { foo(); } }";
				const messages = linter.verify(code, config, {
					filename: "test.js",
				});

				assert.deepStrictEqual(
					messages.map(message => message.message),
					[
						"onCodePathStart",
						"onCodePathSegmentStart",
						"onCodePathSegmentEnd",
						"onCodePathEnd",
						"onCodePathStart",
						"onCodePathSegmentStart",
						"onCodePathSegmentEnd",
						"onCodePathEnd",
						"onCodePathStart",
						"onCodePathSegmentStart",
						"onCodePathSegmentEnd",
						"onCodePathEnd",
						"onCodePathSegmentLoop",
						"onCodePathSegmentEnd",
						"onCodePathSegmentStart",
						"onCodePathSegmentEnd",
						"onCodePathSegmentStart",
						"onCodePathSegmentEnd",
						"onCodePathSegmentStart",
						"onCodePathSegmentLoop",
						"onCodePathSegmentEnd",
						"onCodePathSegmentStart",
					],
				);
			});
		});

		it("should restore context.parserOptions", () => {
			const rule = {
				create(context) {
					assert.strictEqual(
						context.parserOptions,
						context.languageOptions.parserOptions,
					);

					return {
						Identifier(node) {
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
			const code = "let foo;";
			const messages = linter.verify(code, config);

			assert.strictEqual(messages.length, 1);
			assert.strictEqual(messages[0].message, "Identifier");
		});

		it("should restore context.getCwd()", () => {
			const rule = {
				create(context) {
					assert.strictEqual(context.getCwd(), context.cwd);

					return {
						Identifier(node) {
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
			const code = "let foo;";
			const messages = linter.verify(code, config);

			assert.strictEqual(messages.length, 1);
			assert.strictEqual(messages[0].message, "Identifier");
		});

		it("should restore context.getFilename()", () => {
			const rule = {
				create(context) {
					assert.strictEqual(context.getFilename(), context.filename);

					return {
						Identifier(node) {
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
			const code = "let foo;";
			const messages = linter.verify(code, config);

			assert.strictEqual(messages.length, 1);
			assert.strictEqual(messages[0].message, "Identifier");
		});

		it("should restore context.getPhysicalFilename()", () => {
			const rule = {
				create(context) {
					assert.strictEqual(
						context.getPhysicalFilename(),
						context.physicalFilename,
					);

					return {
						Identifier(node) {
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
			const code = "let foo;";
			const messages = linter.verify(code, config);

			assert.strictEqual(messages.length, 1);
			assert.strictEqual(messages[0].message, "Identifier");
		});

		it("should restore context.getSourceCode()", () => {
			const rule = {
				create(context) {
					assert.strictEqual(
						context.getSourceCode(),
						context.sourceCode,
					);

					return {
						Identifier(node) {
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
			const code = "let foo;";
			const messages = linter.verify(code, config);

			assert.strictEqual(messages.length, 1);
			assert.strictEqual(messages[0].message, "Identifier");
		});

		it("should restore sourceCode.getTokenOrCommentBefore()", () => {
			const rule = {
				create(context) {
					return {
						Identifier(node) {
							assert.strictEqual(
								context.sourceCode.getTokenOrCommentBefore(node)
									.value,
								"let",
							);
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
			const code = "let foo;";
			linter.verify(code, config);
		});

		it("should restore sourceCode.getTokenOrCommentAfter()", () => {
			const rule = {
				create(context) {
					return {
						Identifier(node) {
							assert.strictEqual(
								context.sourceCode.getTokenOrCommentAfter(node)
									.value,
								"=",
							);
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
			const code = "let foo = 0;";
			linter.verify(code, config);
		});

		it("should restore sourceCode.isSpaceBetweenTokens()", () => {
			const rule = {
				create(context) {
					return {
						Identifier(node) {
							assert.strictEqual(
								context.sourceCode.isSpaceBetweenTokens(
									node,
									context.sourceCode.getTokenBefore(node),
								),
								true,
							);
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
			const code = "let foo";
			linter.verify(code, config);
		});

		it("should restore sourceCode.getJSDocComment()", () => {
			const rule = {
				create(context) {
					return {
						FunctionDeclaration(node) {
							const jsdoc =
								context.sourceCode.getJSDocComment(node);

							assert.strictEqual(jsdoc.type, "Block");
							assert.strictEqual(jsdoc.value, "* Desc");
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
			const code = ["/** Desc*/", "function foo(){}"].join("\n");
			linter.verify(code, config);
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

		it("should restore context.getFilename()", () => {
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
							assert.strictEqual(
								context.getFilename(),
								context.filename,
							);
							return {
								Identifier(node) {
									context.report(node, "Identifier");
								},
							};
						},
					},
				},
			};

			const linter = new Linter();
			const code = "let foo;";
			const config = {
				plugins: { test: fixupPluginRules(plugin) },
				rules: { "test/test-rule": "error" },
			};
			const messages = linter.verify(code, config);

			assert.strictEqual(messages.length, 1);
			assert.strictEqual(messages[0].message, "Identifier");
		});

		it("should restore sourceCode.getTokenOrCommentBefore()", () => {
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
									assert.strictEqual(
										context.sourceCode.getTokenOrCommentBefore(
											node,
										).value,
										"let",
									);
								},
							};
						},
					},
				},
			};

			const linter = new Linter();
			const code = "let foo;";
			const config = {
				plugins: { test: fixupPluginRules(plugin) },
				rules: { "test/test-rule": "error" },
			};
			linter.verify(code, config);
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

		it("should restore context.getFilename()", () => {
			const config = [
				{
					plugins: {
						test: {
							rules: {
								"test-rule": {
									create(context) {
										assert.strictEqual(
											context.getFilename(),
											context.filename,
										);
										return {
											Identifier(node) {
												context.report(
													node,
													"Identifier",
												);
											},
										};
									},
								},
							},
						},
					},
					rules: {
						"test/test-rule": "error",
					},
				},
			];

			const linter = new Linter();
			const code = "let foo;";
			const messages = linter.verify(code, fixupConfigRules(config));

			assert.strictEqual(messages.length, 1);
			assert.strictEqual(messages[0].message, "Identifier");
		});

		it("should restore sourceCode.getTokenOrCommentBefore()", () => {
			const config = [
				{
					plugins: {
						test: {
							rules: {
								"test-rule": {
									create(context) {
										return {
											Identifier(node) {
												assert.strictEqual(
													context.sourceCode.getTokenOrCommentBefore(
														node,
													).value,
													"let",
												);
											},
										};
									},
								},
							},
						},
					},
					rules: {
						"test/test-rule": "error",
					},
				},
			];

			const linter = new Linter();
			const code = "let foo;";
			linter.verify(code, fixupConfigRules(config));
		});
	});
});
