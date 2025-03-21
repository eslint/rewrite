/**
 * @fileoverview Configuration Migration
 * @author Nicholas C. Zakas
 */

/* eslint no-console: off -- Need to emit warnings */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import * as recast from "recast";
import { Legacy } from "@eslint/eslintrc";
import camelCase from "camelcase";
import pluginsNeedingCompat from "./compat-plugins.js";
import configsNeedingCompat from "./compat-configs.js";
import { convertIgnorePatternToMinimatch } from "@eslint/compat";
import * as espree from "espree";

//-----------------------------------------------------------------------------
// Types
//-----------------------------------------------------------------------------

/** @typedef {import("eslint").Linter.FlatConfig} FlatConfig */
/** @typedef {import("eslint").Linter.LegacyConfig} LegacyConfig  */
/** @typedef {import("eslint").Linter.ConfigOverride} ConfigOverride  */
/** @typedef {import("recast").types.namedTypes.ObjectExpression} ObjectExpression */
/** @typedef {import("recast").types.namedTypes.ArrayExpression} ArrayExpression */
/** @typedef {import("recast").types.namedTypes.CallExpression} CallExpression */
/** @typedef {import("recast").types.namedTypes.Property} Property */
/** @typedef {import("recast").types.namedTypes.MemberExpression} MemberExpression */
/** @typedef {import("recast").types.namedTypes.Program} Program */
/** @typedef {import("recast").types.namedTypes.Statement} Statement */
/** @typedef {import("recast").types.namedTypes.Literal} Literal */
/** @typedef {import("recast").types.namedTypes.SpreadElement} SpreadElement */
/** @typedef {import("recast").types.namedTypes.ExportDefaultDeclaration} ExportDefaultDeclaration */
/** @typedef {import("recast").types.namedTypes.AssignmentExpression} AssignmentExpression */
/** @typedef {import("./types.js").MigrationImport} MigrationImport */

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const keysToCopy = ["settings", "rules", "processor"];
const linterOptionsKeysToCopy = [
	"noInlineConfig",
	"reportUnusedDisableDirectives",
];

//-----------------------------------------------------------------------------
// Classes
//-----------------------------------------------------------------------------

/**
 * Represents a migration from one config to another.
 */
class Migration {
	/**
	 * Any imports required for the new config.
	 * @type {Map<string,MigrationImport>}
	 */
	imports = new Map();

	/**
	 * Any messages to display to the user.
	 * @type {string[]}
	 */
	messages = [];

	/**
	 * Whether or not the migration needs the `__dirname` variable defined.
	 * @type {boolean}
	 */
	needsDirname = false;

	/**
	 * Any initialization needed in the file.
	 * @type {Array<Statement>}
	 */
	inits = [];

	/**
	 * For `env`, we need the `globals` package if there are any environments
	 * that aren't ECMAScript environments and also aren't from plugins
	 * (the name contains a slash).
	 * @param {Object} [env] The environment object from the config.
	 * @returns {void}
	 */
	importGlobalsIfNeeded(env) {
		const needsGlobals =
			env &&
			Object.keys(env).some(
				envName => !envName.startsWith("es") && !envName.includes("/"),
			);

		if (needsGlobals && !this.imports.has("globals")) {
			this.imports.set("globals", {
				name: "globals",
				added: true,
			});
		}
	}
}

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

const { builders: b } = recast.types;
const { naming } = Legacy;

/**
 * Determines if a string is a valid identifier.
 * @param {string} name The name to check.
 * @returns {boolean} `true` if the name is a valid identifier.
 */
function isValidIdentifier(name) {
	return /^[a-z_$][0-9a-z_$]*$/iu.test(name);
}

/**
 * Gets the name of the variable to use for the parser.
 * @param {string|undefined} parser The name of the parser.
 * @returns {string|undefined} The variable name to use or undefined if none.
 */
function getParserVariableName(parser) {
	if (!parser) {
		return undefined;
	}

	if (parser.includes("typescript-eslint")) {
		return "tsParser";
	}

	if (parser.includes("babel")) {
		return "babelParser";
	}

	if (parser === "espree") {
		return "espree";
	}

	return "parser";
}

// cache for plugins needing compat
const pluginsNeedingCompatCache = new Set(pluginsNeedingCompat);

/**
 * Converts an array expression to an array.
 * @param {ArrayExpression} arrayExpression The array expression to convert.
 * @returns {Array<string>} The array.
 * @throws {TypeError} If an element in the array expression is not a literal.
 */
function convertArrayExpressionToArray(arrayExpression) {
	return arrayExpression.elements.map(element => {
		if (element.type === "Literal" && typeof element.value === "string") {
			return element.value;
		}

		throw new TypeError(`Cannot convert ${element.type} to array.`);
	});
}

/**
 * Converts an object expression to an object.
 * @param {ObjectExpression} objectExpression The object expression to convert.
 * @returns {Object} The object.
 * @throws {TypeError} If a property value is not a literal or identifier.
 */
