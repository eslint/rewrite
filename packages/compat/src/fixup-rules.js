/**
 * @fileoverview Functions to fix up rules to provide missing methods on the `context` and `sourceCode` objects.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Types
//-----------------------------------------------------------------------------

/** @typedef {import("@eslint/core").Plugin} FixupPluginDefinition */
/** @typedef {import("@eslint/core").RuleDefinition} FixupRuleDefinition */
/** @typedef {import("@eslint/core").ConfigObject} FixupConfig */
/** @typedef {Array<FixupConfig>} FixupConfigArray */

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

/**
 * Tracks the original rule definition and the fixed-up rule definition.
 * @type {WeakMap<FixupRuleDefinition,FixupRuleDefinition>}
 */
const fixedUpRuleReplacements = new WeakMap();

/**
 * Tracks all of the fixed up rule definitions so we don't duplicate effort.
 * @type {WeakSet<FixupRuleDefinition>}
 */
const fixedUpRules = new WeakSet();

/**
 * Tracks the original plugin definition and the fixed-up plugin definition.
 * @type {WeakMap<FixupPluginDefinition,FixupPluginDefinition>}
 */
const fixedUpPluginReplacements = new WeakMap();

/**
 * Tracks all of the fixed up plugin definitions so we don't duplicate effort.
 * @type {WeakSet<FixupPluginDefinition>}
 */
const fixedUpPlugins = new WeakSet();

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Takes the given rule and creates a new rule with the `create()` method wrapped
 * to provide the missing methods on the `context` and `sourceCode` objects.
 * @param {FixupRuleDefinition} ruleDefinition The rule to fix up.
 * @returns {FixupRuleDefinition} The fixed-up rule.
 */
export function fixupRule(ruleDefinition) {
	// first check if we've already fixed up this rule
	if (fixedUpRuleReplacements.has(ruleDefinition)) {
		return fixedUpRuleReplacements.get(ruleDefinition);
	}

	// check to see if this rule definition has already been fixed up
	if (fixedUpRules.has(ruleDefinition)) {
		return ruleDefinition;
	}

	const originalCreate = ruleDefinition.create.bind(ruleDefinition);

	function ruleCreate(context) {
		// if getCwd is already there then no need to create old methods
		if ("getCwd" in context) {
			return originalCreate(context);
		}

		const sourceCode = context.sourceCode;

		const newSourceCode = Object.assign(Object.create(sourceCode), {
			getTokenOrCommentBefore(node, skip) {
				return sourceCode.getTokenBefore(node, {
					includeComments: true,
					skip,
				});
			},
			getTokenOrCommentAfter(node, skip) {
				return sourceCode.getTokenAfter(node, {
					includeComments: true,
					skip,
				});
			},
			isSpaceBetweenTokens(first, second) {
				return sourceCode.isSpaceBetween(first, second);
			},
			getJSDocComment(node) {
				function isCommentToken(token) {
					return ["Block", "Line", "Shebang"].includes(token.type);
				}

				function looksLikeExport(astNode) {
					return (
						astNode.type === "ExportDefaultDeclaration" ||
						astNode.type === "ExportNamedDeclaration" ||
						astNode.type === "ExportAllDeclaration" ||
						astNode.type === "ExportSpecifier"
					);
				}

				function findJSDocComment(astNode) {
					const tokenBefore = sourceCode.getTokenBefore(astNode, {
						includeComments: true,
					});

					if (
						tokenBefore &&
						isCommentToken(tokenBefore) &&
						tokenBefore.type === "Block" &&
						tokenBefore.value.charAt(0) === "*" &&
						astNode.loc.start.line - tokenBefore.loc.end.line <= 1
					) {
						return tokenBefore;
					}

					return null;
				}
				let parent = node.parent;

				switch (node.type) {
					case "ClassDeclaration":
					case "FunctionDeclaration":
						return findJSDocComment(
							looksLikeExport(parent) ? parent : node,
						);

					case "ClassExpression":
						return findJSDocComment(parent.parent);

					case "ArrowFunctionExpression":
					case "FunctionExpression":
						if (
							parent.type !== "CallExpression" &&
							parent.type !== "NewExpression"
						) {
							while (
								!sourceCode.getCommentsBefore(parent).length &&
								!/Function/u.test(parent.type) &&
								parent.type !== "MethodDefinition" &&
								parent.type !== "Property"
							) {
								parent = parent.parent;

								if (!parent) {
									break;
								}
							}

							if (
								parent &&
								parent.type !== "FunctionDeclaration" &&
								parent.type !== "Program"
							) {
								return findJSDocComment(parent);
							}
						}

						return findJSDocComment(node);

					default:
						return null;
				}
			},
		});

		Object.freeze(newSourceCode);

		const newContext = new Proxy(context, {
			get(target, prop, receiver) {
				switch (prop) {
					case "getCwd":
						return () => target.cwd;
					case "getFilename":
						return () => target.filename;
					case "getPhysicalFilename":
						return () => target.physicalFilename;
					case "getSourceCode":
						return () => newSourceCode;
					case "sourceCode":
						return newSourceCode;
					default:
						return Reflect.get(target, prop, receiver);
				}
			},
		});

		return originalCreate(newContext);
	}

	const newRuleDefinition = {
		...ruleDefinition,
		create: ruleCreate,
	};

	// cache the fixed up rule
	fixedUpRuleReplacements.set(ruleDefinition, newRuleDefinition);
	fixedUpRules.add(newRuleDefinition);

	return newRuleDefinition;
}

/**
 * Takes the given plugin and creates a new plugin with all of the rules wrapped
 * to provide the missing methods on the `context` and `sourceCode` objects.
 * @param {FixupPluginDefinition} plugin The plugin to fix up.
 * @returns {FixupPluginDefinition} The fixed-up plugin.
 */
export function fixupPluginRules(plugin) {
	// first check if we've already fixed up this plugin
	if (fixedUpPluginReplacements.has(plugin)) {
		return fixedUpPluginReplacements.get(plugin);
	}

	/*
	 * If the plugin has already been fixed up, or if the plugin
	 * doesn't have any rules, we can just return it.
	 */
	if (fixedUpPlugins.has(plugin) || !plugin.rules) {
		return plugin;
	}

	const newPlugin = {
		...plugin,
		rules: Object.fromEntries(
			Object.entries(plugin.rules).map(([ruleId, ruleDefinition]) => [
				ruleId,
				fixupRule(ruleDefinition),
			]),
		),
	};

	// cache the fixed up plugin
	fixedUpPluginReplacements.set(plugin, newPlugin);
	fixedUpPlugins.add(newPlugin);

	return newPlugin;
}

/**
 * Takes the given configuration and creates a new configuration with all of the
 * rules wrapped to provide the missing methods on the `context` and `sourceCode` objects.
 * @param {FixupConfigArray|FixupConfig} config The configuration to fix up.
 * @returns {FixupConfigArray} The fixed-up configuration.
 */
export function fixupConfigRules(config) {
	const configs = Array.isArray(config) ? config : [config];

	return configs.map(configItem => {
		if (!configItem.plugins) {
			return configItem;
		}

		const newPlugins = Object.fromEntries(
			Object.entries(configItem.plugins).map(([pluginName, plugin]) => [
				pluginName,
				fixupPluginRules(plugin),
			]),
		);

		return {
			...configItem,
			plugins: newPlugins,
		};
	});
}
