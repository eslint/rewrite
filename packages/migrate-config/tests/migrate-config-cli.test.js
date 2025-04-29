/**
 * @fileoverview Fixup tests
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import assert from "node:assert";
import fsp from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const filePaths = [
	"basic-eslintrc/basic-eslintrc.yml",
	"prisma-js/.eslintrc.cjs",
	"reveal-md/.eslintrc",
	"release-it/.eslintrc.json",
	"formidable-js/.eslintrc.cjs",
	"backend-nx-skeleton-js/.eslintrc.cjs",
	"backend-nx-skeleton-esm-js/.eslintrc.mjs",
	"no-globals-for-env/.eslintrc.yml",
	"overrides-extends/.eslintrc.json",
	"plugins-dedupe/.eslintrc.yml",
	"gitignore-simple/.eslintrc.json",
	"gitignore-complex/.eslintrc.json",
	"import-duplicate-js/.eslintrc.cjs",
	"slash-package/.eslintrc.json",
].map(file => `tests/fixtures/${file}`);

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * Normalizes line endings in a string.
 * @param {string} text The text to normalize.
 * @returns {string} The normalized text.
 */
function normalizeLineEndings(text) {
	return text.replace(/\r\n/gu, "\n");
}

/**
 * Asserts that two files have the same contents.
 * @param {string} resultPath The path to the actual file.
 * @param {string} expectedPath The path to the expected file.
 * @returns {Promise<void>}
 * @throws {AssertionError} If the files do not have the same contents.
 */
async function assertFilesEqual(resultPath, expectedPath) {
	const expected = await fsp.readFile(expectedPath, "utf8");
	const actual = await fsp.readFile(resultPath, "utf8");
	assert.strictEqual(
		normalizeLineEndings(actual),
		normalizeLineEndings(expected),
		`Files ${resultPath} and ${expectedPath} do not have the same contents`,
	);
}

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("@eslint/migrate-config", async () => {
	for (const filePath of filePaths) {
		const fileBaseName = path.basename(filePath);
		const fileBaseNameWithoutExt = fileBaseName.replace(/\.\w+$/u, "");
		const isESLintRC = fileBaseName.startsWith(".eslintrc");
		const fixturePath = path.dirname(filePath);
		const expectedMjsPath = `${fixturePath}/expected.mjs`;
		const expectedCjsPath = `${fixturePath}/expected.cjs`;
		const resultMjsPath = `${fixturePath}/${isESLintRC ? "eslint.config.mjs" : `${fileBaseNameWithoutExt}.mjs`}`;
		const resultCjsPath = `${fixturePath}/${isESLintRC ? "eslint.config.cjs" : `${fileBaseNameWithoutExt}.cjs`}`;

		it(`should migrate ${filePath}`, async () => {
			// Note: Using execSync instead of exec due to race conditions

			const gitignoreFlag = filePath.includes("gitignore")
				? "--gitignore"
				: "";

			// JS files must always use the format that matches the original file
			if (fixturePath.endsWith("-js")) {
				const resultPath = `${fixturePath}/eslint.config${path.extname(filePath)}`;
				const expectedPath = `${fixturePath}/expected${path.extname(filePath)}`;

				execSync(
					`node src/migrate-config-cli.js ${filePath} ${gitignoreFlag}`,
					{ stdio: "inherit" },
				);

				// check the cjs file
				await assertFilesEqual(resultPath, expectedPath);
				return;
			}

			// run the migration for mjs
			execSync(
				`node src/migrate-config-cli.js ${filePath} ${gitignoreFlag}`,
				{ stdio: "inherit" },
			);

			// check the mjs file
			await assertFilesEqual(resultMjsPath, expectedMjsPath);

			// run the migration for cjs
			execSync(
				`node src/migrate-config-cli.js ${filePath} --commonjs  ${gitignoreFlag}`,
			);

			// check the cjs file
			await assertFilesEqual(resultCjsPath, expectedCjsPath);
		});
	}
});
