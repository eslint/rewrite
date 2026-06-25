/**
 * @fileoverview Type tests for Config Array package.
 * @author Francesco Trotta
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import {
	ConfigArray,
	ConfigArraySymbol,
	type ConfigObject,
	type ExtraConfigType,
	type FileMatcher,
	type FilesMatcher,
} from "@eslint/config-array";

//-----------------------------------------------------------------------------
// Tests for ExtraConfigType
//-----------------------------------------------------------------------------

// #region ExtraConfigType

const extraConfigTypeArray: ExtraConfigType = "array";
const extraConfigTypeFunction: ExtraConfigType = "function";

// @ts-expect-error -- Invalid extra config type
const invalidExtraConfigType: ExtraConfigType = "object";

// #endregion ExtraConfigType

//-----------------------------------------------------------------------------
// Tests for FileMatcher
//-----------------------------------------------------------------------------

// #region FileMatcher

const globMatcher: FileMatcher = "**/*.js";
const functionMatcher: FileMatcher = filePath => filePath.endsWith(".js");

// @ts-expect-error -- Invalid matcher type
const invalidMatcher: FileMatcher = 123;

// @ts-expect-error -- Matcher functions must return a boolean
const invalidMatcherFunction: FileMatcher = filePath => filePath;

// #endregion FileMatcher

//-----------------------------------------------------------------------------
// Tests for FilesMatcher
//-----------------------------------------------------------------------------

// #region FilesMatcher

const filesMatcherGlob: FilesMatcher = "**/*.js";
const filesMatcherFunction: FilesMatcher = filePath => filePath.endsWith(".md");
const filesMatcherSubarray: FilesMatcher = ["*.test.*", "*.js"];
const filesMatcherSubarrayMixed: FilesMatcher = [
	"*.test.*",
	filePath => filePath.endsWith(".js"),
];

// @ts-expect-error -- Invalid matcher type
const invalidFilesMatcher: FilesMatcher = 123;

// @ts-expect-error -- Nested arrays are not valid file matchers
const invalidFilesMatcherNestedArray: FilesMatcher = [["*.js"]];

// #endregion FilesMatcher

//-----------------------------------------------------------------------------
// Tests for ConfigObject
//-----------------------------------------------------------------------------

// #region ConfigObject

const emptyConfig: ConfigObject = {};

const configWithFiles: ConfigObject = {
	files: ["**/*.js"],
};

const configWithFilesFunction: ConfigObject = {
	files: [filePath => filePath.endsWith(".md")],
};

const configWithFilesSubarray: ConfigObject = {
	files: [["*.test.*", "*.js"]],
};

const configWithIgnores: ConfigObject = {
	ignores: ["**/node_modules/**", filePath => filePath.includes("dist")],
};

const configWithMetadataAndExtras: ConfigObject = {
	name: "Test config",
	basePath: "src",
	files: ["**/*.js"],
	rules: { "no-console": "error" },
};

// @ts-expect-error -- `files` must be an array
const invalidConfigFilesNotArray: ConfigObject = { files: "**/*.js" };

// @ts-expect-error -- Invalid matcher type
const invalidConfigFilesItem: ConfigObject = { files: [123] };

// @ts-expect-error -- Invalid matcher type
const invalidConfigFilesSubarrayItem: ConfigObject = { files: [["*.js", 123]] };

// @ts-expect-error -- `ignores` does not accept subarrays
const invalidConfigIgnoresSubarray: ConfigObject = { ignores: [["*.js"]] };

// @ts-expect-error -- Invalid matcher type
const invalidConfigIgnoresItem: ConfigObject = { ignores: [123] };

// #endregion ConfigObject

//-----------------------------------------------------------------------------
// Tests for ConfigArraySymbol
//-----------------------------------------------------------------------------

// #region ConfigArraySymbol

ConfigArraySymbol.isNormalized satisfies symbol;
ConfigArraySymbol.configCache satisfies symbol;
ConfigArraySymbol.schema satisfies symbol;
ConfigArraySymbol.finalizeConfig satisfies symbol;
ConfigArraySymbol.preprocessConfig satisfies symbol;

// @ts-expect-error -- ConfigArraySymbol keys are symbols
const invalidConfigArraySymbolKey: string = ConfigArraySymbol.isNormalized;

// #endregion ConfigArraySymbol

//-----------------------------------------------------------------------------
// Tests for ConfigArray
//-----------------------------------------------------------------------------

// #region ConfigArray

new ConfigArray([]);
new ConfigArray([], { basePath: "/" });
new ConfigArray([], { basePath: "/", extraConfigTypes: ["array", "function"] });
new ConfigArray([], { basePath: "/", extraConfigTypes: ["array"] });
new ConfigArray([], {
	basePath: "/",
	schema: {
		name: {
			required: true,
			merge: "replace",
			validate: "string",
		},
	},
});
new ConfigArray([], { normalized: true });