function convertObjectExpressionToObject(objectExpression) {
	if (objectExpression.type !== "ObjectExpression") {
		throw new TypeError(
			`Cannot convert ${objectExpression.type} to object.`,
		);
	}

	return objectExpression.properties.reduce((object, property) => {
		if (property.type === "Property") {
			const { key, value } = property;

			if (value.type !== "Literal") {
				return object;
			}

			if (key.type === "Literal") {
				object[String(key.value)] = value.value;
			} else if (key.type === "Identifier") {
				object[key.name] = value.value;
			}
		}

		return object;
	}, {});
}

/**
 * Finds the `module.exports` or `exports` assignment in a CommonJS module.
 * @param {Program} ast The AST to search.
 * @returns {AssignmentExpression|null} The node representing the exports or null if not found.
 */
function findCommonJSExports(ast) {
	let exports = null;
	recast.visit(ast, {
		visitAssignmentExpression(path) {
			if (
				path.node.left.type === "MemberExpression" &&
				path.node.left.object.type === "Identifier" &&
				path.node.left.object.name === "module" &&
				path.node.left.property.type === "Identifier" &&
				path.node.left.property.name === "exports"
			) {
				exports = path.node;
				return false;
			}
			this.traverse(path);
			return true;
		},
	});
	return exports;
}

/**
 * Finds the default export in an ES module.
 * @param {Program} ast The AST to search.
 * @returns {ExportDefaultDeclaration|null} The node representing the default export or null if not found.
 */
function findDefaultExport(ast) {
	let defaultExport = null;
	recast.visit(ast, {
		visitExportDefaultDeclaration(path) {
			defaultExport = path.node;
			return false;
		},
	});
	return defaultExport;
}

/**
 * Determines if a plugin needs the compat utility.
 * @param {string} pluginName The name of the plugin.
 * @returns {boolean} `true` if the plugin needs the compat utility.
 */
function pluginNeedsCompat(pluginName) {
	const pluginNameToTest = pluginName.includes("/")
		? pluginName.slice(0, pluginName.indexOf("/"))
		: pluginName;

	return pluginsNeedingCompatCache.has(
		naming.normalizePackageName(pluginNameToTest, "eslint-plugin"),
	);
}

/**
 * Determines if a shareable config needs the compat utility.
 * @param {string} configName The name of the config.
 * @returns {boolean} `true` if the config needs the compat utility.
 */
function configNeedsCompat(configName) {
	const configNameToTest = configName.includes("/")
		? configName.slice(0, configName.indexOf("/"))
		: configName;

	const fullConfigName = naming.normalizePackageName(
		configNameToTest,
		"eslint-config",
	);
	return configsNeedingCompat.includes(fullConfigName);
}

/**
 * Gets the name of the variable to use for the plugin. If the plugin name
 * contains slashes or an @ symbol, it will be normalized to a camelcase name.
 * If the name is "import" or "export", it will be prefixed with an underscore.
 * @param {string} pluginName The name of the plugin.
 * @returns {string} The variable name to use.
 */
function getPluginVariableName(pluginName) {
	let name = pluginName.replace(/^eslint-plugin-/u, "");

	if (name === "import" || name === "export") {
		return `_${name}`;
	}

	if (name.startsWith("@")) {
		name = name.slice(1);
	}

	// replace slash with uppercase of following letter
	name = name.replace(/\/(.)/gu, (_, letter) => letter.toUpperCase());

	return camelCase(name);
}

/**
 * Get the initialization code for `__dirname`.
 * @returns {Array<Statement>} The AST for the initialization block.
 */
function getDirnameInit() {
	/*
	 * Recast doesn't support `import.meta.url`, so using an uppercase "I" to
	 * allow for parsing. We then need to replace it with the lowercase "i".
	 */
	const init = `\n
const __filename = fileURLToPath(Import.meta.url);
const __dirname = path.dirname(__filename);`;

	const result = recast.parse(init).program.body;

	// Replace uppercase "I" with lowercase "i" in "Import.meta.url"
	result[0].declarations[0].init.arguments[0].object.object.name = "import";

	return result;
}

/**
 * Creates an initialization block for the FlatCompat utility.
 * @returns {Array<Statement>} The AST for the initialization block.
 */
function getFlatCompatInit() {
	const init = `
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});
`;
	return recast.parse(init).program.body;
}

/**
 * Creates an initialization block for the gitignore file.
 * @returns {Statement} The AST for the initialization block.
 */
function getGitignoreInit() {
	const init = `
const gitignorePath = path.resolve(__dirname, ".gitignore");
`;

	return recast.parse(init).program.body[0];
}

/**
 * Converts a glob pattern to a format that can be used in a flat config.
 * @param {string} pattern The glob pattern to convert.
 * @returns {string} The converted glob pattern.
 */
function convertGlobPattern(pattern) {
	const isNegated = pattern.startsWith("!");
	const patternToTest = isNegated ? pattern.slice(1) : pattern;

	// if the pattern is already in the correct format, return it
	if (patternToTest === "**" || patternToTest.includes("/")) {
		return pattern;
	}

	return `${isNegated ? "!" : ""}**/${patternToTest}`;
}

/**
 * Creates the entry for the gitignore inclusion.
 * @param {Migration} migration The migration object.
 * @returns {CallExpression} The AST for the gitignore entry.
 */
