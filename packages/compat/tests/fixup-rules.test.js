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
