# ESLint Compatibility Utilities

## Overview

This packages contains functions that allow you to wrap existing ESLint rules, plugins, and configurations that were intended for use with ESLint v8.x to allow them to work as-is in ESLint v9.x.

**Note:** All plugins are not guaranteed to work in ESLint v9.x. This package fixes the most common issues but can't fix everything.

## Installation

For Node.js and compatible runtimes:

```shell
npm install @eslint/compat -D
# or
yarn add @eslint/compat -D
# or
pnpm install @eslint/compat -D
# or
bun install @eslint/compat -D
```

For Deno:

```shell
deno add @eslint/compat
```

## Usage

This package exports the following functions in both ESM and CommonJS format:

-   `fixupRule(rule)` - wraps the given rule in a compatibility layer and returns the result
-   `fixupPluginRules(plugin)` - wraps each rule in the given plugin using `fixupRule()` and returns a new object that represents the plugin with the fixed-up rules
-   `fixupConfigRules(configs)` - wraps all plugins found in an array of config objects using `fixupPluginRules()`
-   `includeIgnoreFile(path)` - reads an ignore file (like `.gitignore`) and converts the patterns into the correct format for the config file

### Fixing Rules

If you have a rule that you'd like to make compatible with ESLint v9.x, you can do so using the `fixupRule()` function:

```js
// ESM example
import { fixupRule } from "@eslint/compat";

// Step 1: Import your rule
import myRule from "./local-rule.js";

// Step 2: Create backwards-compatible rule
const compatRule = fixupRule(myRule);

// Step 3 (optional): Export fixed rule
export default compatRule;
```

Or in CommonJS:

```js
// CommonJS example
const { fixupRule } = require("@eslint/compat");

// Step 1: Import your rule
const myRule = require("./local-rule.js");

// Step 2: Create backwards-compatible rule
const compatRule = fixupRule(myRule);

// Step 3 (optional): Export fixed rule
module.exports = compatRule;
```

### Fixing Plugins

If you are using a plugin in your `eslint.config.js` that is not yet compatible with ESLint 9.x, you can wrap it using the `fixupPluginRules()` function:

```js
// eslint.config.js - ESM example
import { fixupPluginRules } from "@eslint/compat";
import somePlugin from "eslint-plugin-some-plugin";

export default [
	{
		plugins: {
			// insert the fixed plugin instead of the original
			somePlugin: fixupPluginRules(somePlugin),
		},
		rules: {
			"somePlugin/rule-name": "error",
		},
	},
];
```

Or in CommonJS:

```js
// eslint.config.js - CommonJS example
const { fixupPluginRules } = require("@eslint/compat");
const somePlugin = require("eslint-plugin-some-plugin");

module.exports = [
	{
		plugins: {
			// insert the fixed plugin instead of the original
			somePlugin: fixupPluginRules(somePlugin),
		},
		rules: {
			"somePlugin/rule-name": "error",
		},
	},
];
```

### Fixing Configs

If you are importing other configs into your `eslint.config.js` that use plugins that are not yet compatible with ESLint 9.x, you can wrap the entire array or a single object using the `fixupConfigRules()` function:

```js
// eslint.config.js - ESM example
import { fixupConfigRules } from "@eslint/compat";
import someConfig from "eslint-config-some-config";

export default [
	...fixupConfigRules(someConfig),
	{
		// your overrides
	},
];
```

Or in CommonJS:

```js
// eslint.config.js - CommonJS example
const { fixupConfigRules } = require("@eslint/compat");
const someConfig = require("eslint-config-some-config");

module.exports = [
	...fixupConfigRules(someConfig),
	{
		// your overrides
	},
];
```

### Including Ignore Files

If you were using an alternate ignore file in ESLint v8.x, such as using `--ignore-path .gitignore` on the command line, you can include those patterns programmatically in your config file using the `includeIgnoreFile()` function. For example:

```js
// eslint.config.js - ESM example
import { includeIgnoreFile } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

export default [
	includeIgnoreFile(gitignorePath),
	{
		// your overrides
	},
];
```

Or in CommonJS:

```js
// eslint.config.js - CommonJS example
const { includeIgnoreFile } = require("@eslint/compat");
const path = require("node:path");
const gitignorePath = path.resolve(__dirname, ".gitignore");

module.exports = [
	includeIgnoreFile(gitignorePath),
	{
		// your overrides
	},
];
```

**Limitation:** This works without modification when the ignore file is in the same directory as your config file. If the ignore file is in a different directory, you may need to modify the patterns manually.

## License

Apache 2.0