function createGitignoreEntry(migration) {
	migration.inits.push(getGitignoreInit());

	if (!migration.imports.has("@eslint/compat")) {
		migration.imports.set("@eslint/compat", {
			bindings: ["includeIgnoreFile"],
			added: true,
		});
	} else {
		migration.imports
			.get("@eslint/compat")
			.bindings.push("includeIgnoreFile");
	}

	if (!migration.imports.has("node:path")) {
		migration.imports.set("node:path", {
			name: "path",
			added: true,
		});
	}

	const code = `includeIgnoreFile(gitignorePath)`;

	return recast.parse(code).program.body[0].expression;
}

/**
 * Creates the globals object from the config.
 * @param {LegacyConfig} config The config to create globals from.
 * @returns {ObjectExpression|undefined} The globals object or undefined if none.
 */
function createGlobals(config) {
	const { globals, env } = config;

	if (!globals && !env) {
		return undefined;
	}

	const properties = [];

	if (env) {
		properties.push(
			...Object.keys(env)
				.filter(name => !name.startsWith("es"))
				.map(name => {
					let envName = name;
					const memberExpression = b.memberExpression(
						b.identifier("globals"),
						b.identifier(name),
					);

					// plugins environments in the form plugin/env
					if (name.includes("/")) {
						const [pluginName, pluginEnvName] = name.split("/");
						const pluginVariableName =
							getPluginVariableName(pluginName);

						// looks like plugin.environments.envName.globals
						memberExpression.object = b.memberExpression(
							b.memberExpression(
								b.identifier(pluginVariableName),
								b.identifier("environments"),
							),
							isValidIdentifier(pluginEnvName)
								? b.identifier(pluginEnvName)
								: b.literal(pluginEnvName),
							!isValidIdentifier(pluginEnvName),
						);
						memberExpression.property = b.identifier("globals");
						envName = pluginEnvName;
					}

					// if the name is not a valid identifier, use computed syntax
					if (!isValidIdentifier(envName)) {
						memberExpression.computed = true;
						memberExpression.property = b.literal(envName);
					}

					const envValue = env[name];

					// environment is enabled
					if (envValue) {
						return b.spreadProperty(memberExpression);
					}

					// environment is disabled
					return b.spreadProperty(
						b.callExpression(
							b.memberExpression(
								b.identifier("Object"),
								b.identifier("fromEntries"),
							),
							[
								b.callExpression(
									b.memberExpression(
										b.callExpression(
											b.memberExpression(
												b.identifier("Object"),
												b.identifier("entries"),
											),
											[memberExpression],
										),
										b.identifier("map"),
									),
									[
										b.arrowFunctionExpression(
											[
												b.arrayPattern([
													b.identifier("key"),
												]),
											],
											b.arrayExpression([
												b.identifier("key"),
												b.literal("off"),
											]),
										),
									],
								),
							],
						),
					);
				}),
		);
	}

	if (globals) {
		properties.push(
			...Object.keys(globals).map(name =>
				b.property(
					"init",
					b.identifier(name),
					b.literal(globals[name]),
				),
			),
		);
	}

	return b.objectExpression(properties);
}

/**
 * Creates the linter options object from the config.
 * @param {LegacyConfig} config The config to create linter options from.
 * @returns {ObjectExpression|undefined} The linter options object or undefined if none.
 */
function createLinterOptions(config) {
	if (!config.noInlineConfig && !config.reportUnusedDisableDirectives) {
		return undefined;
	}

	const properties = [];

	linterOptionsKeysToCopy.forEach(key => {
		if (config[key]) {
			properties.push(
				b.property("init", b.identifier(key), b.literal(config[key])),
			);
		}
	});

	return b.objectExpression(properties);
}

/**
 * Creates an array of function arguments from an array of extended configs.
 * @param {string|string[]} extendedConfigs The extended configs to convert.
 * @returns {Array<Literal>} The AST for the array expression.
 */
function createExtendsArguments(extendedConfigs) {
	// create an array of strings
	if (typeof extendedConfigs === "string") {
		return [b.literal(extendedConfigs)];
	}

	return extendedConfigs.map(config => b.literal(config));
}

/**
 * Creates a an object expression, array expression, or literal that duplicates an existing value.
 * @param {Object} value The object to create the AST for.
 * @returns {ObjectExpression|ArrayExpression|Literal} The AST for the value.
 */
function createAST(value) {
	if (Array.isArray(value)) {
		return b.arrayExpression(value.map(item => createAST(item)));
	}

	if (value && typeof value === "object") {
		const properties = Object.keys(value).map(key => {
			const propertyValue = value[key];
			const identifier = isValidIdentifier(key)
				? b.identifier(key)
				: b.literal(key);
			return b.property("init", identifier, createAST(propertyValue));
		});

		return b.objectExpression(properties);
	}

	return b.literal(value);
}

/**
 * Creates an array expression from an array of glob patterns.
 * @param {string[]} patterns The glob patterns to convert.
 * @returns {ArrayExpression} The AST for the array expression.
 */
function createFilesArray(patterns) {
	return b.arrayExpression(
		patterns.map(pattern => b.literal(convertGlobPattern(pattern))),
	);
}

/**
 * Creates an array expression from a node representing files.
 * @param {ArrayExpression|Literal} files The node to convert.
 * @returns {ArrayExpression} The AST for the array expression.
 */
