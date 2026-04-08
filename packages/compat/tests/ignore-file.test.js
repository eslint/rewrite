/**
 * @filedescription Fixup tests
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import assert from "node:assert";
import {
	includeIgnoreFile,
	ignoreFilesWithGitAttribute,
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

	describe("ignoreFilesWithGitAttribute", () => {
		it("should throw an error when a relative path is passed", () => {
			const gitattributesPath =
				"../tests/fixtures/ignore-files/gitattributes1.txt";
			assert.throws(() => {
				ignoreFilesWithGitAttribute(
					gitattributesPath,
					"linguist-generated",
				);
			}, /The ignore file location must be an absolute path./u);
		});

		it("should return patterns matching a bare attribute (set)", () => {
			const gitattributesPath = fileURLToPath(
				new URL(
					"../tests/fixtures/ignore-files/gitattributes1.txt",
					import.meta.url,
				),
			);
			const result = ignoreFilesWithGitAttribute(
				gitattributesPath,
				"linguist-generated",
			);
			assert.deepStrictEqual(result, {
				name: "Imported .gitattributes patterns for linguist-generated",
				ignores: ["generated/*.js", "build/*.js", "output/*.js"],
			});
		});

		it("should match attribute with =true as truthy", () => {
			const gitattributesPath = fileURLToPath(
				new URL(
					"../tests/fixtures/ignore-files/gitattributes1.txt",
					import.meta.url,
				),
			);
			const result = ignoreFilesWithGitAttribute(
				gitattributesPath,
				"linguist-generated",
			);
			assert.ok(result.ignores.includes("build/*.js"));
		});

		it("should not match unset attribute (-attr)", () => {
			const gitattributesPath = fileURLToPath(
				new URL(
					"../tests/fixtures/ignore-files/gitattributes1.txt",
					import.meta.url,
				),
			);
			const result = ignoreFilesWithGitAttribute(
				gitattributesPath,
				"linguist-generated",
			);
			assert.ok(!result.ignores.includes("lib/*.js"));
		});

		it("should not match attribute with =false", () => {
			const gitattributesPath = fileURLToPath(
				new URL(
					"../tests/fixtures/ignore-files/gitattributes1.txt",
					import.meta.url,
				),
			);
			const result = ignoreFilesWithGitAttribute(
				gitattributesPath,
				"linguist-generated",
			);
			assert.ok(!result.ignores.includes("dist/*.js"));
		});

		it("should not match attribute with non-truthy value", () => {
			const gitattributesPath = fileURLToPath(
				new URL(
					"../tests/fixtures/ignore-files/gitattributes1.txt",
					import.meta.url,
				),
			);
			const result = ignoreFilesWithGitAttribute(
				gitattributesPath,
				"linguist-generated",
			);
			assert.ok(!result.ignores.includes("tmp/*.js"));
		});

		it("should match attribute with exact value using name=value syntax", () => {
			const gitattributesPath = fileURLToPath(
				new URL(
					"../tests/fixtures/ignore-files/gitattributes1.txt",
					import.meta.url,
				),
			);
			const result = ignoreFilesWithGitAttribute(
				gitattributesPath,
				"custom=myvalue",
			);
			assert.deepStrictEqual(result, {
				name: "Imported .gitattributes patterns for custom=myvalue",
				ignores: ["docs/*.js"],
			});
		});

		it("should not match bare attribute when using name=value syntax", () => {
			const gitattributesPath = fileURLToPath(
				new URL(
					"../tests/fixtures/ignore-files/gitattributes1.txt",
					import.meta.url,
				),
			);
			const result = ignoreFilesWithGitAttribute(
				gitattributesPath,
				"linguist-generated=true",
			);
			// Only build/*.js has linguist-generated=true, not the bare ones
			assert.deepStrictEqual(result, {
				name: "Imported .gitattributes patterns for linguist-generated=true",
				ignores: ["build/*.js"],
			});
		});

		it("should return an object with a custom name", () => {
			const gitattributesPath = fileURLToPath(
				new URL(
					"../tests/fixtures/ignore-files/gitattributes1.txt",
					import.meta.url,
				),
			);
			const result = ignoreFilesWithGitAttribute(
				gitattributesPath,
				"linguist-vendored",
				"Custom Name",
			);
			assert.deepStrictEqual(result, {
				name: "Custom Name",
				ignores: ["vendor/**/*"],
			});
		});

		it("should return empty ignores when no patterns match", () => {
			const gitattributesPath = fileURLToPath(
				new URL(
					"../tests/fixtures/ignore-files/gitattributes1.txt",
					import.meta.url,
				),
			);
			const result = ignoreFilesWithGitAttribute(
				gitattributesPath,
				"nonexistent",
			);
			assert.deepStrictEqual(result, {
				name: "Imported .gitattributes patterns for nonexistent",
				ignores: [],
			});
		});

		it("should convert patterns using convertIgnorePatternToMinimatch", () => {
			const gitattributesPath = fileURLToPath(
				new URL(
					"../tests/fixtures/ignore-files/gitattributes1.txt",
					import.meta.url,
				),
			);
			const result = ignoreFilesWithGitAttribute(
				gitattributesPath,
				"linguist-vendored",
			);
			// vendor/** should become vendor/**/* via convertIgnorePatternToMinimatch
			assert.deepStrictEqual(result.ignores, ["vendor/**/*"]);
		});
	});
});
