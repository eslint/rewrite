/**
 * @fileoverview Fixup tests
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

describe("@eslint/compat", () => {
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
		it("should throw an error when a relative path is passed", () => {
			const ignoreFilePath =
				"../tests/fixtures/ignore-files/gitignore1.txt";
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
});
