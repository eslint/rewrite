/**
 * @fileoverview Type tests for ESLint Config Helpers.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { defineConfig } from "@eslint/config-helpers";

//-----------------------------------------------------------------------------
// Type Checking
//-----------------------------------------------------------------------------

defineConfig({});
defineConfig({}, {});
defineConfig([]);
defineConfig([], {});
defineConfig([], []);
defineConfig([{}]);
defineConfig({
	extends: [],
});

defineConfig({
	rules: {
		"no-console": "error",
	},
});

defineConfig({
	languageOptions: {
		ecmaVersion: 2020,
	},
});

defineConfig({
	extends: [
		"js/recommended",
		"react/recommended",
		{ rules: { "no-console": "off" } },
	],
});

defineConfig({
	settings: {
		react: {
			version: "detect",
		},
	},
});

defineConfig({
	extends: [
		[
			[{ rules: { "no-alert": "warn" } }],
			{ rules: { "no-debugger": "error" } },
		],
		[
			{ rules: { "no-eval": "error" } },
			{ rules: { "no-implied-eval": "error" } },
		],
	],
});
