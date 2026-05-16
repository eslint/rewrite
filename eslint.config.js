import eslintConfigESLint from "eslint-config-eslint";
import { defineConfig, includeIgnoreFile } from "@eslint/config-helpers";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "node:url";
import path from "node:path";

const eslintPluginJSDoc = eslintConfigESLint.find(
	config => config.plugins?.jsdoc,
).plugins.jsdoc;

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default defineConfig([
	includeIgnoreFile(path.join(dirname, ".gitignore"), {
		gitignoreResolution: true,
	}),

	{
		ignores: ["**/tests/fixtures/"],
	},

	{
		extends: [eslintConfigESLint],
		rules: {
			// disable rules we don't want to use from eslint-config-eslint
			"no-undefined": "off",

			// TODO: re-enable eslint-plugin-jsdoc rules
			...Object.fromEntries(
				Object.keys(eslintPluginJSDoc.rules).map(name => [
					`jsdoc/${name}`,
					"off",
				]),
			),
		},
	},

	// Tools and CLI
	{
		files: [
			"scripts/**",
			"tools/**",
			"packages/migrate-config/src/migrate-config-cli.js",
		],
		rules: {
			"no-console": "off",
			"n/no-process-exit": "off",
		},
	},

	{
		files: ["**/tests/**"],
		languageOptions: {
			globals: {
				describe: "readonly",
				xdescribe: "readonly",
				it: "readonly",
				xit: "readonly",
				beforeEach: "readonly",
				afterEach: "readonly",
				before: "readonly",
				after: "readonly",
			},
		},
	},

	// TypeScript
	...tseslint.config({
		files: ["**/*.ts"],
		ignores: ["**/tests/**/*.ts"],
		extends: [...tseslint.configs.strict, ...tseslint.configs.stylistic],
		rules: {
			"no-use-before-define": "off",
		},
	}),
]);
