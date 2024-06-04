import eslintConfigESLint from "eslint-config-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintPluginJSDoc = eslintConfigESLint.find(
	config => config.plugins?.jsdoc,
).plugins.jsdoc;

export default [
	{
		ignores: ["**/tests/fixtures/", "**/dist/"],
	},

	...eslintConfigESLint,

	// disable rules that are unnecessary or might conflict with Prettier
	eslintConfigPrettier,

	{
		rules: {
			// disable additional deprecated rules
			"padding-line-between-statements": "off",
			"spaced-comment": "off",

			// disable rules we don't want to use from eslint-config-eslint
			"no-undefined": "off",

			// TODO: re-enable eslint-plugin-jsdoc rules
			...Object.fromEntries(
				Object.keys(eslintPluginJSDoc.rules).map(name => [
					`jsdoc/${name}`,
					"off",
				]),
			),

			// re-enable `curly`, because when configured with "all", it doesn't conflict with prettier
			// https://github.com/prettier/eslint-config-prettier?tab=readme-ov-file#curly
			curly: ["error", "all"],

			// re-enable `no-unexpected-multiline`, because this rule catches possible errors.
			// When it conflicts with Prettier formatting, first check if your code is valid,
			// then use `// eslint-disable-next-line no-unexpected-multiline`.
			// https://github.com/prettier/eslint-config-prettier?tab=readme-ov-file#no-unexpected-multiline
			"no-unexpected-multiline": "error",
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
];
