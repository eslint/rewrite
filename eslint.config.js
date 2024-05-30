import js from "@eslint/js";

export default [
	js.configs.recommended,
	{
		ignores: ["**/tests/fixtures/**/*.*"],
	},
	{
		files: ["**/*.test.js"],
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
