/**
 * @fileoverview Type tests for ESLint Config Helpers.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import {
	defineConfig,
	type ConfigWithExtends,
	type ExtensionConfigObject,
	globalIgnores,
} from "@eslint/config-helpers";

//-----------------------------------------------------------------------------
// Tests for ConfigWithExtends
//-----------------------------------------------------------------------------

// #region ConfigWithExtends

({ extends: [] }) satisfies ConfigWithExtends;
({ basePath: "." }) satisfies ConfigWithExtends;
({ extends: ["js/recommended"] }) satisfies ConfigWithExtends;

({
	extends: [{ rules: { "no-console": "off" } }],
}) satisfies ConfigWithExtends;

({
	extends: [[{ rules: { "no-console": "off" } }]],
}) satisfies ConfigWithExtends;

({
	extends: ["js/recommended", [{ rules: { "no-console": "off" } }]],
}) satisfies ConfigWithExtends;

// @ts-expect-error -- `extends` must be an array
({ extends: "js/recommended" }) satisfies ConfigWithExtends;

// @ts-expect-error -- nested string arrays in `extends` are not supported
({ extends: [["js/recommended"]] }) satisfies ConfigWithExtends;

// @ts-expect-error -- 'basePath' in `extends` is not allowed
({ extends: [{ basePath: "." }] }) satisfies ConfigWithExtends;

// @ts-expect-error -- nested 'extends' is not allowed
({ extends: [{ extends: [] }] }) satisfies ConfigWithExtends;

({
	// @ts-expect-error -- nested arrays in `extends` may only contain config objects
	extends: [[{ rules: { "no-console": "off" as const } }, "js/recommended"]],
}) satisfies ConfigWithExtends;

// #endregion ConfigWithExtends

//-----------------------------------------------------------------------------
// Tests for defineConfig()
//-----------------------------------------------------------------------------

// #region defineConfig

// @ts-expect-error -- defineConfig() requires at least one argument
defineConfig();

// @ts-expect-error -- configs must be objects
defineConfig(1);

defineConfig({});
defineConfig({}, {});
defineConfig([]);
defineConfig([], {});
defineConfig([{}]);
defineConfig([globalIgnores(["node_modules"])], []);

defineConfig({
	extends: [],
});

defineConfig({
	basePath: "my-base-path",
});

defineConfig(globalIgnores(["node_modules"]));

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

defineConfig([
	{
		settings: {
			react: {
				version: "detect",
			},
		},
	},
]);

defineConfig(
	{
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
	},
	globalIgnores(["node_modules"]),
);

defineConfig({
	// @ts-expect-error -- `extends` must be an array
	extends: "js/recommended",
});

defineConfig({
	// @ts-expect-error -- `extends` must be an array
	extends: { rules: { "no-console": "off" } },
});

defineConfig({
	// @ts-expect-error -- nested string arrays in `extends` are not supported
	extends: [["js/recommended"]],
});

defineConfig({
	// @ts-expect-error -- 'basePath' in `extends` is not allowed
	extends: [{ basePath: "." }],
});

defineConfig({
	// @ts-expect-error -- nested 'extends' is not allowed
	extends: [{ extends: [] }],
});

const configWithNestedExtends = {
	extends: [],
	rules: { "no-console": "off" },
} satisfies ConfigWithExtends;

defineConfig({
	// @ts-expect-error -- nested 'extends' is not allowed
	extends: [configWithNestedExtends],
});

defineConfig({
	plugins: {
		"some-plugin": {
			rules: {
				"some-rule": {
					meta: {
						docs: {
							recommended: "not a boolean!",
						},
					},

					create() {
						return {};
					},
				},
			},
		},
	},
});

// #endregion defineConfig

//-----------------------------------------------------------------------------
// Tests for ExtensionConfigObject
//-----------------------------------------------------------------------------

// #region ExtensionConfigObject

({ rules: { "no-console": "off" } }) satisfies ExtensionConfigObject;

// @ts-expect-error -- `basePath` is not allowed on extended config objects
({ basePath: "." }) satisfies ExtensionConfigObject;

// @ts-expect-error -- nested 'extends' is not allowed on extended config objects
({ extends: [] }) satisfies ExtensionConfigObject;

// @ts-expect-error -- nested 'extends' is not allowed on extended config objects
configWithNestedExtends satisfies ExtensionConfigObject;

// #endregion ExtensionConfigObject

//-----------------------------------------------------------------------------
// Tests for globalIgnores()
//-----------------------------------------------------------------------------

// #region globalIgnores

globalIgnores(["node_modules"]);
globalIgnores(["dist", "build"], "my name");

// @ts-expect-error -- ignorePatterns must be an array of strings
globalIgnores("node_modules");

// @ts-expect-error -- ignorePatterns must be an array of strings
globalIgnores([1]);

// @ts-expect-error -- name must be a string
globalIgnores(["node_modules"], 1);

// #endregion globalIgnores