function createFilesArrayFromNode(files) {
	if (files.type === "ArrayExpression") {
		return b.arrayExpression(
			files.elements.map(element => {
				if (
					element.type === "Literal" &&
					typeof element.value === "string"
				) {
					return b.literal(convertGlobPattern(element.value));
				}

				return element;
			}),
		);
	}

	if (files.type === "Literal" && typeof files.value === "string") {
		return b.arrayExpression([b.literal(convertGlobPattern(files.value))]);
	}

	throw new TypeError(`Cannot convert ${files.type} to array.`);
}

/**
 * Creates an object expression for the language options.
 * @param {Migration} migration The migration object.
 * @param {LegacyConfig} config The config to create language options from.
 * @returns {ObjectExpression|undefined} The AST for the object expression or undefined if none.
 */
function createLanguageOptions(migration, config) {
	const properties = [];
	const { imports, messages } = migration;

	// Both `env` and `globals` end up as globals in flat config
	const globals = createGlobals(config);
	if (globals) {
		properties.push(b.property("init", b.identifier("globals"), globals));
	}

	migration.importGlobalsIfNeeded(config.env);

	// Copy over `parser`
	const parserName = getParserVariableName(config.parser);
	if (parserName) {
		properties.push(
			b.property(
				"init",
				b.identifier("parser"),
				b.identifier(parserName),
			),
		);
		imports.set(config.parser, {
			name: parserName,
		});
	}

	// Copy over `parserOptions`
	if (config.parserOptions) {
		const {
			ecmaVersion = 5,
			sourceType = "script",
			...otherParserOptions
		} = config.parserOptions;

		// move `ecmaVersion` to `languageOptions`
		properties.push(
			b.property(
				"init",
				b.identifier("ecmaVersion"),
				b.literal(ecmaVersion),
			),
		);

		// move `sourceType` to `languageOptions` -- be sure to check for Node.js environment
		/** @type {"module"|"script"|"commonjs"} */
		let finalSourceType = sourceType;
		if (config?.env?.node) {
			if (sourceType === "module") {
				messages.push(
					"The 'node' environment is used, but the sourceType is 'module'. Using sourceType 'module'. If you want to use CommonJS modules, set the sourceType to 'commonjs'.",
				);
			} else {
				finalSourceType = "commonjs";
				messages.push(
					"The 'node' environment is used, so switching sourceType to 'commonjs'.",
				);
			}
		}

		properties.push(
			b.property(
				"init",
				b.identifier("sourceType"),
				b.literal(finalSourceType),
			),
		);

		if (Object.keys(otherParserOptions).length > 0) {
			properties.push(
				b.property(
					"init",
					b.identifier("parserOptions"),
					createAST(otherParserOptions),
				),
			);
		}
	}

	return properties.length ? b.objectExpression(properties) : undefined;
}

/**
 * Creates an object expression for the plugins array. Also adds the necessary imports
 * to the migration imports map.
 * @param {string[]} plugins The plugins to create the object expression for.
 * @param {Migration} migration The migration object.
 * @returns {ObjectExpression} The AST for the object expression.
 */
function createPlugins(plugins, migration) {
	const { imports } = migration;
	const properties = [];

	const compatNeeded = plugins.reduce((previous, pluginName) => {
		const pluginVariableName = getPluginVariableName(pluginName);
		const shortPluginName = naming.getShorthandName(
			pluginName,
			"eslint-plugin",
		);
		const needsCompat = pluginNeedsCompat(pluginName);

		const pluginValue = needsCompat
			? b.callExpression(b.identifier("fixupPluginRules"), [
					b.identifier(pluginVariableName),
				])
			: b.identifier(pluginVariableName);

		const pluginsProperty = b.property(
			"init",
			isValidIdentifier(shortPluginName)
				? b.identifier(shortPluginName)
				: b.literal(shortPluginName),
			pluginValue,
		);

		if (pluginVariableName === shortPluginName && !needsCompat) {
			pluginsProperty.shorthand = true;
		}

		properties.push(pluginsProperty);

		imports.set(naming.normalizePackageName(pluginName, "eslint-plugin"), {
			name: pluginVariableName,
		});

		return needsCompat || previous;
	}, false);

	if (compatNeeded) {
		if (!migration.imports.has("@eslint/compat")) {
			migration.imports.set("@eslint/compat", {
				bindings: ["fixupPluginRules"],
				added: true,
			});
		} else if (
			!migration.imports
				.get("@eslint/compat")
				.bindings.includes("fixupPluginRules")
		) {
			migration.imports
				.get("@eslint/compat")
				.bindings.push("fixupPluginRules");
		}
	}

	return b.objectExpression(properties);
}

/**
 * Creates an object expression for the `ignorePatterns` property.
 * @param {string|string[]} ignorePatterns The config to create the object expression for.
 * @returns {CallExpression} The AST for the object expression.
 */
function createGlobalIgnores(ignorePatterns) {
	const ignorePatternsArray = Array.isArray(ignorePatterns)
		? ignorePatterns
		: [ignorePatterns];
	const ignorePatternsArrayExpression = b.arrayExpression(
		ignorePatternsArray.map(pattern =>
			b.literal(convertIgnorePatternToMinimatch(pattern)),
		),
	);

	return b.callExpression(b.identifier("globalIgnores"), [
		ignorePatternsArrayExpression,
	]);
}

