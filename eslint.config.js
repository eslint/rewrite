import eslintConfigESLint from "eslint-config-eslint";
import { defineConfig } from "@eslint/config-helpers";
import tseslint from "typescript-eslint";

export default defineConfig([
	{
		ignores: ["**/tests/fixtures/", "**/dist/", "**/coverage/"],
	},

	{
		files: ["**/*.js"],
		extends: [eslintConfigESLint],
		rules: {
			// disable rules we don't want to use from eslint-config-eslint
			"no-undefined": "off",
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
