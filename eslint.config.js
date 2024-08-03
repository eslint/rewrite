import eslintConfigESLint from "eslint-config-eslint";
import tseslint from "typescript-eslint";

const eslintPluginJSDoc = eslintConfigESLint.find(
	config => config.plugins?.jsdoc,
).plugins.jsdoc;

export default [
	{
		ignores: ["**/tests/fixtures/", "**/dist/", "**/coverage/"],
	},

	...eslintConfigESLint,

	{
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

	// Typescript
	// {
	// 	files: ["**/*.ts"],
	// 	...tseslint.configs.recommended[0],
	// 	rules: {
	// 		...tseslint.configs.recommended[1].rules,
	// 		...tseslint.configs.recommended[2].rules,
	// 	},
	// },
	...tseslint.config({
		files: ["**/*.ts"],
		extends: tseslint.configs.recommended,
	}),
];
