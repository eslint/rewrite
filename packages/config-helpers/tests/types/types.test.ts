/**
 * @fileoverview Type tests for ESLint Config Helpers.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import {
	defineConfig,
	type Config,
	type ConfigWithExtends,
	type ExtensionConfigObject,
	globalIgnores,
	includeIgnoreFile,
	convertIgnorePatternToMinimatch,
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

// @ts-expect-error -- configs must be objects
defineConfig(1);

defineConfig({});
defineConfig({}, {});
defineConfig([]);
defineConfig([], {});
defineConfig([{}]);
defineConfig([globalIgnores(["node_modules"])], []);

declare const recommendedConfigs: Config[];

defineConfig(...recommendedConfigs, {
	linterOptions: { noInlineConfig: true },
});

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

//-----------------------------------------------------------------------------
// Tests for includeIgnoreFile()
//-----------------------------------------------------------------------------

// #region includeIgnoreFile

// string path should return a single config object

includeIgnoreFile(".gitignore").ignores;
includeIgnoreFile(".gitignore", {}).ignores;
includeIgnoreFile(".gitignore", { gitignoreResolution: true, name: "falafel" })
	.ignores;

// array of string paths should return an array of config objects
includeIgnoreFile([".gitignore", ".eslintignore"]).map(
	config => config.ignores,
);

declare const pathOrPaths: string | string[];
includeIgnoreFile(pathOrPaths, { gitignoreResolution: true, name: "falafel" });

// prettier-ignore
includeIgnoreFile(pathOrPaths, { gitignoreResolution: true, name: "falafel" })
	// @ts-expect-error -- return type shouldn't be able to access field of config object
	.ignores;
includeIgnoreFile(pathOrPaths, {
	gitignoreResolution: true,
	name: "falafel",
})
	// @ts-expect-error -- return type shouldn't be able to access array method
	.map(config => config.ignores);

// should be able to provide a string options argument for compatibility reasons.
includeIgnoreFile("foo", "string-name");

// @ts-expect-error -- options should not be a number.
includeIgnoreFile("foo", 22);

// #endregion includeIgnoreFile

//-----------------------------------------------------------------------------
// Tests for convertIgnorePatternToMinimatch()
//-----------------------------------------------------------------------------

// #region convertIgnorePatternToMinimatch

// should be string => string.
convertIgnorePatternToMinimatch("foo") satisfies string;

// @ts-expect-error -- input should be a string.
convertIgnorePatternToMinimatch(12345);

// #endregion convertIgnorePatternToMinimatch