/**
 * Creates a call expression for the `globalIgnores` property when
 * passed a node.
 * @param {ArrayExpression|Literal} ignoresPatterns The node to create the call expression from.
 * @returns {CallExpression} The AST for the call expression.
 */
function createGlobalIgnoresFromNode(ignoresPatterns) {
	const arrayExpression =
		ignoresPatterns.type === "ArrayExpression"
			? ignoresPatterns
			: b.arrayExpression([ignoresPatterns]);

	const ignorePatternsArrayExpression = b.arrayExpression(
		arrayExpression.elements.map(element =>
			element.type === "Literal"
				? b.literal(
						typeof element.value === "string"
							? convertIgnorePatternToMinimatch(element.value)
							: element.value,
					)
				: element,
		),
	);

	return b.callExpression(b.identifier("globalIgnores"), [
		ignorePatternsArrayExpression,
	]);
}

/**
 * Creates a call expression for the `extends` property.
 * @param {string|string[]} configExtends The array of extends to create the call expression for.
 * @param {Migration} migration The migration object.
 * @returns {CallExpression} The AST for the call expression.
 */
function createExtendsCallExpression(configExtends, migration) {
	let extendsCallExpression = b.callExpression(
		b.memberExpression(b.identifier("compat"), b.identifier("extends")),
		createExtendsArguments(configExtends),
	);

	const extendsArray = Array.isArray(configExtends)
		? configExtends
		: [configExtends];

	// Check if any of the extends are plugins that need the compat utility
	const needsCompat = extendsArray.some(extend => {
		if (
			extend.startsWith("eslint:") ||
			extend.startsWith(".") ||
			extend.startsWith("/")
		) {
			return false;
		}

		if (extend.startsWith("plugin:")) {
			return pluginNeedsCompat(extend.slice(7));
		}

		return configNeedsCompat(extend);
	});

	if (needsCompat) {
		/*
		 * When even one `extends` item needs compat, we need to mark every
		 * plugin as needing compat. This is because the `fixupConfigRules`
		 * function will be called on the entire object, and if any of those
		 * plugins is also referenced in `plugins`, the user will get a
		 * "can't redefine plugin" error.
		 */
		extendsArray.forEach(extend => {
			if (extend.startsWith("plugin:")) {
				const pluginName = extend.slice(7, extend.indexOf("/"));
				const normalizedPluginName = naming.normalizePackageName(
					pluginName,
					"eslint-plugin",
				);

				pluginsNeedingCompatCache.add(normalizedPluginName);
			}
		});

		if (!migration.imports.has("@eslint/compat")) {
			migration.imports.set("@eslint/compat", {
				bindings: ["fixupConfigRules"],
				added: true,
			});
		} else {
			migration.imports
				.get("@eslint/compat")
				.bindings.push("fixupConfigRules");
		}

		extendsCallExpression = b.callExpression(
			b.identifier("fixupConfigRules"),
			[extendsCallExpression],
		);
	}

	return extendsCallExpression;
}

/**
 * Migrates a config object to the flat config format.
 * @param {Migration} migration The migration object.
 * @param {ConfigOverride} config The config object to migrate.
 * @returns {Array<ObjectExpression|SpreadElement>} The AST for the object expression.
 */
function migrateConfigObject(migration, config) {
	const configArrayElements = [];
	const properties = [];
	let files, ignores;

	// Copy over `files` -- should end up first by convention
	if (config.files) {
		files = createFilesArray(
			Array.isArray(config.files) ? config.files : [config.files],
		);
		properties.push(b.property("init", b.identifier("files"), files));
	}

	// Copy over `excludedFiles` -- should end up first if no `files` or second if `files` is present
	if (config.excludedFiles) {
		ignores = createFilesArray(
			Array.isArray(config.excludedFiles)
				? config.excludedFiles
				: [config.excludedFiles],
		);
		properties.push(b.property("init", b.identifier("ignores"), ignores));
	}

	// Handle `extends`
	if (config.extends) {
		properties.push(
			b.property(
				"init",
				b.identifier("extends"),
				createExtendsCallExpression(config.extends, migration),
			),
		);
	}

	/*
	 * Copy over plugins. This must happen after processing `extends` in order to
	 * properly account for plugins that need the compat utility.
	 */
	if (config.plugins) {
		properties.push(
			b.property(
				"init",
				b.identifier("plugins"),
				createPlugins(config.plugins, migration),
			),
		);
	}

	// Copy over `noInlineConfig` and `reportUnusedDisableDirectives`
	const linterOptions = createLinterOptions(config);
	if (linterOptions) {
		properties.push(
			b.property("init", b.identifier("linterOptions"), linterOptions),
		);
	}

	// Create `languageOptions` from `env`, `globals`, `parser`, and `parserOptions`
	const languageOptions = createLanguageOptions(migration, config);
	if (languageOptions) {
		properties.push(
			b.property(
				"init",
				b.identifier("languageOptions"),
				languageOptions,
			),
		);
	}

	// Copy over everything that stays the same - `settings`, `rules`, `processor`
	keysToCopy.forEach(key => {
		if (config[key]) {
			const propertyValue =
				typeof config[key] === "object"
					? createAST(config[key])
					: b.literal(config[key]);
			properties.push(
				b.property("init", b.identifier(key), propertyValue),
			);
		}
	});

	/*
	 * If there is an `extends` with a `files` and/or `ignores`, then it's possible this object
	 * will contain only `files` (and/or `ignores`), in which case we don't need it because there
	 * is already a config object with the same properties.
	 */
	const objectIsNeeded =
		!config.extends ||
		properties.some(property => {
			if (property.key.type === "Identifier") {
				return (
					property.key.name !== "files" &&
					property.key.name !== "ignores"
				);
			}

			return true;
		});
	if (objectIsNeeded) {
		configArrayElements.push(b.objectExpression(properties));
	}

	return configArrayElements;
}