// @ts-expect-error -- basePath must be a string
new ConfigArray([], { basePath: 123 });

// @ts-expect-error -- normalized must be a boolean
new ConfigArray([], { normalized: "yes" });

// @ts-expect-error -- Invalid extra config type
new ConfigArray([], { basePath: "/", extraConfigTypes: ["object"] });

// @ts-expect-error -- schema must be an object definition
new ConfigArray([], { basePath: "/", schema: "schema" });

new ConfigArray([], {
	basePath: "/",
	schema: {
		handler: {
			required: true,
			merge(a, b) {
				return b ?? a;
			},
			validate(value) {
				if (typeof value !== "function") {
					throw new TypeError("Function expected.");
				}
			},
		},
	},
});

new ConfigArray([], {
	basePath: "/",
	schema: {
		handler: {
			required: true,
			// @ts-expect-error -- invalid schema strategy
			merge: "invalid",
			validate: "string",
		},
	},
});

const unnormalizedConfigArray = new ConfigArray([], { basePath: "/" });
unnormalizedConfigArray.normalize() satisfies Promise<ConfigArray>;
unnormalizedConfigArray.normalizeSync() satisfies ConfigArray;

const context = { name: "MyApp" };
const unnormalizedConfigArrayWithContext = new ConfigArray([], {
	basePath: "/",
});
unnormalizedConfigArrayWithContext.normalize(
	context,
) satisfies Promise<ConfigArray>;
unnormalizedConfigArrayWithContext.normalizeSync(context) satisfies ConfigArray;

const multidimensionalConfigArray = new ConfigArray(
	[
		[
			{
				files: ["**/*.js"],
			},
			[
				{
					files: [["*.test.*", "*.js"]],
				},
			],
		],
	],
	{ basePath: "/", extraConfigTypes: ["array"] },
).normalizeSync();

multidimensionalConfigArray.files satisfies FilesMatcher[];

type ConfigFunctionContext = { extension: string };

const syncConfigFunction = (ctx: ConfigFunctionContext): ConfigObject => ({
	files: [`**/*.${ctx.extension}`],
	// Extra properties are allowed.
	contextValue: ctx.extension,
});

new ConfigArray(syncConfigFunction, {
	basePath: "/",
	extraConfigTypes: ["function"],
}).normalizeSync({ extension: "js" });

new ConfigArray(syncConfigFunction, {
	basePath: "/",
	extraConfigTypes: ["function"],
}).normalize({ extension: "js" }) satisfies Promise<ConfigArray>;

const asyncConfigFunction = async (
	ctx: ConfigFunctionContext,
): Promise<ConfigObject> => ({
	files: [`**/*.${ctx.extension}`],
});

new ConfigArray(asyncConfigFunction, {
	basePath: "/",
	extraConfigTypes: ["function"],
}).normalize({ extension: "js" }) satisfies Promise<ConfigArray>;

new ConfigArray(
	[
		[
			{
				files: ["**/*.js"],
			},
			syncConfigFunction,
		],
	],
	{
		basePath: "/",
		extraConfigTypes: ["array", "function"],
	},
).normalizeSync({ extension: "ts" });

const configArray = new ConfigArray(
	[
		{
			files: ["**/*.js"],
		},
		{
			files: [["*.test.*", "*.js"]],
		},
	],
	{ basePath: "/" },
).normalizeSync();

configArray.isNormalized() satisfies boolean;

configArray.files satisfies FilesMatcher[];
configArray.ignores satisfies Array<{
	basePath?: string;
	name?: string;
	ignores: FileMatcher[];
}>;
configArray.extraConfigTypes satisfies ReadonlyArray<ExtraConfigType>;

configArray.getConfigStatus("/foo.js") satisfies
	| "ignored"
	| "external"
	| "unconfigured"
	| "matched";

// @ts-expect-error -- Invalid status
const invalidConfigStatus: "invalid" = configArray.getConfigStatus("/foo.js");

const configWithStatus = configArray.getConfigWithStatus("/foo.js");
configWithStatus.status satisfies
	| "ignored"
	| "external"
	| "unconfigured"
	| "matched";

// @ts-expect-error -- filePath must be a string
configArray.getConfigWithStatus(123);

configArray.getConfig("/foo.js");

// @ts-expect-error -- filePath must be a string
configArray.getConfig(123);

configArray.isIgnored("/foo.js") satisfies boolean;

// @ts-expect-error -- filePath must be a string
configArray.isIgnored(123);

configArray.isFileIgnored("/foo.js") satisfies boolean;

// @ts-expect-error -- filePath must be a string
configArray.isFileIgnored(123);

configArray.isDirectoryIgnored("/foo/") satisfies boolean;

// @ts-expect-error -- directoryPath must be a string
configArray.isDirectoryIgnored(123);

// #endregion ConfigArray
