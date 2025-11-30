import eslintConfigESLint from "eslint-config-eslint";
import globals from "globals";
import { defineConfig, globalIgnores } from "@eslint/config-helpers";
import tseslint from "typescript-eslint";

export default defineConfig([
	globalIgnores(
		["**/tests/fixtures/", "**/dist/", "**/coverage/"],
		"rewrite/global-ignores",
	),
	{
		name: "rewrite/js",
		files: ["**/*.js"],
		extends: [eslintConfigESLint],
		rules: {
			// disable rules we don't want to use from eslint-config-eslint
			"no-undefined": "off",
		},
	},
	{
		name: "rewrite/tools",
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
		name: "rewrite/tests",
		files: ["**/tests/**"],
		languageOptions: {
			globals: {
				...globals.mocha,
			},
		},
	},
	{
		name: "rewrite/ts",
		files: ["**/*.ts"],
		ignores: ["**/tests/**/*.ts"],
		extends: [tseslint.configs.strict, tseslint.configs.stylistic],
		rules: {
			"no-use-before-define": "off",
		},
	},
]);