/**
 * Creates import/require statements from the migration imports map
 * @param {Migration} migration The migration object
 * @param {boolean} isModule Whether the output is a module or not
 * @returns {Array<Statement>} Array of import/require statements
 */
function addImports(migration, isModule) {
	const imports = [];

	if (!isModule) {
		migration.imports.forEach(({ name, bindings }, path) => {
			const bindingProperties = bindings?.map(binding => {
				const bindingProperty = b.property(
					"init",
					b.identifier(binding),
					b.identifier(binding),
				);
				bindingProperty.shorthand = true;
				return bindingProperty;
			});

			imports.push(
				name
					? b.variableDeclaration("const", [
							b.variableDeclarator(
								b.identifier(name),
								b.callExpression(b.identifier("require"), [
									b.literal(path),
								]),
							),
						])
					: b.variableDeclaration("const", [
							b.variableDeclarator(
								b.objectPattern(bindingProperties),
								b.callExpression(b.identifier("require"), [
									b.literal(path),
								]),
							),
						]),
			);
		});
	} else {
		migration.imports.forEach(({ name, bindings }, path) => {
			imports.push(
				name
					? b.importDeclaration(
							[b.importDefaultSpecifier(b.identifier(name))],
							b.literal(path),
						)
					: b.importDeclaration(
							bindings.map(binding =>
								b.importSpecifier(b.identifier(binding)),
							),
							b.literal(path),
						),
			);
		});
	}

	return imports;
}

/**
 * Converts an ObjectExpression eslintrc config to a flat config.
 * @param {ObjectExpression} config The config object to convert.
 * @param {Migration} migration The migration object.
 * @returns {Array<any>} The converted config.
 */
