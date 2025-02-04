/**
 * @fileoverview defineConfig helper
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Type Definitions
//-----------------------------------------------------------------------------

/** @typedef {import("eslint").Linter.Config} Config */
/** @typedef {import("eslint").Linter.LegacyConfig} LegacyConfig */
/** @typedef {import("./types.ts").ExtendsElement} ExtendsElement */
/** @typedef {import("./types.ts").SimpleExtendsElement} SimpleExtendsElement */
/** @typedef {import("./types.ts").ConfigWithExtends} ConfigWithExtends */
/** @typedef {import("./types.ts").ConfigWithExtendsArray} ConfigWithExtendsArray */

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

const eslintrcKeys = [
	"env",
	"extends",
	"globals",
	"ignorePatterns",
	"noInlineConfig",
	"overrides",
	"parser",
	"parserOptions",
	"reportUnusedDisableDirectives",
	"root",
];

/**
 * Gets the name of a config object.
 * @param {Config} config The config object.
 * @param {string} indexPath The index path of the config object.
 * @return {string} The name of the config object.
 */
function getConfigName(config, indexPath) {
	if (config.name) {
		return config.name;
	}

	return `UserConfig${indexPath}`;
}

/**
 * Gets the name of an extension.
 * @param {SimpleExtendsElement} extension The extension.
 * @param {string} indexPath The index of the extension.
 * @return {string} The name of the extension.
 */
function getExtensionName(extension, indexPath) {
	if (typeof extension === "string") {
		return extension;
	}

	if (extension.name) {
		return extension.name;
	}

	return `ExtendedConfig${indexPath}`;
}

/**
 * Determines if a config object is a legacy config.
 * @param {Config|LegacyConfig} config The config object to check.
 * @return {config is LegacyConfig} `true` if the config object is a legacy config.
 */
function isLegacyConfig(config) {
	for (const key of eslintrcKeys) {
		if (key in config) {
			return true;
		}
	}

	return false;
}

/**
 * Finds a plugin config by name in the given config.
 * @param {Config} config The config object.
 * @param {string} pluginConfigName The name of the plugin config.
 * @return {Config|Config[]} The plugin config.
 */
function findPluginConfig(config, pluginConfigName) {
	const [pluginName, configName] = pluginConfigName.split("/");
	const plugin = config.plugins?.[pluginName];

	if (!plugin) {
		throw new TypeError(`Plugin "${pluginName}" not found.`);
	}

	const pluginConfig = plugin.configs?.[configName];

	if (!pluginConfig) {
		throw new TypeError(`Plugin config "${pluginConfigName}" not found.`);
	}

	// if it's an array then it's definitely a new config
	if (Array.isArray(pluginConfig)) {
		return pluginConfig;
	}

	// if it's a legacy config, throw an error
	if (isLegacyConfig(pluginConfig)) {
		throw new TypeError(
			`Plugin config "${pluginConfigName}" is an eslintrc config and cannot be used in this context.`,
		);
	}

	return pluginConfig;
}

/**
 * Flattens an array while keeping track of the index path.
 * @param {any[]} configList The array to traverse.
 * @param {string} indexPath The index path of the value in a multidimensional array.
 * @return {IterableIterator<{indexPath:string, value:any}>} The flattened list of values.
 */
function* flatTraverse(configList, indexPath = "") {
	for (let i = 0; i < configList.length; i++) {
		const newIndexPath = indexPath ? `${indexPath}[${i}]` : `[${i}]`;

		// if it's an array then traverse it as well
		if (Array.isArray(configList[i])) {
			yield* flatTraverse(configList[i], newIndexPath);
			continue;
		}

		yield { indexPath: newIndexPath, value: configList[i] };
	}
}

/**
 * Extends a list of config files by creating every combination of base and extension files.
 * @param {(string|string[])[]} [baseFiles] The base files.
 * @param {(string|string[])[]} [extensionFiles] The extension files.
 * @return {(string|string[])[]} The extended files.
 */
