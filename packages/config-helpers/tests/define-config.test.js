/**
 * @fileoverview Tests for defineConfig helper
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { defineConfig } from "../src/define-config.js";
import assert from "node:assert";

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("defineConfig()", () => {
	describe("extends", () => {
		describe("extending objects", () => {
			it("should extend two config objects without files", () => {
				const config = defineConfig({
					extends: [
						{ rules: { "no-console": "error" } },
						{ rules: { "no-alert": "error" } },
					],
					rules: {
						"no-debugger": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > ExtendedConfig[0]",
						rules: { "no-console": "error" },
					},
					{
						name: "UserConfig[0] > ExtendedConfig[1]",
						rules: { "no-alert": "error" },
					},
					{ rules: { "no-debugger": "error" } },
				]);
			});

			it("should extend two config objects with names", () => {
				const config = defineConfig({
					name: "Base Config",
					extends: [
						{ name: "Console", rules: { "no-console": "error" } },
						{ name: "Alert", rules: { "no-alert": "error" } },
					],
					rules: {
						"no-debugger": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "Base Config > Console",
						rules: { "no-console": "error" },
					},
					{
						name: "Base Config > Alert",
						rules: { "no-alert": "error" },
					},
					{ name: "Base Config", rules: { "no-debugger": "error" } },
				]);
			});

			it("should extend two config objects with files", () => {
				const config = defineConfig({
					files: ["*.js"],
					extends: [
						{ rules: { "no-console": "error" } },
						{ rules: { "no-alert": "error" } },
					],
					rules: {
						"no-debugger": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > ExtendedConfig[0]",
						files: ["*.js"],
						rules: { "no-console": "error" },
					},
					{
						name: "UserConfig[0] > ExtendedConfig[1]",
						files: ["*.js"],
						rules: { "no-alert": "error" },
					},
					{ files: ["*.js"], rules: { "no-debugger": "error" } },
				]);
			});

			it("should extend two config objects with files and ignores", () => {
				const config = defineConfig({
					name: "Base",
					files: ["*.js"],
					ignores: ["foo.js"],
					extends: [
						{ name: "Ext1", rules: { "no-console": "error" } },
						{ name: "Ext2", rules: { "no-alert": "error" } },
					],
					rules: {
						"no-debugger": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "Base > Ext1",
						files: ["*.js"],
						ignores: ["foo.js"],
						rules: { "no-console": "error" },
					},
					{
						name: "Base > Ext2",
						files: ["*.js"],
						ignores: ["foo.js"],
						rules: { "no-alert": "error" },
					},
					{
						name: "Base",
						files: ["*.js"],
						ignores: ["foo.js"],
						rules: { "no-debugger": "error" },
					},
				]);
			});

			it("should extend two config objects with files and ignores in all configs", () => {
				const config = defineConfig({
					name: "Base",
					files: ["*.js"],
					ignores: ["foo.js"],
					extends: [
						{
							name: "Ext1",
							files: ["*.jsx"],
							ignores: ["bar.js"],
							rules: { "no-console": "error" },
						},
						{
							name: "Ext2",
							files: ["foo*.js"],
							ignores: ["baz.js"],
							rules: { "no-alert": "error" },
						},
					],
					rules: {
						"no-debugger": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "Base > Ext1",
						files: [["*.js", "*.jsx"]],
						ignores: ["foo.js", "bar.js"],
						rules: { "no-console": "error" },
					},
					{
						name: "Base > Ext2",
						files: [["*.js", "foo*.js"]],
						ignores: ["foo.js", "baz.js"],
						rules: { "no-alert": "error" },
					},
					{
						name: "Base",
						files: ["*.js"],
						ignores: ["foo.js"],
						rules: { "no-debugger": "error" },
					},
				]);
			});

			it("should extend two config objects with files and ignores and multiple configs passed in as an array", () => {
				const config = defineConfig([
					{
						name: "Base",
						files: ["*.js"],
						ignores: ["foo.js"],
						extends: [
							{ name: "Ext1", rules: { "no-console": "error" } },
							{ name: "Ext2", rules: { "no-alert": "error" } },
						],
						rules: {
							"no-debugger": "error",
						},
					},
					{
						name: "Base 2",
						files: ["*.ts"],
						ignores: ["bar.js"],
						extends: [
							{ name: "Ext3", rules: { "no-console": "error" } },
							{ name: "Ext4", rules: { "no-alert": "error" } },
						],
						rules: {
							"no-debugger": "error",
						},
					},
				]);

				assert.deepStrictEqual(config, [
					{
						name: "Base > Ext1",
						files: ["*.js"],
						ignores: ["foo.js"],
						rules: { "no-console": "error" },
					},
					{
						name: "Base > Ext2",
						files: ["*.js"],
						ignores: ["foo.js"],
						rules: { "no-alert": "error" },
					},
					{
						name: "Base",
						files: ["*.js"],
						ignores: ["foo.js"],
						rules: { "no-debugger": "error" },
					},
					{
						name: "Base 2 > Ext3",
						files: ["*.ts"],
						ignores: ["bar.js"],
						rules: { "no-console": "error" },
					},
					{
						name: "Base 2 > Ext4",
						files: ["*.ts"],
						ignores: ["bar.js"],
						rules: { "no-alert": "error" },
					},
					{
						name: "Base 2",
						files: ["*.ts"],
						ignores: ["bar.js"],
						rules: { "no-debugger": "error" },
					},
				]);
			});

			it("should extend two config objects with files and ignores and multiple configs passed in as arguments", () => {
				const config = defineConfig(
					{
						name: "Base",
						files: ["*.js"],
						ignores: ["foo.js"],
						extends: [
							{ name: "Ext1", rules: { "no-console": "error" } },
							{ name: "Ext2", rules: { "no-alert": "error" } },
						],
						rules: {
							"no-debugger": "error",
						},
					},
					{
						name: "Base 2",
						files: ["*.ts"],
						ignores: ["bar.js"],
						extends: [
							{ name: "Ext3", rules: { "no-console": "error" } },
							{ name: "Ext4", rules: { "no-alert": "error" } },
						],
						rules: {
							"no-debugger": "error",
						},
					},
				);

				assert.deepStrictEqual(config, [
					{
						name: "Base > Ext1",
						files: ["*.js"],
						ignores: ["foo.js"],
						rules: { "no-console": "error" },
					},
					{
						name: "Base > Ext2",
						files: ["*.js"],
						ignores: ["foo.js"],
						rules: { "no-alert": "error" },
					},
					{
						name: "Base",
						files: ["*.js"],
						ignores: ["foo.js"],
						rules: { "no-debugger": "error" },
					},
					{
						name: "Base 2 > Ext3",
						files: ["*.ts"],
						ignores: ["bar.js"],
						rules: { "no-console": "error" },
					},
					{
						name: "Base 2 > Ext4",
						files: ["*.ts"],
						ignores: ["bar.js"],
						rules: { "no-alert": "error" },
					},
					{
						name: "Base 2",
						files: ["*.ts"],
						ignores: ["bar.js"],
						rules: { "no-debugger": "error" },
					},
				]);
			});

			it("should extend two config objects that are global ignores", () => {
				const config = defineConfig({
					files: ["*.js"],
					extends: [{ ignores: ["foo.js"] }, { ignores: ["bar.js"] }],
					rules: {
						"no-debugger": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > ExtendedConfig[0]",
						ignores: ["foo.js"],
					},
					{
						name: "UserConfig[0] > ExtendedConfig[1]",
						ignores: ["bar.js"],
					},
					{
						files: ["*.js"],
						rules: { "no-debugger": "error" },
					},
				]);
			});

			it("should not create a global ignores when an extended config doesn't have `ignores`", () => {
				const config = defineConfig({
					name: "Base",
					ignores: ["foo.js"],
					extends: [
						{ name: "Ext1", rules: { "no-console": "error" } },
						{},
					],
				});

				assert.deepStrictEqual(config, [
					{
						name: "Base > Ext1",
						ignores: ["foo.js"],
						rules: { "no-console": "error" },
					},
					// should not create a global ignores
					{
						name: "Base > ExtendedConfig[1]",
					},
				]);
			});

			it("should omit base config when it only has ignores", () => {
				const config = defineConfig({
					ignores: ["test/*.js"],
					extends: [{ rules: { "no-console": "error" } }],
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > ExtendedConfig[0]",
						ignores: ["test/*.js"],
						rules: { "no-console": "error" },
					},
				]);
			});

			it("should extend a three-dimensional array of configs", () => {
				const config = defineConfig({
					extends: [
						[[{ rules: { "no-console": "error" } }]],
						[[{ rules: { "no-alert": "error" } }]],
					],
					rules: {
						"no-debugger": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > ExtendedConfig[0][0][0]",
						rules: { "no-console": "error" },
					},
					{
						name: "UserConfig[0] > ExtendedConfig[1][0][0]",
						rules: { "no-alert": "error" },
					},
					{ rules: { "no-debugger": "error" } },
				]);
			});
		});

		describe("extending arrays", () => {
			it("should extend two config arrays without files", () => {
				const config = defineConfig({
					extends: [
						[{ rules: { "no-console": "error" } }],
						[{ rules: { "no-alert": "error" } }],
					],
					rules: {
						"no-debugger": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > ExtendedConfig[0][0]",
						rules: { "no-console": "error" },
					},
					{
						name: "UserConfig[0] > ExtendedConfig[1][0]",
						rules: { "no-alert": "error" },
					},
					{ rules: { "no-debugger": "error" } },
				]);
			});

			it("should extend two config arrays each with two elements and files in base config", () => {
				const config = defineConfig({
					files: ["*.js"],
					extends: [
						[
							{ rules: { "no-console": "error" } },
							{ rules: { "no-debugger": "error" } },
						],
						[
							{ rules: { "no-alert": "error" } },
							{
								rules: {
									"no-warning-comments": [
										"error",
										{ terms: ["todo"], location: "start" },
									],
								},
							},
						],
					],
					rules: {
						"no-unreachable": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > ExtendedConfig[0][0]",
						files: ["*.js"],
						rules: { "no-console": "error" },
					},
					{
						name: "UserConfig[0] > ExtendedConfig[0][1]",
						files: ["*.js"],
						rules: { "no-debugger": "error" },
					},
					{
						name: "UserConfig[0] > ExtendedConfig[1][0]",
						files: ["*.js"],
						rules: { "no-alert": "error" },
					},
					{
						name: "UserConfig[0] > ExtendedConfig[1][1]",
						files: ["*.js"],
						rules: {
							"no-warning-comments": [
								"error",
								{ terms: ["todo"], location: "start" },
							],
						},
					},
					{ files: ["*.js"], rules: { "no-unreachable": "error" } },
				]);
			});

			it("should extend two config arrays each with two elements and names, and files in base config", () => {
				const config = defineConfig({
					name: "Base",
					files: ["*.js"],
					extends: [
						[
							{ name: "Ext1", rules: { "no-console": "error" } },
							{ name: "Ext2", rules: { "no-debugger": "error" } },
						],
						[
							{ name: "Ext3", rules: { "no-alert": "error" } },
							{
								name: "Ext4",
								rules: {
									"no-warning-comments": [
										"error",
										{ terms: ["todo"], location: "start" },
									],
								},
							},
						],
					],
					rules: {
						"no-unreachable": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "Base > Ext1",
						files: ["*.js"],
						rules: { "no-console": "error" },
					},
					{
						name: "Base > Ext2",
						files: ["*.js"],
						rules: { "no-debugger": "error" },
					},
					{
						name: "Base > Ext3",
						files: ["*.js"],
						rules: { "no-alert": "error" },
					},
					{
						name: "Base > Ext4",
						files: ["*.js"],
						rules: {
							"no-warning-comments": [
								"error",
								{ terms: ["todo"], location: "start" },
							],
						},
					},
					{
						name: "Base",
						files: ["*.js"],
						rules: { "no-unreachable": "error" },
					},
				]);
			});
		});

		describe("extending strings", () => {
			it("should extend two configs by string names", () => {
				const test1Plugin = {
					configs: {
						config1: {
							rules: { "no-console": "error" },
						},
					},
				};

				const test2Plugin = {
					configs: {
						config2: {
							rules: { "no-alert": "error" },
						},
					},
				};

				const config = defineConfig({
					plugins: {
						test1: test1Plugin,
						test2: test2Plugin,
					},
					extends: ["test1/config1", "test2/config2"],
					rules: {
						"no-debugger": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > test1/config1",
						rules: { "no-console": "error" },
					},
					{
						name: "UserConfig[0] > test2/config2",
						rules: { "no-alert": "error" },
					},
					{
						plugins: { test1: test1Plugin, test2: test2Plugin },
						rules: { "no-debugger": "error" },
					},
				]);
			});

			it("should extend two array configs by string names", () => {
				const test1Plugin = {
					configs: {
						config1: [
							{ rules: { "no-console": "error" } },
							{ rules: { "no-debugger": "error" } },
						],
					},
				};

				const test2Plugin = {
					configs: {
						config2: [
							{ name: "Ext3", rules: { "no-alert": "error" } },
							{
								name: "Ext4",
								rules: {
									"no-warning-comments": [
										"error",
										{ terms: ["todo"], location: "start" },
									],
								},
							},
						],
					},
				};

				const config = defineConfig({
					name: "Base",
					files: ["*.js"],
					plugins: {
						test1: test1Plugin,
						test2: test2Plugin,
					},
					extends: ["test1/config1", "test2/config2"],
					rules: {
						"no-unreachable": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "Base > test1/config1[0]",
						files: ["*.js"],
						rules: { "no-console": "error" },
					},
					{
						name: "Base > test1/config1[1]",
						files: ["*.js"],
						rules: { "no-debugger": "error" },
					},
					{
						name: "Base > test2/config2[0]",
						files: ["*.js"],
						rules: { "no-alert": "error" },
					},
					{
						name: "Base > test2/config2[1]",
						files: ["*.js"],
						rules: {
							"no-warning-comments": [
								"error",
								{ terms: ["todo"], location: "start" },
							],
						},
					},
					{
						name: "Base",
						plugins: { test1: test1Plugin, test2: test2Plugin },
						files: ["*.js"],
						rules: { "no-unreachable": "error" },
					},
				]);
			});

			it("should extend a three-dimensional array of configs by string names", () => {
				const test1Plugin = {
					configs: {
						config1: [
							[{ rules: { "no-console": "error" } }],
							[{ rules: { "no-debugger": "error" } }],
						],
					},
				};

				const test2Plugin = {
					configs: {
						config2: [
							[{ rules: { "no-alert": "error" } }],
							[
								{
									rules: {
										"no-warning-comments": [
											"error",
											{
												terms: ["todo"],
												location: "start",
											},
										],
									},
								},
							],
						],
					},
				};

				const config = defineConfig({
					plugins: {
						test1: test1Plugin,
						test2: test2Plugin,
					},
					extends: ["test1/config1", "test2/config2"],
					rules: {
						"no-unreachable": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > ExtendedConfig[0][0][0]",
						rules: { "no-console": "error" },
					},
					{
						name: "UserConfig[0] > ExtendedConfig[0][1][0]",
						rules: { "no-debugger": "error" },
					},
					{
						name: "UserConfig[0] > ExtendedConfig[1][0][0]",
						rules: { "no-alert": "error" },
					},
					{
						name: "UserConfig[0] > ExtendedConfig[1][1][0]",
						rules: {
							"no-warning-comments": [
								"error",
								{ terms: ["todo"], location: "start" },
							],
						},
					},
					{
						plugins: {
							test1: test1Plugin,
							test2: test2Plugin,
						},
						rules: { "no-unreachable": "error" },
					},
				]);
			});

			it("should throw an error when a plugin is not found", () => {
				assert.throws(() => {
					defineConfig({
						extends: ["test1/config1"],
						rules: {
							"no-debugger": "error",
						},
					});
				}, /Plugin "test1" not found\./u);
			});

			it("should throw an error when a plugin config is not found", () => {
				const testPlugin = {
					configs: {
						config1: {
							rules: { "no-console": "error" },
						},
					},
				};

				assert.throws(() => {
					defineConfig({
						plugins: {
							test: testPlugin,
						},
						extends: ["test/config2"],
						rules: {
							"no-debugger": "error",
						},
					});
				}, /Plugin config "config2" not found in plugin "test"\./u);
			});

			it("should throw an error when a plugin config is in eslintrc format", () => {
				const testPlugin = {
					configs: {
						config1: {
							root: true,
							rules: { "no-console": "error" },
						},
					},
				};

				assert.throws(() => {
					defineConfig({
						plugins: {
							test: testPlugin,
						},
						extends: ["test/config1"],
						rules: {
							"no-debugger": "error",
						},
					});
				}, /Plugin config "config1" in plugin "test" is an eslintrc config and cannot be used in this context\./u);
			});

			it("should use flat config when base config is legacy", () => {
				const testPlugin = {
					configs: {
						recommended: {
							env: { browser: true }, // legacy config
							rules: { "no-console": "error" },
						},
						"flat/recommended": {
							rules: { "no-console": "error" },
						},
					},
				};

				const config = defineConfig({
					plugins: {
						test: testPlugin,
					},
					extends: ["test/recommended"],
					rules: {
						"no-debugger": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > test/recommended",
						rules: { "no-console": "error" },
					},
					{
						plugins: { test: testPlugin },
						rules: { "no-debugger": "error" },
					},
				]);
			});

			it("should throw error when both base and flat configs are legacy", () => {
				const testPlugin = {
					configs: {
						recommended: {
							env: { browser: true },
							rules: { "no-console": "error" },
						},
						"flat/recommended": {
							env: { browser: true },
							rules: { "no-console": "error" },
						},
					},
				};

				assert.throws(() => {
					defineConfig({
						plugins: {
							test: testPlugin,
						},
						extends: ["test/recommended"],
						rules: {
							"no-debugger": "error",
						},
					});
				}, /Plugin config "recommended" in plugin "test" is an eslintrc config and cannot be used in this context\./u);
			});
		});

		describe("extending mixed types", () => {
			it("should extend configs using mix of strings, objects and arrays", () => {
				const testPlugin = {
					configs: {
						recommended: {
							rules: { "no-console": "error" },
						},
					},
				};

				const config = defineConfig({
					name: "Base",
					files: ["*.js"],
					plugins: { test: testPlugin },
					extends: [
						"test/recommended",
						{ name: "Object", rules: { "no-alert": "error" } },
						[
							{ rules: { "no-debugger": "error" } },
							{
								name: "ArrayConfig",
								rules: { "no-eval": "error" },
							},
						],
					],
					rules: {
						"no-var": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "Base > test/recommended",
						files: ["*.js"],
						rules: { "no-console": "error" },
					},
					{
						name: "Base > Object",
						files: ["*.js"],
						rules: { "no-alert": "error" },
					},
					{
						name: "Base > ExtendedConfig[2][0]",
						files: ["*.js"],
						rules: { "no-debugger": "error" },
					},
					{
						name: "Base > ArrayConfig",
						files: ["*.js"],
						rules: { "no-eval": "error" },
					},
					{
						name: "Base",
						files: ["*.js"],
						plugins: { test: testPlugin },
						rules: { "no-var": "error" },
					},
				]);
			});
		});

		describe("package namespace", () => {
			it("should extend one config by string names when plugin has a namespace", () => {
				const testPlugin = {
					meta: {
						namespace: "test",
					},
					configs: {
						config1: {
							rules: { "test/no-console": "error" },
						},
					},
				};

				const config = defineConfig({
					plugins: {
						test1: testPlugin,
					},
					extends: ["test1/config1"],
					rules: {
						"no-debugger": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > test1/config1",
						rules: { "test1/no-console": "error" },
					},
					{
						plugins: { test1: testPlugin },
						rules: { "no-debugger": "error" },
					},
				]);
			});

			it("should extend one config with complex rule name by string names when plugin has a namespace", () => {
				const testPlugin = {
					meta: {
						namespace: "test",
					},
					configs: {
						config1: {
							rules: { "test/no-console/foo": "error" },
						},
					},
				};

				const config = defineConfig({
					plugins: {
						test1: testPlugin,
					},
					extends: ["test1/config1"],
					rules: {
						"no-debugger": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > test1/config1",
						rules: { "test1/no-console/foo": "error" },
					},
					{
						plugins: { test1: testPlugin },
						rules: { "no-debugger": "error" },
					},
				]);
			});

			it("should extend one config with processor by string names when plugin has a namespace", () => {
				const testPlugin = {
					meta: {
						namespace: "test",
					},
					configs: {
						config1: {
							processor: "test/processor",
						},
					},
				};

				const config = defineConfig({
					plugins: {
						test1: testPlugin,
					},
					extends: ["test1/config1"],
					rules: {
						"no-debugger": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > test1/config1",
						processor: "test1/processor",
					},
					{
						plugins: { test1: testPlugin },
						rules: { "no-debugger": "error" },
					},
				]);
			});

			it("should extend a config array by string names when plugin has a namespace", () => {
				const test1Plugin = {
					meta: {
						namespace: "testx",
					},
					configs: {
						config1: [
							{ rules: { "testx/no-console": "error" } },
							{ rules: { "testx/no-debugger": "error" } },
						],
					},
				};

				const test2Plugin = {
					meta: {
						namespace: "testy",
					},
					configs: {
						config2: [
							{
								name: "Ext3",
								rules: { "testy/no-alert": "error" },
							},
							{
								name: "Ext4",
								rules: {
									"testy/no-warning-comments": [
										"error",
										{ terms: ["todo"], location: "start" },
									],
								},
							},
						],
					},
				};

				const config = defineConfig({
					name: "Base",
					files: ["*.js"],
					plugins: {
						test1: test1Plugin,
						test2: test2Plugin,
					},
					extends: ["test1/config1", "test2/config2"],
					rules: {
						"no-unreachable": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "Base > test1/config1[0]",
						files: ["*.js"],
						rules: { "test1/no-console": "error" },
					},
					{
						name: "Base > test1/config1[1]",
						files: ["*.js"],
						rules: { "test1/no-debugger": "error" },
					},
					{
						name: "Base > test2/config2[0]",
						files: ["*.js"],
						rules: { "test2/no-alert": "error" },
					},
					{
						name: "Base > test2/config2[1]",
						files: ["*.js"],
						rules: {
							"test2/no-warning-comments": [
								"error",
								{ terms: ["todo"], location: "start" },
							],
						},
					},
					{
						name: "Base",
						plugins: { test1: test1Plugin, test2: test2Plugin },
						files: ["*.js"],
						rules: { "no-unreachable": "error" },
					},
				]);
			});

			it("should extend one config with language by string names when plugin has a namespace", () => {
				const testPlugin = {
					meta: {
						namespace: "test",
					},
					configs: {
						config1: {
							language: "test/typescript",
						},
					},
				};

				const config = defineConfig({
					plugins: {
						test1: testPlugin,
					},
					extends: ["test1/config1"],
					rules: {
						"no-debugger": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > test1/config1",
						language: "test1/typescript",
					},
					{
						plugins: { test1: testPlugin },
						rules: { "no-debugger": "error" },
					},
				]);
			});

			it("should not modify language when plugin has no namespace", () => {
				const testPlugin = {
					configs: {
						config1: {
							language: "test/typescript",
						},
					},
				};

				const config = defineConfig({
					plugins: {
						test1: testPlugin,
					},
					extends: ["test1/config1"],
					rules: {
						"no-debugger": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > test1/config1",
						language: "test/typescript",
					},
					{
						plugins: { test1: testPlugin },
						rules: { "no-debugger": "error" },
					},
				]);
			});

			it("should properly find a config with two slashes in the name", () => {
				const testPlugin = {
					configs: {
						"config1/config2": {
							rules: { "no-console": "error" },
						},
					},
				};

				const config = defineConfig({
					plugins: {
						test1: testPlugin,
					},
					extends: ["test1/config1/config2"],
					rules: {
						"no-debugger": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > test1/config1/config2",
						rules: { "no-console": "error" },
					},
					{
						plugins: { test1: testPlugin },
						rules: { "no-debugger": "error" },
					},
				]);
			});

			it("should properly find a config with @ in the name", () => {
				const testPlugin = {
					configs: {
						config1: {
							rules: { "no-console": "error" },
						},
					},
				};

				const config = defineConfig({
					plugins: {
						"@test1/plugin": testPlugin,
					},
					extends: ["@test1/plugin/config1"],
					rules: {
						"no-debugger": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > @test1/plugin/config1",
						rules: { "no-console": "error" },
					},
					{
						plugins: { "@test1/plugin": testPlugin },
						rules: { "no-debugger": "error" },
					},
				]);
			});

			it("should properly find a config with @ and two slashes in the name", () => {
				const testPlugin = {
					configs: {
						"config1/example": {
							rules: { "no-console": "error" },
						},
					},
				};

				const config = defineConfig({
					plugins: {
						"@test1/plugin": testPlugin,
					},
					extends: ["@test1/plugin/config1/example"],
					rules: {
						"no-debugger": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > @test1/plugin/config1/example",
						rules: { "no-console": "error" },
					},
					{
						plugins: { "@test1/plugin": testPlugin },
						rules: { "no-debugger": "error" },
					},
				]);
			});

			it("should preserve rules that don't start with the plugin namespace", () => {
				const testPlugin = {
					configs: {
						config1: {
							rules: { "foo/no-console": "error" },
						},
						config2: {
							rules: { "no-alert": "error" },
						},
					},
				};

				const config = defineConfig({
					plugins: {
						test1: testPlugin,
					},
					extends: ["test1/config1", "test1/config2"],
					rules: {
						"no-debugger": "error",
						"no-alert": "warn",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > test1/config1",
						rules: { "foo/no-console": "error" },
					},
					{
						name: "UserConfig[0] > test1/config2",
						rules: { "no-alert": "error" },
					},
					{
						plugins: { test1: testPlugin },
						rules: { "no-debugger": "error", "no-alert": "warn" },
					},
				]);
			});

			it("should extend objects with multiple plugin rules and maintain all rules", () => {
				const testPlugin = {
					meta: {
						namespace: "test",
					},
					configs: {
						config1: {
							plugins: { x: {} },
							rules: { "x/no-console": "error" },
						},
						config2: {
							plugins: { y: {} },
							rules: { "y/no-alert": "error" },
						},
					},
				};

				const config = defineConfig({
					plugins: {
						test1: testPlugin,
					},
					extends: ["test1/config1", "test1/config2"],
					rules: {
						"no-debugger": "error",
					},
				});
				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > test1/config1",
						plugins: { x: {} },
						rules: { "x/no-console": "error" },
					},
					{
						name: "UserConfig[0] > test1/config2",
						plugins: { y: {} },
						rules: { "y/no-alert": "error" },
					},
					{
						plugins: { test1: testPlugin },
						rules: { "no-debugger": "error" },
					},
				]);
			});

			it("should extend a three-dimensional array of configs by string names with plugin namespace replacement", () => {
				const testPlugin = {
					meta: {
						namespace: "test",
					},
					configs: {
						config1: [
							[{ rules: { "test/no-console": "error" } }],
							[{ rules: { "test/no-debugger": "error" } }],
						],
					},
				};

				const config = defineConfig({
					plugins: {
						test1: testPlugin,
					},
					extends: ["test1/config1"],
					rules: {
						"no-unreachable": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > ExtendedConfig[0][0][0]",
						rules: { "test1/no-console": "error" },
					},
					{
						name: "UserConfig[0] > ExtendedConfig[0][1][0]",
						rules: { "test1/no-debugger": "error" },
					},
					{
						plugins: {
							test1: testPlugin,
						},
						rules: { "no-unreachable": "error" },
					},
				]);
			});

			it("should extend a multi-dimensional array of configs by string names with plugin namespace replacement", () => {
				const testPlugin = {
					meta: {
						namespace: "test",
					},
					configs: {
						config1: [
							[{ rules: { "test/no-console": "error" } }],
							[
								{ rules: { "test/no-debugger": "error" } },
								[{ rules: { "test/no-alert": "error" } }],
							],
						],
					},
				};

				const config = defineConfig({
					plugins: {
						test1: testPlugin,
					},
					extends: ["test1/config1"],
					rules: {
						"no-unreachable": "error",
					},
				});

				assert.deepStrictEqual(config, [
					{
						name: "UserConfig[0] > ExtendedConfig[0][0][0]",
						rules: { "test1/no-console": "error" },
					},
					{
						name: "UserConfig[0] > ExtendedConfig[0][1][0]",
						rules: { "test1/no-debugger": "error" },
					},
					{
						name: "UserConfig[0] > ExtendedConfig[0][1][1][0]",
						rules: { "test1/no-alert": "error" },
					},
					{
						plugins: {
							test1: testPlugin,
						},
						rules: { "no-unreachable": "error" },
					},
				]);
			});
		});

		describe("Errors", () => {
			it("should throw an error when extends is not an array", () => {
				assert.throws(() => {
					defineConfig({
						extends: "test/recommended",
						rules: {
							"no-debugger": "error",
						},
					});
				}, /The `extends` property must be an array\./u);
			});

			it("should throw an error when an extends element has an extends key", () => {
				assert.throws(() => {
					defineConfig({
						extends: [
							{
								extends: ["test/recommended"],
								rules: { "no-console": "error" },
							},
						],
						rules: {
							"no-debugger": "error",
						},
					});
				}, /Nested 'extends' is not allowed/u);
			});
		});
	});

	describe("multidimensional arrays", () => {
		it("should handle a two-dimensional array of configs", () => {
			const config = defineConfig([
				[
					{
						name: "Base1",
						files: ["*.js"],
						rules: { "no-console": "error" },
					},
					{
						name: "Base2",
						files: ["*.ts"],
						rules: { "no-alert": "error" },
					},
				],
				[
					{
						name: "Base3",
						files: ["*.jsx"],
						rules: { "no-debugger": "error" },
					},
					{
						name: "Base4",
						files: ["*.tsx"],
						rules: { "no-unused-vars": "error" },
					},
				],
			]);

			assert.deepStrictEqual(config, [
				{
					name: "Base1",
					files: ["*.js"],
					rules: { "no-console": "error" },
				},
				{
					name: "Base2",
					files: ["*.ts"],
					rules: { "no-alert": "error" },
				},
				{
					name: "Base3",
					files: ["*.jsx"],
					rules: { "no-debugger": "error" },
				},
				{
					name: "Base4",
					files: ["*.tsx"],
					rules: { "no-unused-vars": "error" },
				},
			]);
		});
	});

	describe("basePath", () => {
		it("should apply `basePath` from the base config to all resulting configs", () => {
			const config = defineConfig({
				basePath: "my-base-path",
				extends: [
					{ rules: { "no-console": "error" } },
					[{ rules: { "no-alert": "error" } }, { ignores: ["foo"] }],
					{ ignores: ["bar"] },
					{ files: ["src/**"], rules: { "no-console": "warn" } },
				],
				rules: {
					"no-debugger": "error",
				},
			});

			assert.deepStrictEqual(config, [
				{
					name: "UserConfig[0] > ExtendedConfig[0]",
					basePath: "my-base-path",
					rules: { "no-console": "error" },
				},
				{
					name: "UserConfig[0] > ExtendedConfig[1][0]",
					basePath: "my-base-path",
					rules: { "no-alert": "error" },
				},
				{
					name: "UserConfig[0] > ExtendedConfig[1][1]",
					basePath: "my-base-path",
					ignores: ["foo"],
				},
				{
					name: "UserConfig[0] > ExtendedConfig[2]",
					basePath: "my-base-path",
					ignores: ["bar"],
				},
				{
					name: "UserConfig[0] > ExtendedConfig[3]",
					basePath: "my-base-path",
					files: ["src/**"],
					rules: { "no-console": "warn" },
				},
				{
					basePath: "my-base-path",
					rules: {
						"no-debugger": "error",
					},
				},
			]);
		});

		it("should omit base config when it only has ignores", () => {
			const config = defineConfig({
				basePath: "my-base-path",
				ignores: ["test/*.js"],
				extends: [{ rules: { "no-console": "error" } }],
			});

			assert.deepStrictEqual(config, [
				{
					name: "UserConfig[0] > ExtendedConfig[0]",
					basePath: "my-base-path",
					ignores: ["test/*.js"],
					rules: { "no-console": "error" },
				},
			]);
		});

		it("should throw an error when an extended config has `basePath`", () => {
			assert.throws(() => {
				defineConfig({
					extends: [
						{
							basePath: "my-base-path",
							rules: { "no-console": "error" },
						},
					],
					rules: {
						"no-debugger": "error",
					},
				});
			}, /'basePath' in `extends` is not allowed\./u);

			assert.throws(() => {
				defineConfig({
					extends: [
						{
							rules: { "no-alert": "error" },
						},
						[
							{
								basePath: "my-base-path",
								rules: { "no-console": "error" },
							},
						],
					],
					rules: {
						"no-debugger": "error",
					},
				});
			}, /'basePath' in `extends` is not allowed\./u);

			assert.throws(() => {
				defineConfig({
					extends: [
						{
							basePath: "my-base-path",
							ignores: ["foo"],
						},
					],
					rules: {
						"no-debugger": "error",
					},
				});
			}, /'basePath' in `extends` is not allowed\./u);

			assert.throws(() => {
				defineConfig({
					extends: [
						{
							rules: { "no-alert": "error" },
						},
						[
							{
								basePath: "my-base-path",
								ignores: ["foo"],
							},
						],
					],
					rules: {
						"no-debugger": "error",
					},
				});
			}, /'basePath' in `extends` is not allowed\./u);
		});
	});

	describe("Errors", () => {
		it("should throw an error when null is passed to defineConfig", () => {
			assert.throws(() => {
				defineConfig(null);
			}, /Expected an object but received null\./u);
		});

		it("should throw an error when no arguments are passed to defineConfig", () => {
			assert.throws(() => {
				defineConfig();
			}, /Expected one or more arguments\./u);
		});
	});
});