function convertLegacyConfigExpression(config, migration) {
	const newProperties = [];

	/** @type {Array<any>} */
	const configArray = [b.objectExpression(newProperties)];
	const linterOptionsProperties = [];
	const languageOptionsProperties = [];

	/** @type {ObjectExpression} */
	let globals;

	function createLanguageOptionsNode() {
		if (languageOptionsProperties.length === 0) {
			newProperties.push(
				b.property(
					"init",
					b.identifier("languageOptions"),
					b.objectExpression(languageOptionsProperties),
				),
			);
		}
	}

	function createGlobalsNode() {
		if (globals) {
			languageOptionsProperties.push(
				b.property("init", b.identifier("globals"), globals),
			);
		}
	}

	for (const property of config.properties) {
		// just copy over non-property nodes and pray it works
		if (property.type !== "Property") {
			newProperties.push(property);
			continue;
		}

		const { key, value } = property;

		// just copy over non-string keys
		if (key.type !== "Identifier" && key.type !== "Literal") {
			newProperties.push(property);
			continue;
		}

		const name = key.type === "Identifier" ? key.name : key.value;

		switch (name) {
			// remove root
			case "root":
				// do not add root to the new properties
				break;

			// convert parser
			case "parser": {
				if (
					value.type === "Literal" &&
					typeof value.value === "string"
				) {
					const parserName = getParserVariableName(value.value);
					if (parserName) {
						if (languageOptionsProperties.length === 0) {
							createLanguageOptionsNode();
						}

						languageOptionsProperties.push(
							b.property(
								"init",
								b.identifier("parser"),
								b.identifier(parserName),
							),
						);
						migration.imports.set(value.value, {
							name: parserName,
						});
					}
				}
				break;
			}

			case "parserOptions": {
				if (languageOptionsProperties.length === 0) {
					createLanguageOptionsNode();
				}

				// if the value is not an object expression, then just copy it over
				if (value.type !== "ObjectExpression") {
					languageOptionsProperties.push(property);
					break;
				}

				// move ecmaVersion and sourceType properties up one level
				if (value.properties) {
					const indicesToRemove = [];
					value.properties.forEach((prop, i) => {
						if (prop.type !== "Property") {
							return;
						}

						let parserOptionsKey;

						if (prop.key.type === "Identifier") {
							parserOptionsKey = prop.key.name;
						} else if (prop.key.type === "Literal") {
							parserOptionsKey = prop.key.value;
						} else {
							return;
						}

						if (
							parserOptionsKey === "ecmaVersion" ||
							parserOptionsKey === "sourceType"
						) {
							languageOptionsProperties.push(prop);
							indicesToRemove.push(i);
						}
					});

					// remove the properties we just moved
					for (let i = indicesToRemove.length - 1; i >= 0; i--) {
						value.properties.splice(indicesToRemove[i], 1);
					}
				}

				languageOptionsProperties.push(
					b.property("init", b.identifier("parserOptions"), value),
				);
				break;
			}

			// convert env
			case "env": {
				if (languageOptionsProperties.length === 0) {
					createLanguageOptionsNode();
				}

				// if the value is not an object expression, then just copy it over
				if (value.type !== "ObjectExpression") {
					newProperties.push(property);
					break;
				}

				const env = convertObjectExpressionToObject(value);
				const envGlobals = createGlobals({ env });

				migration.importGlobalsIfNeeded(env);

				// if globals already exists, then prepend envGlobals to the same object
				if (globals) {
					globals.properties.unshift(...envGlobals.properties);
				} else {
					globals = envGlobals;
					createGlobalsNode();
				}

				break;
			}

			// convert globals
			case "globals": {
				if (languageOptionsProperties.length === 0) {
					createLanguageOptionsNode();
				}

				// if it's not an object expression then just copy it over
				if (value.type !== "ObjectExpression") {
					languageOptionsProperties.push(property);
					break;
				}

				// if globals already exists then append properties to it
				if (globals) {
					globals.properties.push(...value.properties);
				} else {
					globals = value;
					createGlobalsNode();
				}

				break;
			}

			// convert plugins
			case "plugins": {
				if (value.type === "ArrayExpression") {
					const plugins = convertArrayExpressionToArray(value);

					newProperties.push(
						b.property(
							"init",
							b.identifier("plugins"),
							createPlugins(plugins, migration),
						),
					);
				}
				break;
			}

			// convert extends
			case "extends": {
				// if it's not an array expression then just copy it over
				if (value.type !== "ArrayExpression") {
					newProperties.push(property);
					break;
				}

				newProperties.push(
					b.property(
						"init",
						b.identifier("extends"),
						createExtendsCallExpression(
							convertArrayExpressionToArray(value),
							migration,
						),
					),
				);
				break;
			}

			// copy over linter options
			case "noInlineConfig":
			case "reportUnusedDisableDirectives": {
				// if linterOptions doesn't exist yet, then create it
				if (linterOptionsProperties.length === 0) {
					newProperties.push(
						b.property(
							"init",
							b.identifier("linterOptions"),
							b.objectExpression(linterOptionsProperties),
						),
					);
				}

				linterOptionsProperties.push(property);
				break;
			}

			case "ignorePatterns":
				// if the value is not an array expression then just ignore it
				if (value.type !== "ArrayExpression") {
					console.warn(
						`Unexpected type for ${name}: ${value.type}. Ignoring...`,
					);
					break;
				}

				configArray.push(createGlobalIgnoresFromNode(value));
				break;

			case "overrides":
				// if the value is not an array expression then just ignore it
				if (value.type !== "ArrayExpression") {
					console.warn(
						`Unexpected type for ${name}: ${value.type}. Ignoring...`,
					);
					break;
				}

				configArray.push(
					...value.elements.flatMap(element =>
						element.type === "ObjectExpression"
							? convertLegacyConfigExpression(element, migration)
							: element,
					),
				);

				break;

			case "files":
			case "excludedFiles": {
				// if the value is not an array expression or literal, then just ignore it
				if (
					value.type !== "ArrayExpression" &&
					value.type !== "Literal"
				) {
					console.warn(
						`Unexpected type for ${name}: ${value.type}. Ignoring...`,
					);
					break;
				}

				const filesExpression = createFilesArrayFromNode(value);
				newProperties.push(
					b.property(
						"init",
						b.identifier(
							name === "excludedFiles" ? "ignores" : "files",
						),
						filesExpression,
					),
				);

				break;
			}

			// rules, settings, and processor are copied over as is
			default:
				newProperties.push(property);
		}
	}

	return configArray;
}

//-----------------------------------------------------------------------------
// Migration Methods
//-----------------------------------------------------------------------------

/**
 * Migrates an eslintrc config to flat config format.
 * @param {LegacyConfig} config The eslintrc config to migrate.
 * @param {Object} [options] Options for the migration.
 * @param {"module"|"commonjs"} [options.sourceType] The module type to output.
 * @param {string[]} [options.ignorePatterns] An array of glob patterns to ignore.
 * @param {boolean} [options.gitignore] `true` to include contents of a .gitignore file.
 * @returns {{code:string,messages:Array<string>,imports:Map<string,MigrationImport>}} The migrated config and
 * any messages to display to the user.
 */