function extendConfigFiles(baseFiles = [], extensionFiles = []) {
	if (!extensionFiles.length) {
		return baseFiles.concat();
	}

	if (!baseFiles.length) {
		return extensionFiles.concat();
	}

	/** @type {(string|string[])[]} */
	const result = [];

	for (const baseFile of baseFiles) {
		for (const extensionFile of extensionFiles) {
			/*
			 * Each entry can be a string or array of strings. The end result
			 * needs to be an array of strings, so we need to be sure to include
			 * all of the items when there's an array.
			 */

			const entry = [];

			if (Array.isArray(baseFile)) {
				entry.push(...baseFile);
			} else {
				entry.push(baseFile);
			}

			if (Array.isArray(extensionFile)) {
				entry.push(...extensionFile);
			} else {
				entry.push(extensionFile);
			}

			result.push(entry);
		}
	}

	return result;
}

/**
 * Extends a config object with another config object.
 * @param {Config} baseConfig The base config object.
 * @param {string} baseConfigName The name of the base config object.
 * @param {Config} extension The extension config object.
 * @param {string} extensionName The index of the extension config object.
 * @return {Config} The extended config object.
 */
function extendConfig(baseConfig, baseConfigName, extension, extensionName) {
	const result = { ...extension };

	// for files we need to create every combination of base and extension files
	if (baseConfig.files) {
		result.files = extendConfigFiles(baseConfig.files, extension.files);
	}

	// for ignores we just concatenation the extension ignores onto the base ignores
	if (baseConfig.ignores) {
		result.ignores = baseConfig.ignores.concat(extension.ignores ?? []);
	}

	result.name = `${baseConfigName} > ${extensionName}`;

	return result;
}

/**
 * Processes a list of extends elements.
 * @param {ConfigWithExtends} config The config object.
 * @param {WeakMap<Config, string>} configNames The map of config objects to their names.
 * @return {Config[]} The flattened list of config objects.
 */
function processExtends(config, configNames) {
	if (!config.extends) {
		return [config];
	}

	const {
		/** @type {Config[]} */
		extends: extendsList,

		/** @type {Config} */
		...configObject
	} = config;

	const extensionNames = new WeakMap();

	// replace strings with the actual configs
	const objectExtends = extendsList.map(extendsElement => {
		if (typeof extendsElement === "string") {
			const pluginConfig = findPluginConfig(config, extendsElement);

			// assign names
			if (Array.isArray(pluginConfig)) {
				pluginConfig.forEach((pluginConfigElement, index) => {
					extensionNames.set(
						pluginConfigElement,
						`${extendsElement}[${index}]`,
					);
				});
			} else {
				extensionNames.set(pluginConfig, extendsElement);
			}

			return pluginConfig;
		}

		return /** @type {Config} */ (extendsElement);
	});

	const result = [];

	for (const { indexPath, value: extendsElement } of flatTraverse(
		objectExtends,
	)) {
		const extension = /** @type {Config} */ (extendsElement);
		const baseConfigName = /** @type {string} */ (configNames.get(config));
		const extensionName =
			extensionNames.get(extendsElement) ??
			getExtensionName(extendsElement, indexPath);

		result.push(
			extendConfig(
				configObject,
				baseConfigName,
				extension,
				extensionName,
			),
		);
	}

	// original config last
	result.push(configObject);

	return result.flat();
}

/**
 * Processes a list of config objects and arrays.
 * @param {ConfigWithExtends[]} configList The list of config objects and arrays.
 * @param {WeakMap<Config, string>} configNames The map of config objects to their names.
 * @return {Config[]} The flattened list of config objects.
 */
function processConfigList(configList, configNames) {
	return configList.flatMap(config => processExtends(config, configNames));
}

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Helper function to define a config array.
 * @param {ConfigWithExtendsArray} args The arguments to the function.
 * @returns {Config[]} The config array.
 */
export function defineConfig(...args) {
	const configNames = new WeakMap();
	const configs = [];

	// first flatten the list of configs and get the names
	for (const { indexPath, value } of flatTraverse(args)) {
		const config = /** @type {ConfigWithExtends} */ (value);

		// save config name for easy reference later
		configNames.set(config, getConfigName(config, indexPath));
		configs.push(config);
	}

	return processConfigList(configs, configNames);
}
