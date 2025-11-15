/**
 * @fileoverview Tests for ConfigArray object.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { ConfigArray, ConfigArraySymbol } from "../src/config-array.js";
import assert from "node:assert";
import { fileURLToPath } from "node:url";
import path from "node:path";

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

// calculate base path using import.meta
const basePath = fileURLToPath(new URL(".", import.meta.url));

const schema = {
	language: {
		required: false,
		validate(value) {
			if (typeof value !== "function") {
				throw new TypeError("Expected a function.");
			}
		},
		merge(a, b) {
			if (!b) {
				return a;
			}

			if (!a) {
				return b;
			}

			throw new Error("Unexpected undefined arguments.");
		},
	},
	defs: {
		required: false,
		validate(value) {
			if (!value || typeof value !== "object") {
				throw new TypeError("Object expected.");
			}
		},
		merge(a, b) {
			return {
				...a,
				...b,
			};
		},
	},
};

const JSLanguage = class {};
const CSSLanguage = class {};
const MarkdownLanguage = class {};
const JSONLanguage = class {};

function createConfigArray(options) {
	return new ConfigArray(
		[
			{
				files: ["**/*.js"],
				language: JSLanguage,
			},
			{
				files: ["**/*.json"],
				language: JSONLanguage,
			},
			{
				files: ["**/*.css"],
				language: CSSLanguage,
			},
			{
				files: ["**/*.md", "**/.markdown"],
				language: MarkdownLanguage,
			},
			{},
			{
				files: ["!*.css"],
				defs: {
					css: false,
				},
			},
			{
				files: ["**/*.xsl"],
				ignores: ["fixtures/test.xsl"],
				defs: {
					xsl: true,
				},
			},
			{
				files: ["tests/**/*.xyz"],
				defs: {
					xyz: true,
				},
			},
			{
				ignores: ["tests/fixtures/**"],
				defs: {
					name: "config-array",
				},
			},
			{
				ignores: ["node_modules/**"],
			},
			{
				files: ["foo.test.js"],
				defs: {
					name: "config-array.test",
				},
			},
			function (context) {
				return {
					files: ["bar.test.js"],
					defs: {
						name: context.name,
					},
				};
			},
			function (context) {
				return [
					{
						files: ["baz.test.js"],
						defs: {
							name: `baz-${context.name}`,
						},
					},
					{
						files: ["boom.test.js"],
						defs: {
							name: `boom-${context.name}`,
						},
					},
				];
			},
			{
				files: [["*.and.*", "*.js"]],
				defs: {
					name: "AND operator",
				},
			},
			{
				files: [filePath => filePath.endsWith(".html")],
				defs: {
					name: "HTML",
				},
			},
			{
				ignores: [filePath => filePath.endsWith(".gitignore")],
			},
			{
				files: ["**/*"],
				defs: {
					universal: true,
				},
			},
		],
		{
			basePath,
			schema,
			extraConfigTypes: ["array", "function"],
			...options,
		},
	);
}

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("ConfigArray", () => {
	let configs, unnormalizedConfigs;

	beforeEach(() => {
		unnormalizedConfigs = new ConfigArray([], {
			basePath,
			extraConfigTypes: ["array", "function"],
		});
		configs = createConfigArray();
		return configs.normalize({
			name: "from-context",
		});
	});

	describe("Config Types Validation", () => {
		it("should not throw an error when objects are allowed", async () => {
			configs = new ConfigArray(
				[
					{
						files: ["*.js"],
					},
				],
				{
					basePath,
				},
			);
			await configs.normalize();
		});

		it("should not throw an error when arrays are allowed", async () => {
			configs = new ConfigArray(
				[
					[
						{
							files: ["*.js"],
						},
					],
				],
				{
					basePath,
					extraConfigTypes: ["array"],
				},
			);
			await configs.normalize();
		});

		it("should not throw an error when functions are allowed", async () => {
			configs = new ConfigArray([() => ({})], {
				basePath,
				extraConfigTypes: ["function"],
			});
			await configs.normalize();
		});

		it("should throw an error in normalize() when arrays are not allowed", done => {
			configs = new ConfigArray(
				[
					[
						{
							files: "*.js",
						},
					],
				],
				{
					basePath,
				},
			);

			configs
				.normalize()
				.then(() => {
					throw new Error("Missing error.");
				})
				.catch(ex => {
					assert.match(ex.message, /Unexpected array/u);
					done();
				});
		});

		it("should throw an error in normalizeSync() when arrays are not allowed", () => {
			configs = new ConfigArray(
				[
					[
						{
							files: "*.js",
						},
					],
				],
				{
					basePath,
				},
			);
			assert.throws(() => {
				configs.normalizeSync();
			}, /Unexpected array/u);
		});

		it("should throw an error in normalize() when functions are not allowed", done => {
			configs = new ConfigArray([() => ({})], {
				basePath,
			});

			configs
				.normalize()
				.then(() => {
					throw new Error("Missing error.");
				})
				.catch(ex => {
					assert.match(ex.message, /Unexpected function/u);
					done();
				});
		});

		it("should throw an error in normalizeSync() when functions are not allowed", () => {
			configs = new ConfigArray([() => {}], {
				basePath,
			});

			assert.throws(() => {
				configs.normalizeSync();
			}, /Unexpected function/u);
		});
	});

	describe("Validation", () => {
		function testValidationError({
			only = false,
			title,
			configs: configsToTest,
			expectedError,
		}) {
			const localIt = only ? it.only : it;

			localIt(`${title} when calling normalize()`, async () => {
				const configArray = new ConfigArray(configsToTest, {
					basePath,
				});

				await assert.rejects(configArray.normalize(), expectedError);
			});

			localIt(`${title} when calling normalizeSync()`, () => {
				const configArray = new ConfigArray(configsToTest, {
					basePath,
				});

				assert.throws(() => configArray.normalizeSync(), expectedError);
			});
		}

		testValidationError({
			title: "should throw an error when files is not an array",
			configs: [
				{
					files: "*.js",
				},
			],
			expectedError: /non-empty array/u,
		});

		testValidationError({
			title: "should throw an error when files is an empty array",
			configs: [
				{
					files: [],
				},
			],
			expectedError: /non-empty array/u,
		});

		testValidationError({
			title: "should throw an error when files is undefined",
			configs: [
				{
					files: undefined,
				},
			],
			expectedError: /non-empty array/u,
		});

		testValidationError({
			title: "should throw an error when files contains an invalid element",
			configs: [
				{
					name: "",
					files: ["*.js", undefined],
				},
			],
			expectedError:
				/ConfigError: Config \(unnamed\): Key "files": Items must be a string, a function, or an array of strings and functions\./u,
		});

		testValidationError({
			title: "should throw an error when ignores is undefined",
			configs: [
				{
					ignores: undefined,
				},
			],
			expectedError:
				/ConfigError: Config \(unnamed\): Key "ignores": Expected value to be an array\./u,
		});

		testValidationError({
			title: "should throw an error when a global ignores contains an invalid element",
			configs: [
				{
					name: "foo",
					ignores: ["ignored/**", -1],
				},
			],
			expectedError:
				/Config "foo": Key "ignores": Expected array to only contain strings and functions\./u,
		});

		testValidationError({
			title: "should throw an error when a non-global ignores contains an invalid element",
			configs: [
				{
					name: "foo",
					files: ["*.js"],
					ignores: [-1],
				},
			],
			expectedError:
				/Config "foo": Key "ignores": Expected array to only contain strings and functions\./u,
		});

		testValidationError({
			title: "should throw an error when basePath is undefined",
			configs: [
				{
					name: "foo",
					basePath: undefined,
				},
			],
			expectedError:
				/Config "foo": Key "basePath": Expected value to be a string\./u,
		});

		testValidationError({
			title: "should throw an error when basePath is not a string",
			configs: [
				{
					basePath: 5,
				},
			],
			expectedError:
				/Config \(unnamed\): Key "basePath": Expected value to be a string\./u,
		});

		it("should throw an error when a config is not an object", () => {
			configs = new ConfigArray(
				[
					{
						files: ["*.js"],
					},
					"eslint:reccommended", // typo
				],
				{ basePath },
			);

			assert.throws(() => {
				configs.normalizeSync();
			}, /ConfigError: Config \(unnamed\): Unexpected non-object config./u);
		});

		it("should throw an error when base config name is not a string", async () => {
			configs = new ConfigArray(
				[
					{
						files: ["**"],
						name: true,
					},
				],
				{ basePath },
			);

			await configs.normalize();

			assert.throws(() => {
				configs.getConfig("foo.js");
			}, /ConfigError: Config \(unnamed\): Key "name": Property must be a string./u);
		});

		it("should throw an error when additional config name is not a string", async () => {
			configs = new ConfigArray([{}], { basePath });
			configs.push({
				files: ["**"],
				name: true,
			});

			await configs.normalize();

			assert.throws(() => {
				configs.getConfig("foo.js");
			}, /ConfigError: Config \(unnamed\): Key "name": Property must be a string./u);
		});

		it("should throw an error when base config is undefined", () => {
			configs = new ConfigArray([undefined], { basePath });

			assert.throws(() => {
				configs.normalizeSync();
			}, /ConfigError: Config \(unnamed\): Unexpected undefined config./u);
		});

		it("should throw an error when base config is null", () => {
			configs = new ConfigArray([null], { basePath });

			assert.throws(() => {
				configs.normalizeSync();
			}, /ConfigError: Config \(unnamed\): Unexpected null config./u);
		});

		it("should throw an error when additional config is undefined", () => {
			configs = new ConfigArray([{}], { basePath });
			configs.push(undefined);

			assert.throws(() => {
				configs.normalizeSync();
			}, /ConfigError: Config \(unnamed\): Unexpected undefined config./u);
		});

		it("should throw an error when additional config is null", () => {
			configs = new ConfigArray([{}], { basePath });
			configs.push(null);

			assert.throws(() => {
				configs.normalizeSync();
			}, /ConfigError: Config \(unnamed\): Unexpected null config./u);
		});

		it("should throw an error when basePath is a relative path", () => {
			assert.throws(() => {
				void new ConfigArray([{}], { basePath: "foo/bar" });
			}, /Expected an absolute path/u);
		});

		it("should throw an error when basePath is an empty string", () => {
			assert.throws(
				() => {
					void new ConfigArray([{}], { basePath: "" });
				},
				{
					constructor: TypeError,
					message: "basePath must be a non-empty string",
				},
			);
		});

		it("should throw an error when basePath is not a string", () => {
			assert.throws(
				() => {
					void new ConfigArray([{}], { basePath: ["/tmp/foo"] });
				},
				{
					constructor: TypeError,
					message: "basePath must be a non-empty string",
				},
			);
		});
	});

	describe("Config Pattern Normalization", () => {
		it("should create a new object when normalizing config patterns with ./", () => {
			const config = {
				files: ["./foo.js"],
			};

			configs = new ConfigArray([config], {
				basePath,
			});

			configs.normalizeSync();

			assert.notStrictEqual(configs[0], config);
		});

		it("should create a new object when normalizing config patterns with !./", async () => {
			const config = {
				ignores: ["!./foo.js"],
			};

			configs = new ConfigArray([config], {
				basePath,
			});

			await configs.normalize();

			assert.notStrictEqual(configs[0], config);
		});
	});

	describe("Config objects `basePath` normalization", () => {
		it("should create a new object with absolute `basePath` when normalizing relative `basePath` on posix (async)", async () => {
			const config = {
				basePath: "baz/qux",
				defs: {
					"test-def": "test-value",
				},
			};

			configs = new ConfigArray([config], {
				basePath: "/foo/bar",
				schema,
			});

			await configs.normalize();

			assert.notStrictEqual(configs[0], config);
			assert.deepStrictEqual(configs[0], {
				basePath: "/foo/bar/baz/qux",
				defs: {
					"test-def": "test-value",
				},
			});
		});

		it("should create a new object with absolute `basePath` when normalizing relative `basePath` on posix (sync)", () => {
			const config = {
				basePath: "baz/qux",
				defs: {
					"test-def": "test-value",
				},
			};

			configs = new ConfigArray([config], {
				basePath: "/foo/bar",
				schema,
			});

			configs.normalizeSync();

			assert.notStrictEqual(configs[0], config);
			assert.deepStrictEqual(configs[0], {
				basePath: "/foo/bar/baz/qux",
				defs: {
					"test-def": "test-value",
				},
			});
		});

		it("should create a new object with absolute `basePath` without trailing slash when normalizing relative `basePath` with trailing slash on posix (async)", async () => {
			const config = {
				basePath: "baz/qux/",
				defs: {
					"test-def": "test-value",
				},
			};

			configs = new ConfigArray([config], {
				basePath: "/foo/bar",
				schema,
			});

			await configs.normalize();

			assert.notStrictEqual(configs[0], config);
			assert.deepStrictEqual(configs[0], {
				basePath: "/foo/bar/baz/qux",
				defs: {
					"test-def": "test-value",
				},
			});
		});

		it("should create a new object with absolute `basePath` without trailing slash when normalizing relative `basePath` with trailing slash on posix (sync)", () => {
			const config = {
				basePath: "baz/qux/",
				defs: {
					"test-def": "test-value",
				},
			};

			configs = new ConfigArray([config], {
				basePath: "/foo/bar",
				schema,
			});

			configs.normalizeSync();

			assert.notStrictEqual(configs[0], config);
			assert.deepStrictEqual(configs[0], {
				basePath: "/foo/bar/baz/qux",
				defs: {
					"test-def": "test-value",
				},
			});
		});

		it("should create a new object with namespaced `basePath` when normalizing relative `basePath` on windows (async)", async () => {
			const config = {
				basePath: "baz/qux",
				defs: {
					"test-def": "test-value",
				},
			};

			configs = new ConfigArray([config], {
				basePath: "C:\\foo\\bar",
				schema,
			});

			await configs.normalize();

			assert.notStrictEqual(configs[0], config);
			assert.deepStrictEqual(configs[0], {
				basePath: "\\\\?\\C:\\foo\\bar\\baz\\qux",
				defs: {
					"test-def": "test-value",
				},
			});
		});

		it("should create a new object with namespaced `basePath` when normalizing relative `basePath` on windows (sync)", () => {
			const config = {
				basePath: "baz/qux",
				defs: {
					"test-def": "test-value",
				},
			};

			configs = new ConfigArray([config], {
				basePath: "C:\\foo\\bar",
				schema,
			});

			configs.normalizeSync();

			assert.notStrictEqual(configs[0], config);
			assert.deepStrictEqual(configs[0], {
				basePath: "\\\\?\\C:\\foo\\bar\\baz\\qux",
				defs: {
					"test-def": "test-value",
				},
			});
		});

		it("should create a new object with namespaced `basePath` without trailing slash when normalizing relative `basePath` with trailing slash on windows (async)", async () => {
			const config = {
				basePath: "baz/qux/",
				defs: {
					"test-def": "test-value",
				},
			};

			configs = new ConfigArray([config], {
				basePath: "C:\\foo\\bar",
				schema,
			});

			await configs.normalize();

			assert.notStrictEqual(configs[0], config);
			assert.deepStrictEqual(configs[0], {
				basePath: "\\\\?\\C:\\foo\\bar\\baz\\qux",
				defs: {
					"test-def": "test-value",
				},
			});
		});

		it("should create a new object with namespaced `basePath` without trailing slash when normalizing relative `basePath` with trailing slash on windows (sync)", () => {
			const config = {
				basePath: "baz/qux/",
				defs: {
					"test-def": "test-value",
				},
			};

			configs = new ConfigArray([config], {
				basePath: "C:\\foo\\bar",
				schema,
			});

			configs.normalizeSync();

			assert.notStrictEqual(configs[0], config);
			assert.deepStrictEqual(configs[0], {
				basePath: "\\\\?\\C:\\foo\\bar\\baz\\qux",
				defs: {
					"test-def": "test-value",
				},
			});
		});

		it("should create a new object with absolute `basePath` when normalizing absolute `basePath` on posix (async)", async () => {
			const config = {
				basePath: "/foo",
				defs: {
					"test-def": "test-value",
				},
			};

			configs = new ConfigArray([config], {
				basePath: "/foo/bar",
				schema,
			});

			await configs.normalize();

			assert.notStrictEqual(configs[0], config);
			assert.deepStrictEqual(configs[0], {
				basePath: "/foo",
				defs: {
					"test-def": "test-value",
				},
			});
		});

		it("should create a new object with absolute `basePath` when normalizing absolute `basePath` on posix (sync)", () => {
			const config = {
				basePath: "/foo",
				defs: {
					"test-def": "test-value",
				},
			};

			configs = new ConfigArray([config], {
				basePath: "/foo/bar",
				schema,
			});

			configs.normalizeSync();

			assert.notStrictEqual(configs[0], config);
			assert.deepStrictEqual(configs[0], {
				basePath: "/foo",
				defs: {
					"test-def": "test-value",
				},
			});
		});

		it("should create a new object with namespaced `basePath` when normalizing absolute `basePath` on windows (async)", async () => {
			const config = {
				basePath: "C:\\foo",
				defs: {
					"test-def": "test-value",
				},
			};

			configs = new ConfigArray([config], {
				basePath: "C:\\foo\\bar",
				schema,
			});

			await configs.normalize();

			assert.notStrictEqual(configs[0], config);
			assert.deepStrictEqual(configs[0], {
				basePath: "\\\\?\\C:\\foo",
				defs: {
					"test-def": "test-value",
				},
			});
		});

		it("should create a new object with namespaced `basePath` when normalizing absolute `basePath` on windows (sync)", () => {
			const config = {
				basePath: "C:\\foo",
				defs: {
					"test-def": "test-value",
				},
			};

			configs = new ConfigArray([config], {
				basePath: "C:\\foo\\bar",
				schema,
			});

			configs.normalizeSync();

			assert.notStrictEqual(configs[0], config);
			assert.deepStrictEqual(configs[0], {
				basePath: "\\\\?\\C:\\foo",
				defs: {
					"test-def": "test-value",
				},
			});
		});
	});

	describe("ConfigArray members", () => {
		beforeEach(() => {
			configs = createConfigArray();
			return configs.normalize({
				name: "from-context",
			});
		});

		describe("ConfigArraySymbol.finalizeConfig", () => {
			it("should allow finalizeConfig to alter config before returning when calling normalize()", async () => {
				configs = createConfigArray();
				configs[ConfigArraySymbol.finalizeConfig] = () => ({
					name: "from-finalize",
				});

				await configs.normalize({
					name: "from-context",
				});

				const filename = "foo.js";
				const config = configs.getConfig(filename);
				assert.strictEqual(config.name, "from-finalize");
			});

			it("should allow finalizeConfig to alter config before returning when calling normalizeSync()", () => {
				configs = createConfigArray();
				configs[ConfigArraySymbol.finalizeConfig] = () => ({
					name: "from-finalize",
				});

				configs.normalizeSync({
					name: "from-context",
				});

				const filename = "foo.js";
				const config = configs.getConfig(filename);
				assert.strictEqual(config.name, "from-finalize");
			});
		});

		describe("ConfigArraySymbol.preprocessConfig", () => {
			it("should allow preprocessConfig to alter config before returning", async () => {
				configs = createConfigArray();
				configs.push("foo:bar");

				configs[ConfigArraySymbol.preprocessConfig] = config => {
					if (config === "foo:bar") {
						return {
							defs: {
								name: "foo:bar",
							},
						};
					}

					return config;
				};

				await configs.normalize({
					name: "from-context",
				});

				const filename = "foo.js";
				const config = configs.getConfig(filename);
				assert.strictEqual(config.defs.name, "foo:bar");
			});

			it('should have "this" inside of function be equal to config array when calling normalize()', async () => {
				configs = createConfigArray();
				configs.push("foo:bar");
				let internalThis;

				configs[ConfigArraySymbol.preprocessConfig] = function (
					config,
				) {
					internalThis = this;

					if (config === "foo:bar") {
						return {
							defs: {
								name: "foo:bar",
							},
						};
					}

					return config;
				};

				await configs.normalize({
					name: "from-context",
				});

				assert.strictEqual(internalThis, configs);
			});

			it('should have "this" inside of function be equal to config array when calling normalizeSync()', () => {
				configs = createConfigArray();
				configs.push("foo:bar");
				let internalThis;

				configs[ConfigArraySymbol.preprocessConfig] = function (
					config,
				) {
					internalThis = this;

					if (config === "foo:bar") {
						return {
							defs: {
								name: "foo:bar",
							},
						};
					}

					return config;
				};

				configs.normalizeSync({
					name: "from-context",
				});

				assert.strictEqual(internalThis, configs);
			});
		});

		describe("basePath", () => {
			it("should store basePath property when basePath is provided", () => {
				assert.strictEqual(unnormalizedConfigs.basePath, basePath);
				assert.strictEqual(configs.basePath, basePath);
			});

			it("should default basePath property to '/'", () => {
				assert.strictEqual(new ConfigArray([]).basePath, "/");
			});
		});

		describe("isNormalized()", () => {
			it("should return true when the config array is normalized", () => {
				assert.strictEqual(configs.isNormalized(), true);
			});

			it("should return false when the config array is not normalized", () => {
				assert.strictEqual(unnormalizedConfigs.isNormalized(), false);
			});
		});

		describe("getConfigWithStatus()", () => {
			it("should throw an error when not normalized", () => {
				const filename = "foo.js";

				assert.throws(() => {
					unnormalizedConfigs.getConfigWithStatus(filename);
				}, /normalized/u);
			});

			it("should return config without meta fields `name`, `basePath`, `files`, and `ignores`", () => {
				configs = new ConfigArray(
					[
						{
							name: "test config",
							basePath,
							ignores: ["b.js"],
							files: ["*.js"],
							defs: {
								"test-def": "test-value",
							},
						},
					],
					{
						basePath,
						schema,
					},
				);

				configs.normalizeSync();

				assert.deepStrictEqual(configs.getConfigWithStatus("a.js"), {
					status: "matched",
					config: {
						defs: {
							"test-def": "test-value",
						},
					},
				});
			});

			describe("should return expected results", () => {
				it("for a file outside the base path", () => {
					const filename = "../foo.js";
					const configWithStatus =
						configs.getConfigWithStatus(filename);

					assert(Object.isFrozen(configWithStatus));
					assert.strictEqual(configWithStatus.config, undefined);
					assert.strictEqual(configWithStatus.status, "external");

					const newFilename = "../bar.js";
					const newConfigWithStatus =
						configs.getConfigWithStatus(newFilename);

					// check that returned objects are reused
					assert.strictEqual(newConfigWithStatus, configWithStatus);
				});

				it("for a file ignored based on directory pattern", () => {
					const filename = "node_modules/foo.js";
					const configWithStatus =
						configs.getConfigWithStatus(filename);

					assert(Object.isFrozen(configWithStatus));
					assert.strictEqual(configWithStatus.config, undefined);
					assert.strictEqual(configWithStatus.status, "ignored");

					const newFilename = "node_modules/bar.js";
					const newConfigWithStatus =
						configs.getConfigWithStatus(newFilename);

					// check that returned objects are reused
					assert.strictEqual(newConfigWithStatus, configWithStatus);
				});

				it("for a file ignored based on file pattern", () => {
					const filename = ".gitignore";
					const configWithStatus =
						configs.getConfigWithStatus(filename);

					assert(Object.isFrozen(configWithStatus));
					assert.strictEqual(configWithStatus.config, undefined);
					assert.strictEqual(configWithStatus.status, "ignored");

					const newFilename = "dir/.gitignore";
					const newConfigWithStatus =
						configs.getConfigWithStatus(newFilename);

					// check that returned objects are reused
					assert.strictEqual(newConfigWithStatus, configWithStatus);
				});

				it("for a file without a matching config object", () => {
					configs = new ConfigArray(
						[
							{
								files: ["**/*"],
							},
						],
						{ basePath },
					);

					configs.normalizeSync();
					const filename = "foo.bar";
					const configWithStatus =
						configs.getConfigWithStatus(filename);

					assert(Object.isFrozen(configWithStatus));
					assert.strictEqual(configWithStatus.config, undefined);
					assert.strictEqual(configWithStatus.status, "unconfigured");

					const newFilename = "foo.baz";
					const newConfigWithStatus =
						configs.getConfigWithStatus(newFilename);

					// check that returned objects are reused
					assert.strictEqual(newConfigWithStatus, configWithStatus);
				});

				it("for a file with a config", () => {
					const filename = "foo.js";
					const configWithStatus =
						configs.getConfigWithStatus(filename);
					const { config } = configWithStatus;

					assert(Object.isFrozen(configWithStatus));
					assert(config && typeof config === "object");
					assert.strictEqual(configWithStatus.status, "matched");
				});
			});
		});

		describe("getConfig()", () => {
			it("should throw an error when not normalized", () => {
				const filename = "foo.js";

				assert.throws(() => {
					unnormalizedConfigs.getConfig(filename);
				}, /normalized/u);
			});

			it("should calculate correct config when passed JS filename", () => {
				const filename = "foo.js";
				const config = configs.getConfig(filename);

				assert.strictEqual(config.language, JSLanguage);
				assert.strictEqual(typeof config.defs, "object");
				assert.strictEqual(config.defs.name, "config-array");
				assert.strictEqual(config.defs.universal, true);
				assert.strictEqual(config.defs.css, false);
			});

			it("should calculate correct config when passed XYZ filename", () => {
				const filename = "tests/.bar/foo.xyz";

				const config = configs.getConfig(filename);

				assert.strictEqual(typeof config.defs, "object");
				assert.strictEqual(config.defs.name, "config-array");
				assert.strictEqual(config.defs.universal, true);
				assert.strictEqual(config.defs.xyz, true);
			});

			it("should calculate correct config when passed HTML filename", () => {
				const filename = "foo.html";

				const config = configs.getConfig(filename);

				assert.strictEqual(typeof config.defs, "object");
				assert.strictEqual(config.defs.name, "HTML");
				assert.strictEqual(config.defs.universal, true);
			});

			it("should return undefined when passed ignored .gitignore filename", () => {
				const filename = ".gitignore";

				const config = configs.getConfig(filename);

				assert.strictEqual(config, undefined);
			});

			it("should calculate correct config when passed JS filename that matches two configs", () => {
				const filename = "foo.test.js";

				const config = configs.getConfig(filename);

				assert.strictEqual(config.language, JSLanguage);
				assert.strictEqual(typeof config.defs, "object");
				assert.strictEqual(config.defs.name, "config-array.test");
				assert.strictEqual(config.defs.css, false);
				assert.strictEqual(config.defs.universal, true);
			});

			it("should calculate correct config when passed JS filename that matches a function config", () => {
				const filename = "bar.test.js";

				const config = configs.getConfig(filename);

				assert.strictEqual(config.language, JSLanguage);
				assert.strictEqual(typeof config.defs, "object");
				assert.strictEqual(config.defs.name, "from-context");
				assert.strictEqual(config.defs.css, false);
				assert.strictEqual(config.defs.universal, true);
			});

			it("should not match a filename that doesn't explicitly match a files pattern", () => {
				const matchingFilename = "foo.js";
				const notMatchingFilename = "foo.md";
				configs = new ConfigArray(
					[
						{},
						{
							files: ["**/*.js"],
						},
					],
					{ basePath, schema },
				);

				configs.normalizeSync();

				const config1 = configs.getConfig(matchingFilename);
				assert.strictEqual(typeof config1, "object");

				const config2 = configs.getConfig(notMatchingFilename);
				assert.strictEqual(config2, undefined);
			});

			it("should match any filename with a config object that has `[]` in files", () => {
				configs = new ConfigArray(
					[
						{
							files: [[]],
							defs: {
								"test-def": "test-value",
							},
						},
						{
							files: ["**/*.js"], // `[]` is not an explicit match, so we need to add an explicit match
						},
					],
					{
						basePath,
						schema,
					},
				);

				configs.normalizeSync();

				assert.deepStrictEqual(configs.getConfig("foo/a.js"), {
					defs: {
						"test-def": "test-value",
					},
				});
			});

			it("should calculate correct config when passed JS filename that matches a async function config", () => {
				const configsToTest = createConfigArray();
				configsToTest.push(context =>
					Promise.resolve([
						{
							files: ["async.test.js"],
							defs: {
								name: `async-${context.name}`,
							},
						},
					]),
				);

				assert.throws(() => {
					configsToTest.normalizeSync();
				}, /Async config functions are not supported/u);
			});

			it("should throw an error when passed JS filename that matches a async function config and normalizeSync() is called", async () => {
				const filename = "async.test.js";
				const configsToTest = createConfigArray();
				configsToTest.push(context =>
					Promise.resolve([
						{
							files: ["async.test.js"],
							defs: {
								name: `async-${context.name}`,
							},
						},
					]),
				);

				await configsToTest.normalize({
					name: "from-context",
				});

				const config = configsToTest.getConfig(filename);

				assert.strictEqual(config.language, JSLanguage);
				assert.strictEqual(typeof config.defs, "object");
				assert.strictEqual(config.defs.name, "async-from-context");
				assert.strictEqual(config.defs.css, false);
				assert.strictEqual(config.defs.universal, true);
			});

			it("should throw an error when defs doesn't pass validation", async () => {
				const configsToTest = new ConfigArray(
					[
						{
							files: ["**/*.js"],
							defs: "foo",
							name: "bar",
						},
					],
					{ basePath, schema },
				);

				await configsToTest.normalize();

				const filename = "foo.js";
				assert.throws(() => {
					configsToTest.getConfig(filename);
				}, /Config "bar": Key "defs": Object expected./u);
			});

			it("should calculate correct config when passed JS filename that matches a function config returning an array", () => {
				const filename1 = "baz.test.js";
				const config1 = configs.getConfig(filename1);

				assert.strictEqual(typeof config1.defs, "object");
				assert.strictEqual(config1.language, JSLanguage);
				assert.strictEqual(config1.defs.name, "baz-from-context");

				const filename2 = "baz.test.js";
				const config2 = configs.getConfig(filename2);

				assert.strictEqual(config2.language, JSLanguage);
				assert.strictEqual(typeof config2.defs, "object");
				assert.strictEqual(config2.defs.name, "baz-from-context");
				assert.strictEqual(config2.defs.css, false);
			});

			it("should calculate correct config when passed CSS filename", () => {
				const filename = "foo.css";

				const config = configs.getConfig(filename);
				assert.strictEqual(config.language, CSSLanguage);
				assert.strictEqual(typeof config.defs, "object");
				assert.strictEqual(config.defs.name, "config-array");
				assert.strictEqual(config.defs.universal, true);
			});

			it("should calculate correct config when passed JS filename that matches AND pattern", () => {
				const filename = "foo.and.js";

				const config = configs.getConfig(filename);
				assert.strictEqual(config.language, JSLanguage);
				assert.strictEqual(typeof config.defs, "object");
				assert.strictEqual(config.defs.name, "AND operator");
				assert.strictEqual(config.defs.css, false);
				assert.strictEqual(config.defs.universal, true);
			});

			it("should return the same config when called with the same filename twice (caching)", () => {
				const filename = "foo.js";

				const config1 = configs.getConfig(filename);
				const config2 = configs.getConfig(filename);

				assert.strictEqual(config1, config2);
			});

			it("should return the same config when called with two filenames that match the same configs (caching)", () => {
				const filename1 = "foo1.js";
				const filename2 = "foo2.js";

				const config1 = configs.getConfig(filename1);
				const config2 = configs.getConfig(filename2);

				assert.strictEqual(config1, config2);
			});

			it("should return empty config when called with ignored node_modules filename", () => {
				const filename = "node_modules/foo.js";
				const config = configs.getConfig(filename);

				assert.strictEqual(config, undefined);
			});

			// https://github.com/eslint/eslint/issues/18597
			it("should correctly handle escaped characters in `files` patterns", () => {
				configs = new ConfigArray(
					[
						{
							files: ["src/\\{a,b}.js"],
							defs: {
								severity: "error",
							},
						},
					],
					{ basePath, schema },
				);

				configs.normalizeSync();

				assert.strictEqual(configs.getConfig("src/a.js"), undefined);
				assert.strictEqual(configs.getConfig("src/b.js"), undefined);
				assert.strictEqual(
					configs.getConfig("src/{a,b}.js").defs.severity,
					"error",
				);
			});

			it("should correctly handle escaped characters in `ignores` patterns", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
							ignores: ["src/\\{a,b}.js"],
							defs: {
								severity: "error",
							},
						},
					],
					{ basePath, schema },
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfig("src/a.js").defs.severity,
					"error",
				);
				assert.strictEqual(
					configs.getConfig("src/b.js").defs.severity,
					"error",
				);
				assert.strictEqual(
					configs.getConfig("src/{a,b}.js"),
					undefined,
				);
			});

			it("should correctly handle escaped characters in global `ignores` patterns", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
							defs: {
								severity: "error",
							},
						},
						{
							ignores: ["src/\\{a,b}.js"],
						},
					],
					{ basePath, schema },
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfig("src/a.js").defs.severity,
					"error",
				);
				assert.strictEqual(
					configs.getConfig("src/b.js").defs.severity,
					"error",
				);
				assert.strictEqual(
					configs.getConfig("src/{a,b}.js"),
					undefined,
				);
			});

			// https://github.com/eslint/eslint/issues/18706
			it("should disregard `/` in global `ignores`", () => {
				configs = new ConfigArray(
					[
						{
							ignores: ["/"],
						},
						{
							files: ["**/*.js"],
							defs: {
								severity: "error",
							},
						},
					],
					{ basePath, schema },
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfig("file.js").defs.severity,
					"error",
				);

				assert.strictEqual(
					configs.getConfig("subdir/file.js").defs.severity,
					"error",
				);
			});

			it("should return config for an unignored file in basePath when all files are initially ignored by '**'", () => {
				configs = new ConfigArray(
					[
						{
							ignores: ["**", "!file.js"],
						},
						{
							files: ["**/*.js"],
							defs: {
								severity: "error",
							},
						},
					],
					{ basePath, schema },
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfig("file.js").defs.severity,
					"error",
				);
			});

			// https://github.com/eslint/eslint/issues/17103
			describe("ignores patterns should be properly applied", () => {
				it("should return undefined when a filename matches an ignores pattern but not a files pattern", () => {
					const matchingFilename = "foo.js";
					const notMatchingFilename = "foo.md";
					configs = new ConfigArray(
						[
							{
								defs: {
									severity: "error",
								},
							},
							{
								ignores: ["**/*.md"],
								defs: {
									severity: "warn",
								},
							},
						],
						{ basePath, schema },
					);

					configs.normalizeSync();

					const config1 = configs.getConfig(matchingFilename);
					assert.strictEqual(config1, undefined);

					const config2 = configs.getConfig(notMatchingFilename);
					assert.strictEqual(config2, undefined);
				});

				it("should apply config with only ignores when a filename matches a files pattern", () => {
					const matchingFilename = "foo.js";
					const notMatchingFilename = "foo.md";
					configs = new ConfigArray(
						[
							{
								files: ["**/*.js"],
								defs: {
									severity: "error",
								},
							},
							{
								ignores: ["**/*.md"],
								defs: {
									severity: "warn",
								},
							},
						],
						{ basePath, schema },
					);

					configs.normalizeSync();

					const config1 = configs.getConfig(matchingFilename);
					assert.strictEqual(typeof config1, "object");
					assert.strictEqual(config1.defs.severity, "warn");

					const config2 = configs.getConfig(notMatchingFilename);
					assert.strictEqual(config2, undefined);
				});

				it("should not apply config with only ignores when a filename should be ignored", () => {
					const matchingFilename = "foo.js";
					const ignoredFilename = "bar.js";
					configs = new ConfigArray(
						[
							{
								files: ["**/*.js"],
								defs: {
									severity: "error",
								},
							},
							{
								ignores: ["**/bar.js"],
								defs: {
									severity: "warn",
								},
							},
						],
						{ basePath, schema },
					);

					configs.normalizeSync();

					const config1 = configs.getConfig(matchingFilename);
					assert.strictEqual(typeof config1, "object");
					assert.strictEqual(config1.defs.severity, "warn");

					const config2 = configs.getConfig(ignoredFilename);
					assert.strictEqual(typeof config2, "object");
					assert.strictEqual(config2.defs.severity, "error");
				});
			});

			// https://github.com/eslint/eslint/issues/18757
			describe("patterns with './' prefix", () => {
				it("should match patterns with './' prefix in `files` patterns", () => {
					configs = new ConfigArray(
						[
							{
								files: ["./src/*.js"],
								defs: { severity: "error" },
							},
						],
						{
							basePath,
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfig("src/foo.js").defs.severity,
						"error",
					);
				});

				it("should match patterns with './' prefix in `ignores` patterns", () => {
					configs = new ConfigArray(
						[
							{
								files: ["**/*.js"],
								ignores: ["./src/*.js"],
								defs: { severity: "error" },
							},
						],
						{
							basePath,
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfig("src/foo.js"),
						undefined,
					);
				});

				it("should match patterns with './' prefix in global `ignores` patterns", () => {
					configs = new ConfigArray(
						[
							{
								files: ["**/*.js"],
								defs: { severity: "error" },
							},
							{
								ignores: ["./src/*.js"],
							},
						],
						{
							basePath,
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfig("src/foo.js"),
						undefined,
					);
				});

				it("should match negated `files` patterns with './' prefix", () => {
					configs = new ConfigArray(
						[
							{
								files: ["!./src/*.js"],
								defs: { severity: "error" },
							},
						],
						{
							basePath,
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfig("src/foo.js"),
						undefined,
					);
				});

				it("should match negated `ignores` patterns with './' prefix", () => {
					configs = new ConfigArray(
						[
							{
								files: ["**/*.js"],
								ignores: ["**/*.js", "!./src/foo.js"],
								defs: { severity: "error" },
							},
						],
						{
							basePath,
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfig("src/foo.js").defs.severity,
						"error",
					);
				});

				it("should match negated global `ignores` patterns with './' prefix", () => {
					configs = new ConfigArray(
						[
							{
								files: ["**/*.js"],
								defs: { severity: "error" },
							},
							{
								ignores: ["**/*.js", "!./src/*.js"],
							},
						],
						{
							basePath,
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfig("src/foo.js").defs.severity,
						"error",
					);
				});

				it("should match nested `files` patterns with './' prefix", () => {
					configs = new ConfigArray(
						[
							{
								files: [["./src/*.js"]],
								defs: { severity: "error" },
							},
						],
						{
							basePath,
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfig("src/foo.js").defs.severity,
						"error",
					);
				});

				it("should match patterns with './' prefix in `files` patterns using normalize()", async () => {
					configs = new ConfigArray(
						[
							{
								files: ["./src/*.js"],
								defs: { severity: "error" },
							},
						],
						{
							basePath,
							schema,
						},
					);

					await configs.normalize();

					assert.strictEqual(
						configs.getConfig("src/foo.js").defs.severity,
						"error",
					);
				});
			});

			describe("POSIX character classes", () => {
				it("should match `files` patterns using [[:digit:]]", () => {
					configs = new ConfigArray(
						[
							{
								files: ["src/file[[:digit:]].js"],
								defs: { severity: "error" },
							},
						],
						{ basePath, schema },
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfig("src/file1.js").defs.severity,
						"error",
					);
					assert.strictEqual(
						configs.getConfig("src/file9.js").defs.severity,
						"error",
					);
					assert.strictEqual(
						configs.getConfig("src/filea.js"),
						undefined,
					);
					assert.strictEqual(
						configs.getConfig("src/file10.js"),
						undefined,
					);
				});

				it("should match `files` patterns using [[:alpha:]], [[:lower:]], and [[:upper:]]", () => {
					configs = new ConfigArray(
						[
							{
								files: ["alpha_[[:alpha:]].js"],
								defs: { kind: "alpha" },
							},
							{
								files: ["lower_[[:lower:]].js"],
								defs: { kind: "lower" },
							},
							{
								files: ["upper_[[:upper:]].js"],
								defs: { kind: "upper" },
							},
						],
						{ basePath, schema },
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfig("alpha_a.js").defs.kind,
						"alpha",
					);
					assert.strictEqual(
						configs.getConfig("alpha_Z.js").defs.kind,
						"alpha",
					);
					assert.strictEqual(
						configs.getConfig("lower_a.js").defs.kind,
						"lower",
					);
					assert.strictEqual(
						configs.getConfig("lower_Z.js"),
						undefined,
					);
					assert.strictEqual(
						configs.getConfig("upper_Z.js").defs.kind,
						"upper",
					);
					assert.strictEqual(
						configs.getConfig("upper_a.js"),
						undefined,
					);
				});

				it("should honor POSIX classes inside `ignores` patterns", () => {
					configs = new ConfigArray(
						[
							{
								files: ["**/*.js"],
								ignores: ["src/[[:digit:]]/**"],
								defs: { severity: "error" },
							},
						],
						{ basePath, schema },
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfig("src/3/file.js"),
						undefined,
					);
					assert.strictEqual(
						configs.getConfig("src/a/file.js").defs.severity,
						"error",
					);
				});

				it("should honor POSIX classes in global `ignores` patterns", () => {
					configs = new ConfigArray(
						[
							{
								ignores: ["[[:upper:]]"],
							},
							{
								files: ["**/*.js"],
								defs: { severity: "error" },
							},
						],
						{ basePath, schema },
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfig("A/file.js"),
						undefined,
					);
					assert.strictEqual(
						configs.getConfig("a/file.js").defs.severity,
						"error",
					);
				});
			});

			describe("config objects with `basePath` property", () => {
				it("should apply config object without `files` or `ignores` to the `basePath` directory and its subdirectories only (relative paths)", () => {
					configs = new ConfigArray(
						[
							{
								files: ["**/*.js"],
								defs: { severity: "warning" },
							},
							{
								basePath: "src",
								defs: { severity: "error" },
							},
						],
						{
							basePath,
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfig("foo.js").defs.severity,
						"warning",
					);
					assert.strictEqual(
						configs.getConfig("src/foo.js").defs.severity,
						"error",
					);
					assert.strictEqual(
						configs.getConfig("src/subdir/foo.js").defs.severity,
						"error",
					);
				});

				it("should apply config object without `files` or `ignores` to the `basePath` directory and its subdirectories only (absolute paths)", () => {
					configs = new ConfigArray(
						[
							{
								files: ["**/*.js"],
								defs: { severity: "warning" },
							},
							{
								basePath: "src",
								defs: { severity: "error" },
							},
						],
						{
							basePath,
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfig(path.resolve(basePath, "foo.js")).defs
							.severity,
						"warning",
					);
					assert.strictEqual(
						configs.getConfig(path.resolve(basePath, "src/foo.js"))
							.defs.severity,
						"error",
					);
					assert.strictEqual(
						configs.getConfig(
							path.resolve(basePath, "src/subdir/foo.js"),
						).defs.severity,
						"error",
					);
				});

				it("should intepret `files` and `ignores` as relative to the config's `basePath` (relative paths)", () => {
					configs = new ConfigArray(
						[
							{
								files: ["**/*.js"],
								defs: { severity: "warning" },
							},
							{
								basePath: "src",
								files: ["**/*.js"],
								defs: { severity: "error" },
							},
							{
								basePath: "src",
								ignores: ["foo.js"],
								defs: { severity: "fatal" },
							},
							{
								basePath: "src",
								files: ["**/*.js"],
								ignores: ["foo.js", "bar.js"],
								defs: { severity: "info" },
							},
							{
								basePath: "src",
								files: ["*.js"],
								ignores: ["{foo,bar,baz}.js"],
								defs: { severity: "log" },
							},
							{
								basePath: "src",
								files: ["quux.js"],
								defs: { severity: "catastrophic" },
							},
						],
						{
							basePath,
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfig("foo.js").defs.severity,
						"warning",
					);
					assert.strictEqual(
						configs.getConfig("bar.js").defs.severity,
						"warning",
					);
					assert.strictEqual(
						configs.getConfig("baz.js").defs.severity,
						"warning",
					);
					assert.strictEqual(
						configs.getConfig("qux.js").defs.severity,
						"warning",
					);
					assert.strictEqual(
						configs.getConfig("quux.js").defs.severity,
						"warning",
					);
					assert.strictEqual(
						configs.getConfig("subdir/quux.js").defs.severity,
						"warning",
					);
					assert.strictEqual(
						configs.getConfig("src/foo.js").defs.severity,
						"error",
					);
					assert.strictEqual(
						configs.getConfig("src/bar.js").defs.severity,
						"fatal",
					);
					assert.strictEqual(
						configs.getConfig("src/baz.js").defs.severity,
						"info",
					);
					assert.strictEqual(
						configs.getConfig("src/qux.js").defs.severity,
						"log",
					);
					assert.strictEqual(
						configs.getConfig("src/quux.js").defs.severity,
						"catastrophic",
					);
					assert.strictEqual(
						configs.getConfig("src/subdir/quux.js").defs.severity,
						"info",
					);
				});

				it("should intepret `files` and `ignores` as relative to the config's `basePath` (absolute paths)", () => {
					configs = new ConfigArray(
						[
							{
								files: ["**/*.js"],
								defs: { severity: "warning" },
							},
							{
								basePath: "src",
								files: ["**/*.js"],
								defs: { severity: "error" },
							},
							{
								basePath: "src",
								ignores: ["foo.js"],
								defs: { severity: "fatal" },
							},
							{
								basePath: "src",
								files: ["**/*.js"],
								ignores: ["foo.js", "bar.js"],
								defs: { severity: "info" },
							},
							{
								basePath: "src",
								files: ["*.js"],
								ignores: ["{foo,bar,baz}.js"],
								defs: { severity: "log" },
							},
							{
								basePath: "src",
								files: ["quux.js"],
								defs: { severity: "catastrophic" },
							},
						],
						{
							basePath,
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfig(path.resolve(basePath, "foo.js")).defs
							.severity,
						"warning",
					);
					assert.strictEqual(
						configs.getConfig(path.resolve(basePath, "bar.js")).defs
							.severity,
						"warning",
					);
					assert.strictEqual(
						configs.getConfig(path.resolve(basePath, "baz.js")).defs
							.severity,
						"warning",
					);
					assert.strictEqual(
						configs.getConfig(path.resolve(basePath, "qux.js")).defs
							.severity,
						"warning",
					);
					assert.strictEqual(
						configs.getConfig(path.resolve(basePath, "quux.js"))
							.defs.severity,
						"warning",
					);
					assert.strictEqual(
						configs.getConfig(
							path.resolve(basePath, "subdir/quux.js"),
						).defs.severity,
						"warning",
					);
					assert.strictEqual(
						configs.getConfig(path.resolve(basePath, "src/foo.js"))
							.defs.severity,
						"error",
					);
					assert.strictEqual(
						configs.getConfig(path.resolve(basePath, "src/bar.js"))
							.defs.severity,
						"fatal",
					);
					assert.strictEqual(
						configs.getConfig(path.resolve(basePath, "src/baz.js"))
							.defs.severity,
						"info",
					);
					assert.strictEqual(
						configs.getConfig(path.resolve(basePath, "src/qux.js"))
							.defs.severity,
						"log",
					);
					assert.strictEqual(
						configs.getConfig(path.resolve(basePath, "src/quux.js"))
							.defs.severity,
						"catastrophic",
					);
					assert.strictEqual(
						configs.getConfig(
							path.resolve(basePath, "src/subdir/quux.js"),
						).defs.severity,
						"info",
					);
				});

				it("should work correctly with both universal and non-universal `files` patterns (relative paths)", () => {
					configs = new ConfigArray(
						[
							{
								files: ["**/*.js"],
								defs: { severity: "warning" },
							},
							{
								basePath: "src",
								files: ["code/**", "docs/**/*.md"],
								defs: { severity: "error" },
							},
						],
						{
							basePath,
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfig("foo.js").defs.severity,
						"warning",
					);
					assert.strictEqual(configs.getConfig("foo.md"), undefined);
					assert.strictEqual(
						configs.getConfig("src/foo.js").defs.severity,
						"warning",
					);
					assert.strictEqual(
						configs.getConfig("src/foo.md"),
						undefined,
					);
					assert.strictEqual(
						configs.getConfig("src/code/foo.js").defs.severity,
						"error",
					);
					assert.strictEqual(
						configs.getConfig("src/code/foo.md"),
						undefined,
					);
					assert.strictEqual(
						configs.getConfig("src/docs/foo.js").defs.severity,
						"warning",
					);
					assert.strictEqual(
						configs.getConfig("src/docs/foo.md").defs.severity,
						"error",
					);
				});

				it("should work correctly with both universal and non-universal `files` patterns (absolute paths)", () => {
					configs = new ConfigArray(
						[
							{
								files: ["**/*.js"],
								defs: { severity: "warning" },
							},
							{
								basePath: "src",
								files: ["code/**", "docs/**/*.md"],
								defs: { severity: "error" },
							},
						],
						{
							basePath,
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfig(path.resolve(basePath, "foo.js")).defs
							.severity,
						"warning",
					);
					assert.strictEqual(
						configs.getConfig(path.resolve(basePath, "foo.md")),
						undefined,
					);
					assert.strictEqual(
						configs.getConfig(path.resolve(basePath, "src/foo.js"))
							.defs.severity,
						"warning",
					);
					assert.strictEqual(
						configs.getConfig(path.resolve(basePath, "src/foo.md")),
						undefined,
					);
					assert.strictEqual(
						configs.getConfig(
							path.resolve(basePath, "src/code/foo.js"),
						).defs.severity,
						"error",
					);
					assert.strictEqual(
						configs.getConfig(
							path.resolve(basePath, "src/code/foo.md"),
						),
						undefined,
					);
					assert.strictEqual(
						configs.getConfig(
							path.resolve(basePath, "src/docs/foo.js"),
						).defs.severity,
						"warning",
					);
					assert.strictEqual(
						configs.getConfig(
							path.resolve(basePath, "src/docs/foo.md"),
						).defs.severity,
						"error",
					);
				});
			});
		});

		describe("getConfigStatus()", () => {
			it("should throw an error when not normalized", () => {
				const filename = "foo.js";
				assert.throws(() => {
					unnormalizedConfigs.getConfigStatus(filename);
				}, /normalized/u);
			});

			it('should return "matched" when passed JS filename', () => {
				const filename = "foo.js";

				assert.strictEqual(
					configs.getConfigStatus(filename),
					"matched",
				);
			});

			it('should return "matched" when passed JS filename that starts with ".."', () => {
				const filename = "..foo.js";

				assert.strictEqual(
					configs.getConfigStatus(filename),
					"matched",
				);
			});

			it('should return "external" when passed JS filename in parent directory', () => {
				const filename = "../foo.js";

				assert.strictEqual(
					configs.getConfigStatus(filename),
					"external",
				);
			});

			it('should return "matched" when passed HTML filename', () => {
				const filename = "foo.html";

				assert.strictEqual(
					configs.getConfigStatus(filename),
					"matched",
				);
			});

			it('should return "ignored" when passed ignored .gitignore filename', () => {
				const filename = ".gitignore";

				assert.strictEqual(
					configs.getConfigStatus(filename),
					"ignored",
				);
			});

			it('should return "matched" when passed CSS filename', () => {
				const filename = "foo.css";

				assert.strictEqual(
					configs.getConfigStatus(filename),
					"matched",
				);
			});

			it('should return "unconfigured" when passed docx filename', () => {
				const filename = "sss.docx";

				assert.strictEqual(
					configs.getConfigStatus(filename),
					"unconfigured",
				);
			});

			it('should return "ignored" when passed ignored node_modules filename', () => {
				const filename = "node_modules/foo.js";

				assert.strictEqual(
					configs.getConfigStatus(filename),
					"ignored",
				);
			});

			it('should return "unconfigured" when passed matching both files and ignores in a config', () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.xsl"],
							ignores: ["fixtures/test.xsl"],
							defs: {
								xsl: true,
							},
						},
					],
					{ basePath },
				);

				configs.normalizeSync();
				const filename = "fixtures/test.xsl";

				assert.strictEqual(
					configs.getConfigStatus(filename),
					"unconfigured",
				);
			});

			it('should return "matched" when negated pattern comes after matching pattern', () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/foo.*"],
							ignores: ["**/*.txt", "!foo.txt"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("bar.txt"),
					"unconfigured",
				);
				assert.strictEqual(
					configs.getConfigStatus("foo.txt"),
					"matched",
				);
			});

			it('should return "ignored" when negated pattern comes before matching pattern', () => {
				configs = new ConfigArray(
					[
						{
							ignores: ["!foo.txt", "**/*.txt"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("bar.txt"),
					"ignored",
				);
				assert.strictEqual(
					configs.getConfigStatus("foo.txt"),
					"ignored",
				);
			});

			it('should return "matched" when matching files and ignores has a negated pattern after matching pattern', () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
							ignores: ["**/*.test.js", "!foo.test.js"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("bar.test.js"),
					"unconfigured",
				);
				assert.strictEqual(
					configs.getConfigStatus("foo.test.js"),
					"matched",
				);
			});

			it('should return "ignored" when file is inside of ignored directory', () => {
				configs = new ConfigArray(
					[
						{
							ignores: ["ignoreme"],
						},
						{
							files: ["**/*.js"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("ignoreme/foo.js"),
					"ignored",
				);
			});

			it('should return "matched" when file is inside of unignored directory', () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["foo/*", "!foo/bar"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("foo/bar/a.js"),
					"matched",
				);
			});

			it('should return "ignored" when file is ignored, unignored, and then reignored', () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["a.js", "!a*.js", "a.js"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.getConfigStatus("a.js"), "ignored");
			});

			it('should return "ignored" when the parent directory of a file is ignored', () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["foo"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("foo/bar/a.js"),
					"ignored",
				);
			});

			it('should "ignored" true when an ignored directory is later negated with **', () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["**/node_modules/**"],
						},
						{
							ignores: ["!node_modules/package/**"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("node_modules/package/a.js"),
					"ignored",
				);
			});

			it('should return "ignored" when an ignored directory is later negated with *', () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["**/node_modules/**"],
						},
						{
							ignores: ["!node_modules/package/*"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("node_modules/package/a.js"),
					"ignored",
				);
			});

			it('should return "unconfigured" when there are only patterns ending with /*', () => {
				configs = new ConfigArray(
					[
						{
							files: ["foo/*"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("foo/a.js"),
					"unconfigured",
				);
			});

			it('should return "unconfigured" when there are only patterns ending with /**', () => {
				configs = new ConfigArray(
					[
						{
							files: ["foo/**"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("foo/a.js"),
					"unconfigured",
				);
			});

			it('should return "unconfigured" when there is only * pattern', () => {
				configs = new ConfigArray(
					[
						{
							files: ["*"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("a.js"),
					"unconfigured",
				);
			});

			it('should return "matched" when files pattern matches and there is a pattern ending with /**', () => {
				configs = new ConfigArray(
					[
						{
							files: ["foo/*.js", "foo/**"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("foo/a.js"),
					"matched",
				);
			});

			it('should return "matched" when there is at least one non-universal match, "unconfigured" otherwise', () => {
				[
					[["**/*.js", "foo/**"]],
					[["foo/**", "**/*.js"]],
					[["**/*.js", "foo/**"], "bar/**"],
					[["foo/**", "**/*.js"], "bar/**"],
					[["bar/**"], "foo/*.js"],
					[[], "foo/*.js"],
					[["bar/**", "!bar/b.js"], "foo/*.js"],
					["!b.js", "foo/*.js"],
				].forEach(files => {
					configs = new ConfigArray(
						[
							{
								files,
							},
						],
						{
							basePath,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfigStatus("foo/a.js"),
						"matched",
					);

					assert.strictEqual(
						configs.getConfigStatus("bar/a.js"),
						"unconfigured",
					);
				});
			});

			it('should return "matched" when file has the same name as a directory that is ignored by a pattern that ends with `/`', () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/foo"],
						},
						{
							ignores: ["foo/"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.getConfigStatus("foo"), "matched");
			});

			it('should return "matched" when file is in the parent directory of directories that are ignored by a pattern that ends with `/`', () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["foo/*/"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("foo/a.js"),
					"matched",
				);
			});

			it('should return "ignored" when file is in a directory that is ignored by a pattern that ends with `/`', () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["foo/"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("foo/a.js"),
					"ignored",
				);
			});

			it('should return "ignored" when file is in a directory that is ignored by a pattern that does not end with `/`', () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["foo"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("foo/a.js"),
					"ignored",
				);
			});

			it('should return "matched" when file is in a directory that is ignored and then unignored by pattern that ends with `/`', () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["foo/", "!foo/"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("foo/a.js"),
					"matched",
				);
			});

			it('should return "ignored" when file is in a directory that is ignored along with its files by a pattern that ends with `/**` and then unignored by pattern that ends with `/`', () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: [
								"foo/**",

								// only the directory is unignored, files are not
								"!foo/",
							],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("foo/a.js"),
					"ignored",
				);
			});

			it('should return "ignored" when file is in a directory that is ignored along with its files by a pattern that ends with `/**` and then unignored by pattern that does not end with `/`', () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: [
								"foo/**",

								// only the directory is unignored, files are not
								"!foo",
							],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("foo/a.js"),
					"ignored",
				);
			});

			it('should return "matched" when file is in a directory that is ignored along its files by pattern that ends with `/**` and then unignored along its files by pattern that ends with `/**`', () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: [
								"foo/**",

								// both the directory and the files are unignored
								"!foo/**",
							],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("foo/a.js"),
					"matched",
				);
			});

			it('should return "ignored" when file is ignored by a pattern and there are unignore patterns that target files of a directory with the same name', () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/foo"],
						},
						{
							ignores: ["foo", "!foo/*", "!foo/**"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.getConfigStatus("foo"), "ignored");
			});

			it('should return "ignored" when file is in a directory that is ignored even if an unignore pattern that ends with `/*` matches the file', () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["foo", "!foo/*"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("foo/a.js"),
					"ignored",
				);
			});

			// https://github.com/eslint/eslint/issues/17964#issuecomment-1879840650
			it('should return "ignored" for all files ignored in a directory tree except for explicitly unignored ones', () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: [
								// ignore all files and directories
								"tests/format/**/*",

								// unignore all directories
								"!tests/format/**/*/",

								// unignore specific files
								"!tests/format/**/jsfmt.spec.js",
							],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.getConfigStatus("tests/format/foo.js"),
					"ignored",
				);
				assert.strictEqual(
					configs.getConfigStatus("tests/format/jsfmt.spec.js"),
					"matched",
				);
				assert.strictEqual(
					configs.getConfigStatus("tests/format/subdir/foo.js"),
					"ignored",
				);
				assert.strictEqual(
					configs.getConfigStatus(
						"tests/format/subdir/jsfmt.spec.js",
					),
					"matched",
				);
			});

			// https://github.com/eslint/eslint/pull/16579/files
			describe("gitignore-style unignores", () => {
				it('should return "ignored" when a subdirectory is ignored and then we try to unignore a directory', () => {
					configs = new ConfigArray(
						[
							{
								ignores: [
									"**/node_modules/*",
									"!node_modules/",
								],
							},
						],
						{ basePath },
					);

					configs.normalizeSync();
					const filename = "node_modules/foo/bar.js";

					assert.strictEqual(
						configs.getConfigStatus(filename),
						"ignored",
					);
				});

				it('should return "ignored" when a subdirectory is ignored and then we try to unignore a file', () => {
					configs = new ConfigArray(
						[
							{
								ignores: [
									"**/node_modules/*",
									"!node_modules/foo/*.js",
								],
							},
						],
						{ basePath },
					);

					configs.normalizeSync();
					const filename = "node_modules/foo/bar.js";

					assert.strictEqual(
						configs.getConfigStatus(filename),
						"ignored",
					);
				});

				it('should return "ignored" when all descendant directories are ignored and then we try to unignore a file', () => {
					configs = new ConfigArray(
						[
							{
								ignores: [
									"**/node_modules/**",
									"!node_modules/foo/*.js",
								],
							},
						],
						{ basePath },
					);

					configs.normalizeSync();
					const filename = "node_modules/foo/bar.js";

					assert.strictEqual(
						configs.getConfigStatus(filename),
						"ignored",
					);
				});

				it('should return "ignored" when all descendant directories are ignored without leading slash and then we try to unignore a file', () => {
					configs = new ConfigArray(
						[
							{
								ignores: [
									"**/node_modules/**",
									"!/node_modules/foo/**",
								],
							},
						],
						{ basePath },
					);

					configs.normalizeSync();
					const filename = "node_modules/foo/bar.js";

					assert.strictEqual(
						configs.getConfigStatus(filename),
						"ignored",
					);
				});
			});

			describe("POSIX character classes", () => {
				it("should return statuses for [[:digit:]] in `files` patterns", () => {
					configs = new ConfigArray(
						[{ files: ["src/file[[:digit:]].js"] }],
						{ basePath },
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfigStatus("src/file1.js"),
						"matched",
					);
					assert.strictEqual(
						configs.getConfigStatus("src/filea.js"),
						"unconfigured",
					);
					assert.strictEqual(
						configs.getConfigStatus("src/file10.js"),
						"unconfigured",
					);
				});

				it("should return 'unconfigured' for `ignores` using POSIX classes", () => {
					configs = new ConfigArray(
						[
							{
								files: ["**/*.js"],
								ignores: ["src/[[:digit:]]/**"],
							},
						],
						{ basePath },
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfigStatus("src/3/file.js"),
						"unconfigured",
					);
					assert.strictEqual(
						configs.getConfigStatus("src/a/file.js"),
						"matched",
					);
				});

				it("should return 'ignored' for global `ignores` using POSIX classes", () => {
					configs = new ConfigArray(
						[{ ignores: ["[[:upper:]]"] }, { files: ["**/*.js"] }],
						{ basePath },
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfigStatus("A/file.js"),
						"ignored",
					);
					assert.strictEqual(
						configs.getConfigStatus("a/file.js"),
						"matched",
					);
				});
			});

			describe("Windows paths", () => {
				it('should return "matched" for a file in the base directory with different capitalization', () => {
					configs = new ConfigArray([{ files: ["**/*.js"] }], {
						basePath: "C:\\DIR",
					});

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfigStatus("c:\\dir\\subdir\\file.js"),
						"matched",
					);
				});

				it('should return "external" for a file on a different drive', () => {
					configs = new ConfigArray([{ files: ["**/*.js"] }], {
						basePath: "C:\\dir",
					});

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfigStatus("D:\\dir\\file.js"),
						"external",
					);
				});

				it('should return "external" for a file with a UNC path on a different drive', () => {
					configs = new ConfigArray([{ files: ["**/*.js"] }], {
						basePath: "C:\\dir",
					});

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfigStatus("\\\\NAS\\Share\\file.js"),
						"external",
					);
				});

				it('should return "matched" for a file with a UNC path in the base directory', () => {
					configs = new ConfigArray([{ files: ["**/*.js"] }], {
						basePath: "\\\\NAS\\Share",
					});

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfigStatus("\\\\NAS\\Share\\dir\\file.js"),
						"matched",
					);
				});

				it('should return "matched" for a file with a namespaced path in the base directory', () => {
					configs = new ConfigArray([{ files: ["**/*.js"] }], {
						basePath: "C:\\dir",
					});

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfigStatus("\\\\?\\c:\\dir\\file.js"),
						"matched",
					);
				});

				it('should return "matched" for a file with a namespaced UNC path in the base directory', () => {
					configs = new ConfigArray([{ files: ["**/*.js"] }], {
						basePath: "\\\\NAS\\Share",
					});

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfigStatus(
							"\\\\?\\UNC\\NAS\\Share\\file.js",
						),
						"matched",
					);
				});

				it('should return "ignored" for a file with a namespaced path in a directory matched by a global ignore pattern', () => {
					configs = new ConfigArray(
						[{ files: ["**/*.js"] }, { ignores: ["dist"] }],
						{ basePath: "C:\\dir" },
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfigStatus(
							"\\\\?\\C:\\dir\\dist\\file.js",
						),
						"ignored",
					);
				});

				it('should return "unconfigured" for a file with a namespaced path matched by a non-global ignore pattern', () => {
					configs = new ConfigArray(
						[
							{
								files: ["**/*.js"],
								ignores: ["dist/**"],
							},
						],
						{ basePath: "C:\\dir" },
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfigStatus(
							"\\\\?\\C:\\dir\\dist\\file.js",
						),
						"unconfigured",
					);
				});
			});

			describe("config objects with `basePath` property", () => {
				it(`should return "matched" for a file that is matched by a non-universal pattern (relative paths)`, () => {
					configs = new ConfigArray(
						[
							{
								basePath: "src",
								files: ["code/*.js"],
							},
						],
						{
							basePath,
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfigStatus("code/foo.js"),
						"unconfigured",
					);
					assert.strictEqual(
						configs.getConfigStatus("src/foo.js"),
						"unconfigured",
					);
					assert.strictEqual(
						configs.getConfigStatus("src/code/foo.js"),
						"matched",
					);
				});

				it(`should return "matched" for a file that is matched by a non-universal pattern (absolute paths)`, () => {
					configs = new ConfigArray(
						[
							{
								basePath: "src",
								files: ["code/*.js"],
							},
						],
						{
							basePath,
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfigStatus(
							path.resolve(basePath, "code/foo.js"),
						),
						"unconfigured",
					);
					assert.strictEqual(
						configs.getConfigStatus(
							path.resolve(basePath, "src/foo.js"),
						),
						"unconfigured",
					);
					assert.strictEqual(
						configs.getConfigStatus(
							path.resolve(basePath, "src/code/foo.js"),
						),
						"matched",
					);
				});

				it(`should return "unconfigured" for a file under the config's base path if it isn't matched by a non-universal pattern (relative paths)`, () => {
					configs = new ConfigArray(
						[
							{
								basePath: "src",
							},
							{
								basePath: "src",
								files: ["*"],
							},
							{
								basePath: "src",
								files: ["!bar.js"],
							},
							{
								basePath: "src",
								files: ["code/*"],
							},
							{
								basePath: "src",
								files: ["code/**"],
							},
							{
								basePath: "src",
								files: ["!code/bar.js"],
							},
						],
						{
							basePath,
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfigStatus("src/foo.js"),
						"unconfigured",
					);
					assert.strictEqual(
						configs.getConfigStatus("src/code/foo.js"),
						"unconfigured",
					);
				});

				it(`should return "unconfigured" for a file under the config's base path if it isn't matched by a non-universal pattern (absolute paths)`, () => {
					configs = new ConfigArray(
						[
							{
								basePath: "src",
							},
							{
								basePath: "src",
								files: ["*"],
							},
							{
								basePath: "src",
								files: ["!bar.js"],
							},
							{
								basePath: "src",
								files: ["code/*"],
							},
							{
								basePath: "src",
								files: ["code/**"],
							},
							{
								basePath: "src",
								files: ["!code/bar.js"],
							},
						],
						{
							basePath,
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfigStatus(
							path.resolve(basePath, "src/foo.js"),
						),
						"unconfigured",
					);
					assert.strictEqual(
						configs.getConfigStatus(
							path.resolve(basePath, "src/code/foo.js"),
						),
						"unconfigured",
					);
				});

				it(`should return "external" for a file that is outside config array's base path even though it is inside config's base path`, () => {
					configs = new ConfigArray(
						[
							{
								basePath: "..",
								files: ["**/*.js"],
							},
							{
								basePath: "../",
								files: ["**/*.js"],
							},
							{
								basePath: "/",
								files: ["**/*.js"],
							},
							{
								basePath: "/project",
								files: ["**/*.js"],
							},
							{
								basePath: "/project/",
								files: ["**/*.js"],
							},
						],
						{
							basePath: "/project/my",
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfigStatus("/project/foo.js"),
						"external",
					);

					assert.strictEqual(
						configs.getConfigStatus("/project/notmy/foo.js"),
						"external",
					);

					assert.strictEqual(
						configs.getConfigStatus("/project/my/foo.js"),
						"matched",
					);
				});

				it(`should return "ignored" for a file that is ignored or in an ignored directory (relative paths)`, () => {
					configs = new ConfigArray(
						[
							{
								files: ["**/*.js"],
							},
							{
								basePath: "src",
								ignores: [
									"a.js",
									"tools/*.js",
									"code/b.js",
									"docs",
								],
							},
						],
						{
							basePath,
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfigStatus("src/a.js"),
						"ignored",
					);
					assert.strictEqual(
						configs.getConfigStatus("src/tools/foo.js"),
						"ignored",
					);
					assert.strictEqual(
						configs.getConfigStatus("src/code/b.js"),
						"ignored",
					);
					assert.strictEqual(
						configs.getConfigStatus("src/docs/foo.js"),
						"ignored",
					);
				});

				it(`should return "ignored" for a file that is ignored or in an ignored directory (absolute paths)`, () => {
					configs = new ConfigArray(
						[
							{
								files: ["**/*.js"],
							},
							{
								basePath: "src",
								ignores: [
									"a.js",
									"tools/*.js",
									"code/b.js",
									"docs",
								],
							},
						],
						{
							basePath,
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.getConfigStatus(
							path.resolve(basePath, "src/a.js"),
						),
						"ignored",
					);
					assert.strictEqual(
						configs.getConfigStatus(
							path.resolve(basePath, "src/tools/foo.js"),
						),
						"ignored",
					);
					assert.strictEqual(
						configs.getConfigStatus(
							path.resolve(basePath, "src/code/b.js"),
						),
						"ignored",
					);
					assert.strictEqual(
						configs.getConfigStatus(
							path.resolve(basePath, "src/docs/foo.js"),
						),
						"ignored",
					);
				});
			});
		});

		describe("isIgnored()", () => {
			it("should throw an error when not normalized", () => {
				const filename = "foo.js";
				assert.throws(() => {
					unnormalizedConfigs.isIgnored(filename);
				}, /normalized/u);
			});

			it("should return false when passed JS filename", () => {
				const filename = "foo.js";
				assert.strictEqual(configs.isIgnored(filename), false);
			});

			it("should return false when passed JS filename in parent directory", () => {
				const filename = "../foo.js";
				assert.strictEqual(configs.isIgnored(filename), false);
			});

			it("should return false when passed HTML filename", () => {
				const filename = "foo.html";
				assert.strictEqual(configs.isIgnored(filename), false);
			});

			it("should return true when passed ignored .gitignore filename", () => {
				const filename = ".gitignore";
				assert.strictEqual(configs.isIgnored(filename), true);
			});

			it("should return false when passed CSS filename", () => {
				const filename = "foo.css";

				assert.strictEqual(configs.isIgnored(filename), false);
			});

			it("should return false when passed docx filename", () => {
				const filename = "sss.docx";

				assert.strictEqual(configs.isIgnored(filename), false);
			});

			it("should return true when passed ignored node_modules filename", () => {
				const filename = "node_modules/foo.js";

				assert.strictEqual(configs.isIgnored(filename), true);
			});

			it("should return true when negated pattern comes before matching pattern", () => {
				configs = new ConfigArray(
					[
						{
							ignores: ["!foo.txt", "**/*.txt"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.isIgnored("bar.txt"), true);
				assert.strictEqual(configs.isIgnored("foo.txt"), true);
			});
		});

		describe("isFileIgnored()", () => {
			it("should throw an error when not normalized", () => {
				const filename = "foo.js";
				assert.throws(() => {
					unnormalizedConfigs.isFileIgnored(filename);
				}, /normalized/u);
			});

			it("should return false when passed JS filename", () => {
				const filename = "foo.js";

				assert.strictEqual(configs.isFileIgnored(filename), false);
			});

			it("should return false when passed JS filename in parent directory", () => {
				const filename = "../foo.js";

				assert.strictEqual(configs.isFileIgnored(filename), false);
			});

			it("should return false when passed HTML filename", () => {
				const filename = "foo.html";

				assert.strictEqual(configs.isFileIgnored(filename), false);
			});

			it("should return true when passed ignored .gitignore filename", () => {
				const filename = ".gitignore";

				assert.strictEqual(configs.isFileIgnored(filename), true);
			});

			it("should return false when passed CSS filename", () => {
				const filename = "foo.css";

				assert.strictEqual(configs.isFileIgnored(filename), false);
			});

			it("should return false when passed docx filename", () => {
				const filename = "sss.docx";

				assert.strictEqual(configs.isFileIgnored(filename), false);
			});

			it("should return true when passed ignored node_modules filename", () => {
				const filename = "node_modules/foo.js";

				assert.strictEqual(configs.isFileIgnored(filename), true);
			});

			it("should return true when negated pattern comes before matching pattern", () => {
				configs = new ConfigArray(
					[
						{
							ignores: ["!foo.txt", "**/*.txt"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored("bar.txt"), true);
				assert.strictEqual(configs.isFileIgnored("foo.txt"), true);
			});

			it("should return true when file is inside of ignored directory", () => {
				configs = new ConfigArray(
					[
						{
							ignores: ["ignoreme"],
						},
						{
							files: ["**/*.js"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.isFileIgnored("ignoreme/foo.js"),
					true,
				);
			});

			it("should return false when file is inside of unignored directory", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["foo/*", "!foo/bar"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.isFileIgnored("foo/bar/a.js"),
					false,
				);
			});

			it("should return true when file is ignored, unignored, and then reignored", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["a.js", "!a*.js", "a.js"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored("a.js"), true);
			});

			it("should return true when the parent directory of a file is ignored", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["foo"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored("foo/bar/a.js"), true);
			});

			it("should return true when an ignored directory is later negated with **", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["**/node_modules/**"],
						},
						{
							ignores: ["!node_modules/package/**"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.isFileIgnored("node_modules/package/a.js"),
					true,
				);
			});

			it("should return true when an ignored directory is later negated with *", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["**/node_modules/**"],
						},
						{
							ignores: ["!node_modules/package/*"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.isFileIgnored("node_modules/package/a.js"),
					true,
				);
			});

			it("should return false when file has the same name as a directory that is ignored by a pattern that ends with `/`", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/foo"],
						},
						{
							ignores: ["foo/"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored("foo"), false);
			});

			it("should return false when file is in the parent directory of directories that are ignored by a pattern that ends with `/`", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["foo/*/"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored("foo/a.js"), false);
			});

			it("should return true when file is in a directory that is ignored by a pattern that ends with `/`", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["foo/"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored("foo/a.js"), true);
			});

			it("should return true when file is in a directory that is ignored by a pattern that does not end with `/`", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["foo"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored("foo/a.js"), true);
			});

			it("should return false when file is in a directory that is ignored and then unignored by pattern that ends with `/`", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["foo/", "!foo/"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored("foo/a.js"), false);
			});

			it("should return true when file is in a directory that is ignored along with its files by a pattern that ends with `/**` and then unignored by pattern that ends with `/`", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: [
								"foo/**",

								// only the directory is unignored, files are not
								"!foo/",
							],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored("foo/a.js"), true);
			});

			it("should return true when file is in a directory that is ignored along with its files by a pattern that ends with `/**` and then unignored by pattern that does not end with `/`", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: [
								"foo/**",

								// only the directory is unignored, files are not
								"!foo",
							],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored("foo/a.js"), true);
			});

			it("should return false when file is in a directory that is ignored along its files by pattern that ends with `/**` and then unignored along its files by pattern that ends with `/**`", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: [
								"foo/**",

								// both the directory and the files are unignored
								"!foo/**",
							],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored("foo/a.js"), false);
			});

			it("should return true when file is ignored by a pattern and there are unignore patterns that target files of a directory with the same name", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/foo"],
						},
						{
							ignores: ["foo", "!foo/*", "!foo/**"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored("foo"), true);
			});

			it("should return true when file is in a directory that is ignored even if an unignore pattern that ends with `/*` matches the file", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["foo", "!foo/*"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored("foo/a.js"), true);
			});

			// https://github.com/eslint/eslint/issues/17964#issuecomment-1879840650
			it("should return true for all files ignored in a directory tree except for explicitly unignored ones", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: [
								// ignore all files and directories
								"tests/format/**/*",

								// unignore all directories
								"!tests/format/**/*/",

								// unignore specific files
								"!tests/format/**/jsfmt.spec.js",
							],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.isFileIgnored("tests/format/foo.js"),
					true,
				);
				assert.strictEqual(
					configs.isFileIgnored("tests/format/jsfmt.spec.js"),
					false,
				);
				assert.strictEqual(
					configs.isFileIgnored("tests/format/subdir/foo.js"),
					true,
				);
				assert.strictEqual(
					configs.isFileIgnored("tests/format/subdir/jsfmt.spec.js"),
					false,
				);
			});

			// https://github.com/eslint/eslint/pull/16579/files
			describe("gitignore-style unignores", () => {
				it("should return true when a subdirectory is ignored and then we try to unignore a directory", () => {
					configs = new ConfigArray(
						[
							{
								ignores: [
									"**/node_modules/*",
									"!node_modules/",
								],
							},
						],
						{ basePath },
					);

					configs.normalizeSync();
					const filename = "node_modules/foo/bar.js";

					assert.strictEqual(configs.isFileIgnored(filename), true);
				});

				it("should return true when a subdirectory is ignored and then we try to unignore a file", () => {
					configs = new ConfigArray(
						[
							{
								ignores: [
									"**/node_modules/*",
									"!node_modules/foo/*.js",
								],
							},
						],
						{ basePath },
					);

					configs.normalizeSync();
					const filename = "node_modules/foo/bar.js";

					assert.strictEqual(configs.isFileIgnored(filename), true);
				});

				it("should return true when all descendant directories are ignored and then we try to unignore a file", () => {
					configs = new ConfigArray(
						[
							{
								ignores: [
									"**/node_modules/**",
									"!node_modules/foo/*.js",
								],
							},
						],
						{ basePath },
					);

					configs.normalizeSync();
					const filename = "node_modules/foo/bar.js";

					assert.strictEqual(configs.isFileIgnored(filename), true);
				});

				it("should return true when all descendant directories are ignored without leading slash and then we try to unignore a file", () => {
					configs = new ConfigArray(
						[
							{
								ignores: [
									"**/node_modules/**",
									"!/node_modules/foo/**",
								],
							},
						],
						{ basePath },
					);

					configs.normalizeSync();
					const filename = "node_modules/foo/bar.js";

					assert.strictEqual(configs.isFileIgnored(filename), true);
				});
			});

			describe("config objects with `basePath` property", () => {
				it("should intepret `ignores` as relative to the config's `basePath` when ignoring directories (relative paths)", () => {
					configs = new ConfigArray(
						[
							{
								ignores: ["src/*"],
							},
							{
								basePath: "src",
								ignores: ["!bar"],
							},
							{
								basePath,
								ignores: ["!projects/my/src/baz/"],
							},
							{
								basePath: "tools",
								ignores: ["*", "!baz"],
							},
							{
								ignores: ["!tools/qux"],
							},
							{
								basePath: "scripts",
								ignores: ["qux", "quux"],
							},
							{
								basePath: path.resolve(basePath, "projects"),
								ignores: ["my/tests"],
							},
							{
								basePath: path.resolve(basePath, "projects"),
								ignores: ["**/.*"],
							},
							{
								basePath: path.resolve(basePath, "projects/my"),
								ignores: ["fixtures"],
							},
							{
								basePath: path.resolve(
									basePath,
									"projects/my/misc",
								),
								ignores: ["**/tmp", "bar"],
							},
						],
						{
							basePath: path.resolve(basePath, "projects/my"),
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(configs.isFileIgnored("a.js"), false);
					assert.strictEqual(
						configs.isFileIgnored("foo/a.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("src/foo/a.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored("src/bar/a.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("src/baz/a.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("tools/foo/a.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored("tools/baz/a.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("tools/qux/a.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("scripts/foo/a.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("scripts/qux/a.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored("scripts/quux/a.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored("tests/a.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(".coverage/a.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored("foo/.coverage/a.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored("fixtures/a.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored("tmp/a.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("foo/tmp/a.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("misc/foo/a.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("misc/bar/a.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored("misc/tmp/a.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored("misc/foo/tmp/a.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored("misc/foo/tmp/bar/a.js"),
						true,
					);
				});

				it("should intepret `ignores` as relative to the config's `basePath` when ignoring directories (absolute paths)", () => {
					configs = new ConfigArray(
						[
							{
								ignores: ["src/*"],
							},
							{
								basePath: "src",
								ignores: ["!bar"],
							},
							{
								basePath,
								ignores: ["!projects/my/src/baz/"],
							},
							{
								basePath: "tools",
								ignores: ["*", "!baz"],
							},
							{
								ignores: ["!tools/qux"],
							},
							{
								basePath: "scripts",
								ignores: ["qux", "quux"],
							},
							{
								basePath: path.resolve(basePath, "projects"),
								ignores: ["my/tests"],
							},
							{
								basePath: path.resolve(basePath, "projects"),
								ignores: ["**/.*"],
							},
							{
								basePath: path.resolve(basePath, "projects/my"),
								ignores: ["fixtures"],
							},
							{
								basePath: path.resolve(
									basePath,
									"projects/my/misc",
								),
								ignores: ["**/tmp", "bar"],
							},
						],
						{
							basePath: path.resolve(basePath, "projects/my"),
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(basePath, "projects/my", "a.js"),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"foo",
								"a.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"src/foo",
								"a.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"src/bar",
								"a.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"src/baz",
								"a.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"tools/foo",
								"a.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"tools/baz",
								"a.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"tools/qux",
								"a.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"scripts/foo",
								"a.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"scripts/qux",
								"a.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"scripts/quux",
								"a.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"tests",
								"a.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								".coverage",
								"a.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"foo/.coverage",
								"a.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"fixtures",
								"a.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"tmp",
								"a.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"foo/tmp",
								"a.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"misc/foo",
								"a.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"misc/bar",
								"a.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"misc/tmp",
								"a.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"misc/foo/tmp",
								"a.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"misc/foo/tmp/bar",
								"a.js",
							),
						),
						true,
					);
				});

				it("should intepret `ignores` as relative to the config's `basePath` when ignoring files (relative paths)", () => {
					configs = new ConfigArray(
						[
							{
								ignores: ["src/*"],
							},
							{
								basePath: "src",
								ignores: ["!a.js"],
							},
							{
								basePath,
								ignores: ["!projects/my/src/b.js"],
							},
							{
								basePath: "tools",
								ignores: ["*", "!a.js"],
							},
							{
								ignores: ["!tools/b.js"],
							},
							{
								basePath: "scripts",
								ignores: ["a.js", "b.js"],
							},
							{
								basePath: path.resolve(basePath, "projects"),
								ignores: ["my/tests"],
							},
							{
								basePath: path.resolve(basePath, "projects"),
								ignores: ["**/.*/**/*.js"],
							},
							{
								basePath: path.resolve(basePath, "projects/my"),
								ignores: ["fixtures/*.js"],
							},
							{
								basePath: path.resolve(
									basePath,
									"projects/my/misc",
								),
								ignores: ["**/tmp/*.js", "b.js"],
							},
						],
						{
							basePath: path.resolve(basePath, "projects/my"),
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(configs.isFileIgnored("a.js"), false);
					assert.strictEqual(configs.isFileIgnored("b.js"), false);
					assert.strictEqual(configs.isFileIgnored("c.js"), false);
					assert.strictEqual(
						configs.isFileIgnored("foo/a.js"),
						false,
					);
					assert.strictEqual(
						configs.isFileIgnored("foo/b.js"),
						false,
					);
					assert.strictEqual(
						configs.isFileIgnored("foo/c.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("src/a.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("src/b.js"),
						false,
					);

					assert.strictEqual(configs.isFileIgnored("src/c.js"), true);

					assert.strictEqual(
						configs.isFileIgnored("tools/a.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("tools/b.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("tools/c.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored("scripts/a.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored("scripts/b.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored("scripts/c.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("tests/a.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(".coverage/a.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored("foo/.coverage/a.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored("fixtures/a.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored("tmp/a.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("tmp/b.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("foo/tmp/a.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("foo/tmp/b.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("misc/a.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("misc/b.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored("misc/foo/a.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("misc/foo/b.js"),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored("misc/tmp/a.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored("misc/foo/tmp/a.js"),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored("misc/foo/tmp/bar/a.js"),
						false,
					);
				});

				it("should intepret `ignores` as relative to the config's `basePath` when ignoring files (absolute paths)", () => {
					configs = new ConfigArray(
						[
							{
								ignores: ["src/*"],
							},
							{
								basePath: "src",
								ignores: ["!a.js"],
							},
							{
								basePath,
								ignores: ["!projects/my/src/b.js"],
							},
							{
								basePath: "tools",
								ignores: ["*", "!a.js"],
							},
							{
								ignores: ["!tools/b.js"],
							},
							{
								basePath: "scripts",
								ignores: ["a.js", "b.js"],
							},
							{
								basePath: path.resolve(basePath, "projects"),
								ignores: ["my/tests"],
							},
							{
								basePath: path.resolve(basePath, "projects"),
								ignores: ["**/.*/**/*.js"],
							},
							{
								basePath: path.resolve(basePath, "projects/my"),
								ignores: ["fixtures/*.js"],
							},
							{
								basePath: path.resolve(
									basePath,
									"projects/my/misc",
								),
								ignores: ["**/tmp/*.js", "b.js"],
							},
						],
						{
							basePath: path.resolve(basePath, "projects/my"),
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(basePath, "projects/my", "a.js"),
						),
						false,
					);
					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(basePath, "projects/my", "b.js"),
						),
						false,
					);
					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(basePath, "projects/my", "c.js"),
						),
						false,
					);
					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"foo",
								"a.js",
							),
						),
						false,
					);
					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"foo",
								"b.js",
							),
						),
						false,
					);
					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"foo",
								"c.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"src",
								"a.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"src",
								"b.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"src",
								"c.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"tools",
								"a.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"tools",
								"b.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"tools",
								"c.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"scripts",
								"a.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"scripts",
								"b.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"scripts",
								"c.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"tests",
								"a.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								".coverage",
								"a.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"foo",
								".coverage",
								"a.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"fixtures",
								"a.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"tmp",
								"a.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"tmp",
								"b.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"foo",
								"tmp",
								"a.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"foo",
								"tmp",
								"b.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"misc",
								"a.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"misc",
								"b.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"misc",
								"foo",
								"a.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"misc",
								"foo",
								"b.js",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"misc",
								"tmp",
								"a.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"misc",
								"foo",
								"tmp",
								"a.js",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isFileIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"misc",
								"foo",
								"tmp",
								"bar",
								"a.js",
							),
						),
						false,
					);
				});
			});
		});

		describe("isDirectoryIgnored()", () => {
			it("should return true when a function return false in ignores", () => {
				configs = new ConfigArray(
					[
						{
							ignores: [
								directoryPath =>
									directoryPath.includes("node_modules"),
							],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.isDirectoryIgnored("node_modules"), // No trailing slash
					true,
				);
				assert.strictEqual(
					configs.isDirectoryIgnored("node_modules/"), // Trailing slash
					true,
				);
			});

			it("should always return false for basePath", () => {
				configs = new ConfigArray(
					[
						{
							ignores: ["**", "/"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored(basePath), false);
			});

			it("should return true when a directory is in ignores", () => {
				configs = new ConfigArray(
					[
						{
							ignores: ["**/node_modules"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.isDirectoryIgnored("node_modules"), // No trailing slash
					true,
				);
				assert.strictEqual(
					configs.isDirectoryIgnored("node_modules/"), // Trailing slash
					true,
				);
			});

			it("should return true when a directory with a trailing slash is in ignores", () => {
				configs = new ConfigArray(
					[
						{
							ignores: ["**/node_modules/"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.isDirectoryIgnored("node_modules"),
					true,
				);
				assert.strictEqual(
					configs.isDirectoryIgnored("node_modules/"), // Trailing slash
					true,
				);
			});

			it("should return true when a directory followed by ** is in ignores", () => {
				configs = new ConfigArray(
					[
						{
							ignores: ["**/node_modules/**"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.isDirectoryIgnored("node_modules"),
					true,
				);
				assert.strictEqual(
					configs.isDirectoryIgnored("node_modules/"),
					true,
				);
			});

			it("should return false when there is a files entry", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
							ignores: ["**/node_modules"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.isDirectoryIgnored("node_modules"),
					false,
				);
				assert.strictEqual(
					configs.isDirectoryIgnored("node_modules/"), // Trailing slash
					false,
				);
			});

			it("should return true when directory matches and there is a negated pattern", () => {
				configs = new ConfigArray(
					[
						{
							ignores: ["**/foo/", "!**/node_modules"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored("foo"), true);
				assert.strictEqual(
					configs.isDirectoryIgnored("foo/"), // Trailing slash
					true,
				);
			});

			it("should return false when directory doesn't match and there is a negated pattern", () => {
				configs = new ConfigArray(
					[
						{
							ignores: ["**/foo/", "!**/node_modules"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored("bar"), false);
				assert.strictEqual(
					configs.isDirectoryIgnored("bar/"), // Trailing slash
					false,
				);
			});

			it("should return false when ignored directory is unignored", () => {
				configs = new ConfigArray(
					[
						{
							ignores: ["foo/*", "!foo/bar"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.isDirectoryIgnored("foo/bar"),
					false,
				);
				assert.strictEqual(
					configs.isDirectoryIgnored("foo/bar/"),
					false,
				);
			});

			it("should return true when there is a directory relative to basePath in ignores", () => {
				configs = new ConfigArray(
					[
						{
							ignores: ["foo/bar"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored("foo/bar"), true);
				assert.strictEqual(
					configs.isDirectoryIgnored("foo/bar/"), // Trailing slash
					true,
				);
			});

			it("should throw an error when the config array isn't normalized", () => {
				configs = new ConfigArray(
					[
						{
							ignores: ["foo/bar"],
						},
					],
					{
						basePath,
					},
				);
				assert.throws(() => {
					configs.isDirectoryIgnored("/foo/bar");
				}, /normalized/u);
			});

			it("should return true when the directory is outside of the basePath", () => {
				configs = new ConfigArray(
					[
						{
							ignores: ["foo/bar"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.isDirectoryIgnored("../foo/bar"),
					true,
				);
			});

			it("should return true when the directory is the parent of the base path", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored(".."), true);
				assert.strictEqual(configs.isDirectoryIgnored("../"), true);
			});

			it("should return true when the parent directory of a directory is ignored", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["foo"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored("foo/bar"), true);
				assert.strictEqual(
					configs.isDirectoryIgnored("foo/bar/"),
					true,
				);
			});

			it("should return true when a directory in an ignored directory is later negated with **", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["**/node_modules/**"],
						},
						{
							ignores: [
								// this unignores  `node_modules/package/`, but its parent `node_modules/` is still ignored
								"!node_modules/package/**",
							],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.isDirectoryIgnored("node_modules/package"),
					true,
				);
				assert.strictEqual(
					configs.isDirectoryIgnored("node_modules/package/"),
					true,
				);
			});

			it("should return false when a directory is later negated with **", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["**/node_modules/**"],
						},
						{
							ignores: ["!node_modules/**"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.isDirectoryIgnored("node_modules"),
					false,
				);
				assert.strictEqual(
					configs.isDirectoryIgnored("node_modules/"),
					false,
				);
			});

			it("should return true when a directory's content is later negated with *", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["**/node_modules/**"],
						},
						{
							ignores: ["!node_modules/*"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.isDirectoryIgnored("node_modules"),
					true,
				);
				assert.strictEqual(
					configs.isDirectoryIgnored("node_modules/"),
					true,
				);
			});

			it("should return true when an ignored directory is later unignored with *", () => {
				configs = new ConfigArray(
					[
						{
							files: ["**/*.js"],
						},
						{
							ignores: ["**/node_modules/**"],
						},
						{
							ignores: ["!node_modules/package/*"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.isDirectoryIgnored("node_modules/package"),
					true,
				);
				assert.strictEqual(
					configs.isDirectoryIgnored("node_modules/package/"),
					true,
				);
			});

			// https://github.com/eslint/eslint/pull/16579/files
			describe("gitignore-style unignores", () => {
				it("should return false when first-level subdirectories are ignored and then one is negated", () => {
					configs = new ConfigArray(
						[
							{
								ignores: [
									"**/node_modules/*",
									"!**/node_modules/foo/",
								],
							},
						],
						{ basePath },
					);

					configs.normalizeSync();
					const directoryPath = "node_modules/foo";

					assert.strictEqual(
						configs.isDirectoryIgnored(directoryPath),
						false,
					);
				});

				it("should return false when attempting to ignore first-level subdirectories with leading slash", () => {
					configs = new ConfigArray(
						[
							{
								ignores: ["/**/node_modules/*"],
							},
						],
						{ basePath },
					);

					configs.normalizeSync();
					const directoryPath = "node_modules/foo";

					assert.strictEqual(
						configs.isDirectoryIgnored(directoryPath),
						false,
					);
				});

				it("should return true when all descendant subdirectories are ignored and then one is negated", () => {
					configs = new ConfigArray(
						[
							{
								ignores: [
									"**/node_modules/**",
									"!**/node_modules/foo/",
								],
							},
						],
						{ basePath },
					);

					configs.normalizeSync();
					const directoryPath = "node_modules/foo";

					assert.strictEqual(
						configs.isDirectoryIgnored(directoryPath),
						true,
					);
				});

				it("should return true when all descendant subdirectories are ignored and then other descendants are negated", () => {
					configs = new ConfigArray(
						[
							{
								ignores: [
									"**/node_modules/**",
									"!**/node_modules/foo/**",
								],
							},
						],
						{ basePath },
					);

					configs.normalizeSync();
					const directoryPath = "node_modules/foo";

					assert.strictEqual(
						configs.isDirectoryIgnored(directoryPath),
						true,
					);
				});
			});

			describe("config objects with `basePath` property", () => {
				it("should intepret `ignores` as relative to the config's `basePath` (relative paths)", () => {
					configs = new ConfigArray(
						[
							{
								ignores: ["src/*"],
							},
							{
								basePath: "src",
								ignores: ["!bar"],
							},
							{
								basePath,
								ignores: ["!projects/my/src/baz/"],
							},
							{
								basePath: "tools",
								ignores: ["*", "!baz"],
							},
							{
								ignores: ["!tools/qux"],
							},
							{
								basePath: "scripts",
								ignores: ["qux", "quux"],
							},
							{
								basePath: path.resolve(basePath, "projects"),
								ignores: ["my/tests"],
							},
							{
								basePath: path.resolve(basePath, "projects"),
								ignores: ["**/.*"],
							},
							{
								basePath: path.resolve(basePath, "projects/my"),
								ignores: ["fixtures"],
							},
							{
								basePath: path.resolve(
									basePath,
									"projects/my/misc",
								),
								ignores: ["**/tmp", "bar"],
							},
						],
						{
							basePath: path.resolve(basePath, "projects/my"),
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.isDirectoryIgnored("foo"),
						false,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored("src/foo"),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored("src/bar"),
						false,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored("src/baz"),
						false,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored("tools/foo"),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored("tools/baz"),
						false,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored("tools/qux"),
						false,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored("scripts/foo"),
						false,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored("scripts/qux"),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored("scripts/quux"),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored("tests"),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(".coverage"),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored("foo/.coverage"),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored("fixtures"),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored("tmp"),
						false,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored("foo/tmp"),
						false,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored("misc/foo"),
						false,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored("misc/bar"),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored("misc/tmp"),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored("misc/foo/tmp"),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored("misc/foo/tmp/bar"),
						true,
					);
				});

				it("should intepret `ignores` as relative to the config's `basePath` (absolute paths)", () => {
					configs = new ConfigArray(
						[
							{
								ignores: ["src/*"],
							},
							{
								basePath: "src",
								ignores: ["!bar"],
							},
							{
								basePath,
								ignores: ["!projects/my/src/baz/"],
							},
							{
								basePath: "tools",
								ignores: ["*", "!baz"],
							},
							{
								ignores: ["!tools/qux"],
							},
							{
								basePath: "scripts",
								ignores: ["qux", "quux"],
							},
							{
								basePath: path.resolve(basePath, "projects"),
								ignores: ["my/tests"],
							},
							{
								basePath: path.resolve(basePath, "projects"),
								ignores: ["**/.*"],
							},
							{
								basePath: path.resolve(basePath, "projects/my"),
								ignores: ["fixtures"],
							},
							{
								basePath: path.resolve(
									basePath,
									"projects/my/misc",
								),
								ignores: ["**/tmp", "bar"],
							},
						],
						{
							basePath: path.resolve(basePath, "projects/my"),
							schema,
						},
					);

					configs.normalizeSync();

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(basePath, "projects/my", "foo"),
						),
						false,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(basePath, "projects/my", "src/foo"),
						),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(basePath, "projects/my", "src/bar"),
						),
						false,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(basePath, "projects/my", "src/baz"),
						),
						false,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(basePath, "projects/my", "tools/foo"),
						),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(basePath, "projects/my", "tools/baz"),
						),
						false,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(basePath, "projects/my", "tools/qux"),
						),
						false,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"scripts/foo",
							),
						),
						false,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"scripts/qux",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"scripts/quux",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(basePath, "projects/my", "tests"),
						),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(basePath, "projects/my", ".coverage"),
						),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"foo/.coverage",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(basePath, "projects/my", "fixtures"),
						),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(basePath, "projects/my", "tmp"),
						),
						false,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(basePath, "projects/my", "foo/tmp"),
						),
						false,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(basePath, "projects/my", "misc/foo"),
						),
						false,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(basePath, "projects/my", "misc/bar"),
						),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(basePath, "projects/my", "misc/tmp"),
						),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"misc/foo/tmp",
							),
						),
						true,
					);

					assert.strictEqual(
						configs.isDirectoryIgnored(
							path.resolve(
								basePath,
								"projects/my",
								"misc/foo/tmp/bar",
							),
						),
						true,
					);
				});
			});
		});

		describe("files", () => {
			it("should throw an error when not normalized", () => {
				assert.throws(() => {
					unnormalizedConfigs.files; // eslint-disable-line no-unused-expressions -- testing whether getter throws
				}, /normalized/u);
			});

			it("should return all string pattern file from all configs when called", () => {
				const expectedFiles = configs.reduce((list, config) => {
					if (config.files) {
						list.push(...config.files);
					}

					return list;
				}, []);
				const files = configs.files;
				assert.deepStrictEqual(files, expectedFiles);
			});
		});

		describe("ignores", () => {
			it("should throw an error when not normalized", () => {
				assert.throws(() => {
					unnormalizedConfigs.ignores; // eslint-disable-line no-unused-expressions -- testing whether getter throws
				}, /normalized/u);
			});

			it("should return all ignores from all configs without files when called", () => {
				const expectedIgnores = configs.reduce((list, config) => {
					if (config.ignores && Object.keys(config).length === 1) {
						list.push(config);
					}

					return list;
				}, []);
				const ignores = configs.ignores;
				assert.deepStrictEqual(ignores, expectedIgnores);
			});

			it("should ignore name field for when considering global ignores", () => {
				configs = new ConfigArray(
					[
						{
							name: "foo",
							ignores: ["ignoreme"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.strictEqual(
					configs.isFileIgnored("ignoreme/foo.js"),
					true,
				);
				assert.deepStrictEqual(configs.ignores, [
					{
						name: "foo",
						ignores: ["ignoreme"],
					},
				]);
			});

			it("should ignore basePath field when considering global ignores", () => {
				configs = new ConfigArray(
					[
						{
							basePath: "src",
							ignores: ["ignoreme1"],
						},
						{
							name: "foo",
							basePath: "tools",
							ignores: ["ignoreme2"],
						},
					],
					{
						basePath,
					},
				);

				configs.normalizeSync();

				assert.deepStrictEqual(configs.ignores, [
					{
						basePath: path.toNamespacedPath(
							path.join(basePath, "src"),
						),
						ignores: ["ignoreme1"],
					},
					{
						name: "foo",
						basePath: path.toNamespacedPath(
							path.join(basePath, "tools"),
						),
						ignores: ["ignoreme2"],
					},
				]);
			});
		});

		describe("push()", () => {
			it("should throw an error when normalized", () => {
				// Note: In Node.js the error message contains the word "extensible"
				// In Bun the error message contains the word "readonly"
				assert.throws(() => {
					configs.push({});
				}, /extensible|readonly/u);
			});
		});
	});
});