export function migrateConfig(
	config,
	{ sourceType = "module", ignorePatterns, gitignore = false } = {},
) {
	const migration = new Migration();
	const body = [];

	// add ignore patterns from .eslintignore
	if (ignorePatterns) {
		if (!config.ignorePatterns) {
			config.ignorePatterns = [];
		}

		// put the .eslintignore patterns last so they can override config ignores
		config.ignorePatterns = [...config.ignorePatterns, ...ignorePatterns];
	}

	// always use defineConfig
	migration.imports.set("eslint/config", {
		bindings: ["defineConfig"],
	});

	/** @type {Array<CallExpression|ObjectExpression|SpreadElement>} */
	const configArrayElements = [
		...migrateConfigObject(
			migration,
			/** @type {ConfigOverride} */ (config),
		),
	];
	const isModule = sourceType === "module";

	// if the base config has no properties, then remove the empty object
	if (
		configArrayElements[0].type === "ObjectExpression" &&
		configArrayElements[0].properties.length === 0
	) {
		configArrayElements.shift();
	}

	// add any overrides
	if (config.overrides) {
		config.overrides.forEach(override => {
			configArrayElements.push(
				...migrateConfigObject(migration, override),
			);
		});
	}

	// if any config has extends then we need to add imports
	if (
		config.extends ||
		config.overrides?.some(override => override.extends)
	) {
		if (isModule) {
			migration.imports.set("node:path", {
				name: "path",
				added: true,
			});
			migration.imports.set("node:url", {
				bindings: ["fileURLToPath"],
				added: true,
			});
		}
		migration.imports.set("@eslint/js", {
			name: "js",
			added: true,
		});
		migration.imports.set("@eslint/eslintrc", {
			bindings: ["FlatCompat"],
			added: true,
		});
		migration.needsDirname ||= isModule;
		migration.inits.push(...getFlatCompatInit());
	}

	// add .gitignore if necessary
	if (gitignore) {
		migration.needsDirname ||= isModule;
		configArrayElements.unshift(createGitignoreEntry(migration));

		if (migration.needsDirname && !migration.imports.has("node:url")) {
			migration.imports.set("node:url", {
				bindings: ["fileURLToPath"],
				added: true,
			});
		}
	}

	if (config.ignorePatterns) {
		migration.imports.get("eslint/config").bindings.push("globalIgnores");
		configArrayElements.unshift(createGlobalIgnores(config.ignorePatterns));
	}

	// add imports to the top of the file
	// Add imports in either CJS or ESM format
	const imports = addImports(migration, isModule);
	body.push(...imports);

	// add calculation of `__dirname` if needed
	if (migration.needsDirname) {
		body.push(...getDirnameInit());
	}

	// output any inits
	body.push(...migration.inits);

	// the defineConfig() call
	const defineConfigNode = b.callExpression(b.identifier("defineConfig"), [
		b.arrayExpression(configArrayElements),
	]);

	// output the actual config array to the program
	if (!isModule) {
		body.push(
			b.expressionStatement(
				b.assignmentExpression(
					"=",
					b.memberExpression(
						b.identifier("module"),
						b.identifier("exports"),
					),
					defineConfigNode,
				),
			),
		);
	} else {
		body.push(b.exportDefaultDeclaration(defineConfigNode));
	}

	return {
		// Recast doesn't export the `StatementKind` type so we need to cast the body to `Array<any>`
		code: recast.print(b.program(/** @type {Array<any>}*/ (body)), {
			tabWidth: 4,
			trailingComma: true,
			lineTerminator: "\n",
		}).code,
		messages: migration.messages,
		imports: migration.imports,
	};
}

export function migrateJSConfig(code, { ignorePatterns, gitignore = false }) {
	// first parse the code
	const ast = recast.parse(code, {
		parser: {
			parse(source) {
				return espree.parse(source, {
					sourceType: "module",
					ecmaVersion: 2024,
				});
			},
		},
	});

	const cjsExports = findCommonJSExports(ast);
	const isModule = !cjsExports;
	const esmExport = isModule ? findDefaultExport(ast) : null;
	const oldConfig = isModule ? esmExport.declaration : cjsExports.right;
	const migration = new Migration();
	const body = ast.program.body;

	if (!oldConfig || oldConfig.type !== "ObjectExpression") {
		throw new TypeError(
			"Config object isn't an object expression. Aborting.",
		);
	}

	/** @type {Array<any>} */
	const configArrayElements = [];

	// always use defineConfig
	migration.imports.set("eslint/config", {
		bindings: ["defineConfig"],
	});

	// add .gitignore if necessary
	if (gitignore) {
		migration.needsDirname ||= isModule;
		configArrayElements.unshift(createGitignoreEntry(migration));

		if (migration.needsDirname && !migration.imports.has("node:url")) {
			migration.imports.set("node:url", {
				bindings: ["fileURLToPath"],
				added: true,
			});
		}
	}

	// add ignore patterns from .eslintignore
	if (ignorePatterns) {
		migration.imports.get("eslint/config").bindings.push("globalIgnores");
		configArrayElements.push(createGlobalIgnores(ignorePatterns));
	}

	configArrayElements.push(
		...convertLegacyConfigExpression(oldConfig, migration),
	);

	const defineConfigNode = b.callExpression(b.identifier("defineConfig"), [
		b.arrayExpression(configArrayElements),
	]);

	if (isModule) {
		esmExport.declaration = defineConfigNode;
	} else {
		cjsExports.right = defineConfigNode;
	}

	// outside of ESM we need to be careful of "use strict" directives
	if (!isModule && body[0].directive === "use strict") {
		body.splice(1, 0, ...addImports(migration, isModule));
	} else {
		body.unshift(...addImports(migration, isModule));
	}

	return {
		// Recast doesn't export the `StatementKind` type so we need to cast the body to `Array<any>`
		code: recast.print(ast, {
			tabWidth: 4,
			trailingComma: true,
			lineTerminator: "\n",
		}).code,
		messages: migration.messages,
		imports: migration.imports,
	};
}
