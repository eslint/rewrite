/**
 * @fileoverview Tests for `includeIgnoreFile()` and `convertIgnorePatternToMinimatch()`
 * @author Nicholas C. Zakas
 * @author Kirk Waiblinger
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import assert from "node:assert";
import {
	includeIgnoreFile,
	convertIgnorePatternToMinimatch,
} from "../src/ignore-file.js";
import { fileURLToPath } from "node:url";

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

const gitignore1FixturePathRelative =
	"../tests/fixtures/ignore-files/gitignore1.txt";
const gitignore1FixturePathAbsolute = fileURLToPath(
	import.meta.resolve(gitignore1FixturePathRelative),
);
const gitignore1FixtureDir = fileURLToPath(
	import.meta.resolve("../tests/fixtures/ignore-files"),
);

describe("@eslint/config-helpers", () => {
	describe("convertIgnorePatternToMinimatch", () => {
		const tests = [
			["", ""],
			["**", "**"],
			["/**", "/**"],
			["**/", "**/"],
			["src/", "**/src/"],
			["src", "**/src"],
			["src/**", "src/**/*"],
			["!src/", "!**/src/"],
			["!src", "!**/src"],
			["!src/**", "!src/**/*"],
			["*/foo.js", "*/foo.js"],
			["*/foo.js/", "*/foo.js/"],
			["src/{a,b}.js", "src/\\{a,b}.js"],
			["src/?(a)b.js", "src/?\\(a)b.js"],
			["{.js", "**/\\{.js"],
			["(.js", "**/\\(.js"],
			["(.js", "**/\\(.js"],
			["{(.js", "**/\\{\\(.js"],
			["{bar}/{baz}", "\\{bar}/\\{baz}"],
			["\\[foo]/{bar}/{baz}", "\\[foo]/\\{bar}/\\{baz}"],
			["src/\\{a}", "src/\\{a}"],
			["src/\\(a)", "src/\\(a)"],
			["src/\\{a}/{b}", "src/\\{a}/\\{b}"],
			["src/\\(a)/(b)", "src/\\(a)/\\(b)"],
			["a\\bc{de(f\\gh\\{i\\(j{(", "**/a\\bc\\{de\\(f\\gh\\{i\\(j\\{\\("],
		];

		tests.forEach(([pattern, expected]) => {
			it(`should convert "${pattern}" to "${expected}"`, () => {
				assert.strictEqual(
					convertIgnorePatternToMinimatch(pattern),
					expected,
				);
			});
		});
	});

	describe("includeIgnoreFile", () => {
		it("should throw an error when an array of relative paths is passed", () => {
			assert.throws(
				() => {
					includeIgnoreFile([gitignore1FixturePathRelative]);
				},
				{
					name: "Error",
					message:
						/The ignore file location must be an absolute path. Received .*/u,
				},
			);
		});

		it("should return an object with an `ignores` property", () => {
			const result = includeIgnoreFile(gitignore1FixturePathAbsolute, {
				gitignoreResolution: true,
			});

			assert.deepStrictEqual(result, {
				name: "Imported .gitignore patterns",
				ignores: [
					"**/node_modules",
					"!fixtures/node_modules",
					"dist",
					"**/*.log",
					"**/.cache/",
					".vuepress/dist",
					"*/foo.js",
					"dir/**/*",
				],
				basePath: gitignore1FixtureDir,
			});
		});

		it("should return an object with a custom name", () => {
			const result = includeIgnoreFile(
				gitignore1FixturePathAbsolute,
				"Custom Name",
			);
			assert.deepStrictEqual(result, {
				name: "Custom Name",
				ignores: [
					"**/node_modules",
					"!fixtures/node_modules",
					"dist",
					"**/*.log",
					"**/.cache/",
					".vuepress/dist",
					"*/foo.js",
					"dir/**/*",
				],
			});
		});

		it("should handle when both name and gitignoreResolution are specified", () => {
			const result = includeIgnoreFile(
				[gitignore1FixturePathAbsolute, gitignore1FixturePathAbsolute],
				{
					gitignoreResolution: true,
					name: "Custom Name",
				},
			);
			assert.deepStrictEqual(result, [
				{
					name: "Custom Name (0)",
					basePath: gitignore1FixtureDir,
					ignores: [
						"**/node_modules",
						"!fixtures/node_modules",
						"dist",
						"**/*.log",
						"**/.cache/",
						".vuepress/dist",
						"*/foo.js",
						"dir/**/*",
					],
				},
				{
					name: "Custom Name (1)",
					basePath: gitignore1FixtureDir,
					ignores: [
						"**/node_modules",
						"!fixtures/node_modules",
						"dist",
						"**/*.log",
						"**/.cache/",
						".vuepress/dist",
						"*/foo.js",
						"dir/**/*",
					],
				},
			]);
		});

		// convert above to for ... of loop
		for (const value of [true, 1, 123n, [1, 2, 3]]) {
			it(`should throw an error when the second argument is ${value}`, () => {
				assert.throws(
					() => {
						includeIgnoreFile(gitignore1FixturePathAbsolute, value);
					},
					{
						name: "TypeError",
						message:
							/The options argument to `includeIgnoreFile\(\)` should be an object or a string./u,
					},
				);
			});
		}
	});
});

// These tests are copied from @eslint/compat and ensure that the `includeIgnoreFile` is a superset of the
// functionality of the `includeIgnoreFile` in `@eslint/compat`.
describe("`includeIgnoreFile` compat with @eslint/compat", () => {
	it("should throw an error when a relative path is passed", () => {
		const ignoreFilePath = "../tests/fixtures/ignore-files/gitignore1.txt";
		assert.throws(() => {
			includeIgnoreFile(ignoreFilePath);
		}, /The ignore file location must be an absolute path./u);
	});

	it("should return an object with an `ignores` property", () => {
		const ignoreFilePath = fileURLToPath(
			new URL(
				"../tests/fixtures/ignore-files/gitignore1.txt",
				import.meta.url,
			),
		);
		const result = includeIgnoreFile(ignoreFilePath);
		assert.deepStrictEqual(result, {
			name: "Imported .gitignore patterns",
			ignores: [
				"**/node_modules",
				"!fixtures/node_modules",
				"dist",
				"**/*.log",
				"**/.cache/",
				".vuepress/dist",
				"*/foo.js",
				"dir/**/*",
			],
		});
	});

	it("should return an object with a custom name", () => {
		const ignoreFilePath = fileURLToPath(
			new URL(
				"../tests/fixtures/ignore-files/gitignore1.txt",
				import.meta.url,
			),
		);
		const result = includeIgnoreFile(ignoreFilePath, "Custom Name");
		assert.deepStrictEqual(result, {
			name: "Custom Name",
			ignores: [
				"**/node_modules",
				"!fixtures/node_modules",
				"dist",
				"**/*.log",
				"**/.cache/",
				".vuepress/dist",
				"*/foo.js",
				"dir/**/*",
			],
		});
	});
});
