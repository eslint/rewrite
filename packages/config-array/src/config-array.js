/**
 * @fileoverview ConfigArray
 * @author Nicholas C. Zakas
 */

//------------------------------------------------------------------------------
// Imports
//------------------------------------------------------------------------------

import * as posixPath from "@jsr/std__path/posix";
import * as windowsPath from "@jsr/std__path/windows";
import { GLOBSTAR, Minimatch } from "minimatch";
import createDebug from "debug";

import { ObjectSchema } from "@eslint/object-schema";
import { baseSchema } from "./base-schema.js";
import { filesAndIgnoresSchema } from "./files-and-ignores-schema.js";

//------------------------------------------------------------------------------
// Types
//------------------------------------------------------------------------------

/** @typedef {import("./types.ts").ConfigObject} ConfigObject */
/** @typedef {import("./types.ts").FileMatcher} FileMatcher */
/** @typedef {import("./types.ts").FilesMatcher} FilesMatcher */
/** @typedef {import("./types.ts").ExtraConfigType} ExtraConfigType */
/** @typedef {import("@eslint/object-schema").ObjectDefinition} ObjectDefinition */
/** @typedef {import("minimatch").MinimatchOptions} MinimatchOptions */
/** @import * as PathImpl from "@jsr/std__path" */

/*
 * This is a bit of a hack to make TypeScript happy with the Rollup-created
 * CommonJS file. Rollup doesn't do object destructuring for imported files
 * and instead imports the default via `require()`. This messes up type checking
 * for `ObjectSchema`. To work around that, we just import the type manually
 * and give it a different name to use in the JSDoc comments.
 */
/** @typedef {ObjectSchema} ObjectSchemaInstance */

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const debug = createDebug("@eslint/config-array");

/**
 * A compiled pattern matcher entry. The regular expression is compiled from
 * the minimatch pattern via `makeRe()` so that repeated matches don't need
 * to re-split the file path the way `Minimatch#match()` does. When a pattern
 * cannot be compiled to a regular expression (comments, empty patterns,
 * syntax errors), `regexp` is `null` and the `Minimatch` instance is used
 * directly.
 * @typedef {Object} MatcherEntry
 * @property {Minimatch} matcher The minimatch instance for the pattern.
 * @property {RegExp|null} regexp The compiled regular expression, if available.
 * @property {boolean} negate True if the regular expression's raw result
 * 		should be negated to produce the match result.
 */

/**
 * A cache for pattern matchers.
 * @type {Map<string, MatcherEntry>}
 */
const minimatchCache = new Map();

/**
 * A cache for negated pattern matchers (used with `flipNegate` semantics).
 * @type {Map<string, MatcherEntry>}
 */
const negatedMinimatchCache = new Map();

/**
 * Options to use with minimatch.
 * @type {MinimatchOptions}
 */
const MINIMATCH_OPTIONS = {
	// matchBase: true,
	dot: true,
};

/**
 * Options to use with minimatch for negated patterns matched with
 * `flipNegate` semantics.
 * @type {MinimatchOptions}
 */
const NEGATED_MINIMATCH_OPTIONS = {
	dot: true,
	flipNegate: true,
};

// The character code for `!` (exclamation mark).
const EXCLAMATION_POINT_CHAR_CODE = 33;

// The character code for `/` (forward slash).
const SLASH_CHAR_CODE = 47;

/**
 * The types of config objects that are supported.
 * @type {Set<ExtraConfigType>}
 */
const CONFIG_TYPES = new Set(["array", "function"]);

/**
 * Fields that are considered metadata and not part of the config object.
 * @type {Set<string>}
 */
const META_FIELDS = new Set(["name", "basePath"]);

/**
 * A schema containing just files and ignores for early validation.
 * @type {ObjectSchemaInstance}
 */
const FILES_AND_IGNORES_SCHEMA = new ObjectSchema(filesAndIgnoresSchema);

// Precomputed constant objects returned by `ConfigArray.getConfigWithStatus`.

const CONFIG_WITH_STATUS_EXTERNAL = Object.freeze({ status: "external" });
const CONFIG_WITH_STATUS_IGNORED = Object.freeze({ status: "ignored" });
const CONFIG_WITH_STATUS_UNCONFIGURED = Object.freeze({
	status: "unconfigured",
});

// Match two leading dots followed by a slash or the end of input.
const EXTERNAL_PATH_REGEX = /^\.\.(?:\/|$)/u;

/**
 * Wrapper error for config validation errors that adds a name to the front of the
 * error message.
 */
class ConfigError extends Error {
	/**
	 * Creates a new instance.
	 * @param {string} name The config object name causing the error.
	 * @param {number} index The index of the config object in the array.
	 * @param {Object} options The options for the error.
	 * @param {Error} [options.cause] The error that caused this error.
	 * @param {string} [options.message] The message to use for the error.
	 */
	constructor(name, index, { cause, message }) {
		const finalMessage = message || cause.message;

		super(`Config ${name}: ${finalMessage}`, { cause });

		// copy over custom properties that aren't represented
		if (cause) {
			for (const key of Object.keys(cause)) {
				if (!(key in this)) {
					this[key] = cause[key];
				}
			}
		}

		/**
		 * The name of the error.
		 * @type {string}
		 * @readonly
		 */
		this.name = "ConfigError";

		/**
		 * The index of the config object in the array.
		 * @type {number}
		 * @readonly
		 */
		this.index = index;
	}
}

/**
 * Gets the name of a config object.
 * @param {ConfigObject} config The config object to get the name of.
 * @returns {string} The name of the config object.
 */
function getConfigName(config) {
	if (config && typeof config.name === "string" && config.name) {
		return `"${config.name}"`;
	}

	return "(unnamed)";
}

/**
 * Rethrows a config error with additional information about the config object.
 * @param {ConfigObject} config The config object to get the name of.
 * @param {number} index The index of the config object in the array.
 * @param {Error} error The error to rethrow.
 * @returns {void}
 * @throws {ConfigError} When the error is rethrown for a config.
 */
function rethrowConfigError(config, index, error) {
	const configName = getConfigName(config);
	throw new ConfigError(configName, index, { cause: error });
}

/**
 * Shorthand for checking if a value is a string.
 * @param {any} value The value to check.
 * @returns {value is string} True if a string, false if not.
 */
function isString(value) {
	return typeof value === "string";
}

/**
 * Creates a function that asserts that the config is valid
 * during normalization. This checks that the config is not nullish
 * and that files and ignores keys  of a config object are valid as per base schema.
 * @param {Object} config The config object to check.
 * @param {number} index The index of the config object in the array.
 * @returns {void}
 * @throws {ConfigError} If the files and ignores keys of a config object are not valid.
 */
function assertValidBaseConfig(config, index) {
	if (config === null) {
		throw new ConfigError(getConfigName(config), index, {
			message: "Unexpected null config.",
		});
	}

	if (config === undefined) {
		throw new ConfigError(getConfigName(config), index, {
			message: "Unexpected undefined config.",
		});
	}

	if (typeof config !== "object") {
		throw new ConfigError(getConfigName(config), index, {
			message: "Unexpected non-object config.",
		});
	}

	const validateConfig = {};

	if ("basePath" in config) {
		validateConfig.basePath = config.basePath;
	}

	if ("files" in config) {
		validateConfig.files = config.files;
	}

	if ("ignores" in config) {
		validateConfig.ignores = config.ignores;
	}

	try {
		FILES_AND_IGNORES_SCHEMA.validate(validateConfig);
	} catch (validationError) {
		rethrowConfigError(config, index, validationError);
	}
}

/**
 * Determines if a parsed minimatch pattern can be safely compiled to a
 * regular expression with `makeRe()`.
 *
 * `makeRe()` is lossy for patterns containing more than one globstar after
 * the first path segment: all but the first such globstar are dropped. For
 * example, a pattern made up of `a`, globstar, `b`, globstar, `c` compiles
 * to a regular expression that has lost the second globstar, and so stops
 * matching `"a/b/x/c"`. A leading globstar and a single non-leading
 * globstar both compile correctly, which covers the common patterns such as
 * `"src/**"` and those starting with a globstar.
 *
 * Excluding multi-globstar patterns additionally keeps them subject to
 * minimatch's `maxGlobstarRecursion` bound, which a whole-path regular
 * expression has no equivalent of.
 * @param {Array<Array<any>>} set The parsed pattern set from a `Minimatch` instance.
 * @returns {boolean} True if the pattern can be compiled to a regular
 * 		expression, false if `match()` must be used.
 */
function canCompileToRegExp(set) {
	for (const alternative of set) {
		let nonLeadingGlobstars = 0;

		for (let i = 1; i < alternative.length; i++) {
			if (alternative[i] === GLOBSTAR) {
				nonLeadingGlobstars++;

				if (nonLeadingGlobstars > 1) {
					return false;
				}
			}
		}
	}

	return true;
}

/**
 * Wrapper around minimatch that caches compiled patterns for
 * faster matching speed over multiple file path evaluations.
 *
 * Patterns are compiled to regular expressions via `Minimatch#makeRe()`,
 * which is significantly faster to evaluate than `Minimatch#match()`
 * because it doesn't need to split the file path into segments on
 * every call. This is safe because all paths passed here have already
 * been normalized to use forward slashes with no repeated slashes.
 * Patterns that `makeRe()` cannot represent exactly fall back to
 * `Minimatch#match()`; see `canCompileToRegExp()`.
 * @param {string} filepath The file path to match.
 * @param {string} pattern The glob pattern to match against.
 * @param {boolean} flipNegate If true, negated patterns return true on a
 * 		hit instead of being negated.
 * @returns {boolean} True if the file path matches, false if not.
 */
function doMatch(filepath, pattern, flipNegate = false) {
	const cache = flipNegate ? negatedMinimatchCache : minimatchCache;

	let entry = cache.get(pattern);

	if (entry === undefined) {
		const matcher = new Minimatch(
			pattern,
			flipNegate ? NEGATED_MINIMATCH_OPTIONS : MINIMATCH_OPTIONS,
		);

		/*
		 * `makeRe()` bakes negation into the regular expression, but the
		 * raw match result of the un-negated pattern is needed so that
		 * both negation and trailing-slash semantics can be applied
		 * afterward, so compile the pattern without its leading `!`
		 * characters.
		 */
		let start = 0;
		while (pattern.charCodeAt(start) === EXCLAMATION_POINT_CHAR_CODE) {
			start++;
		}

		const rawPattern = start === 0 ? pattern : pattern.slice(start);
		const rawMatcher =
			start === 0
				? matcher
				: new Minimatch(rawPattern, MINIMATCH_OPTIONS);

		/*
		 * For a pattern ending with a trailing globstar, `Minimatch#match()`
		 * requires at least one path segment after the head (`"a/**"` doesn't
		 * match `"a"`, though it does match `"a/"`), but `makeRe()` makes the
		 * trailing globstar optional. In that case the compiled regular
		 * expression ends with the optional globstar group (`)?$`), so
		 * making the group required restores the exact `match()` semantics.
		 * For rare patterns where this rewrite doesn't apply (e.g. brace
		 * expansions with a trailing globstar), fall back to `match()`.
		 */
		let regexp = null;

		if (canCompileToRegExp(rawMatcher.set)) {
			const hasTrailingGlobstar = rawMatcher.set.some(
				alternative =>
					alternative.length > 1 && alternative.at(-1) === GLOBSTAR,
			);

			if (!hasTrailingGlobstar) {
				regexp = rawMatcher.makeRe() || null;
			} else if (rawMatcher.set.length === 1) {
				const compiled = rawMatcher.makeRe();

				if (compiled && compiled.source.endsWith(")?$")) {
					regexp = new RegExp(
						`${compiled.source.slice(0, -2)}$`,
						compiled.flags,
					);
				}
			}
		}

		entry = {
			matcher,
			regexp,
			negate: !flipNegate && matcher.negate,
		};
		cache.set(pattern, entry);
	}

	const { regexp } = entry;

	/*
	 * The empty string requires `Minimatch#match()`'s segment-based
	 * handling, so defer to it in that case.
	 */
	if (regexp !== null && filepath !== "") {
		let matched = regexp.test(filepath);

		/*
		 * `Minimatch#match()` allows a path with a trailing slash to match
		 * a pattern without one because the trailing empty segment is
		 * ignored when the pattern runs out, so retry without the
		 * trailing slash.
		 */
		if (
			!matched &&
			filepath.charCodeAt(filepath.length - 1) === SLASH_CHAR_CODE
		) {
			matched = regexp.test(filepath.slice(0, -1));
		}

		return entry.negate ? !matched : matched;
	}

	return entry.matcher.match(filepath);
}

/**
 * Normalizes a pattern by removing the leading "./" if present.
 * @param {FileMatcher} pattern The pattern to normalize.
 * @returns {FileMatcher} The normalized pattern.
 */
function normalizePattern(pattern) {
	if (isString(pattern)) {
		if (pattern.startsWith("./")) {
			return pattern.slice(2);
		}

		if (pattern.startsWith("!./")) {
			return `!${pattern.slice(3)}`;
		}
	}

	return pattern;
}

/**
 * Checks if a given pattern requires normalization.
 * @param {any} pattern The pattern to check.
 * @returns {boolean} True if the pattern needs normalization, false otherwise.
 */
function needsPatternNormalization(pattern) {
	return (
		isString(pattern) &&
		(pattern.startsWith("./") || pattern.startsWith("!./"))
	);
}

/**
 * Normalizes `files` and `ignores` patterns in a config by removing "./" prefixes.
 * @param {Object} config The config object to normalize patterns in.
 * @param {string} namespacedBasePath The namespaced base path of the directory to which config base path is relative.
 * @param {PathImpl} path Path-handling implementation.
 * @returns {Object} The normalized config object.
 */
function normalizeConfigPatterns(config, namespacedBasePath, path) {
	if (!config) {
		return config;
	}

	const hasBasePath = typeof config.basePath === "string";

	let needsNormalization = false;

	if (hasBasePath) {
		needsNormalization = true;
	}

	if (!needsNormalization && Array.isArray(config.files)) {
		needsNormalization = config.files.some(pattern => {
			if (Array.isArray(pattern)) {
				return pattern.some(needsPatternNormalization);
			}
			return needsPatternNormalization(pattern);
		});
	}

	if (!needsNormalization && Array.isArray(config.ignores)) {
		needsNormalization = config.ignores.some(needsPatternNormalization);
	}

	if (!needsNormalization) {
		return config;
	}

	const newConfig = { ...config };

	if (hasBasePath) {
		if (path.isAbsolute(config.basePath)) {
			newConfig.basePath = path.toNamespacedPath(config.basePath);
		} else {
			newConfig.basePath = path.resolve(
				namespacedBasePath,
				config.basePath,
			);
		}
	}

	if (Array.isArray(newConfig.files)) {
		newConfig.files = newConfig.files.map(pattern => {
			if (Array.isArray(pattern)) {
				return pattern.map(normalizePattern);
			}
			return normalizePattern(pattern);
		});
	}

	if (Array.isArray(newConfig.ignores)) {
		newConfig.ignores = newConfig.ignores.map(normalizePattern);
	}

	return newConfig;
}

/**
 * Normalizes a `ConfigArray` by flattening it and executing any functions
 * that are found inside.
 * @param {Array} items The items in a `ConfigArray`.
 * @param {Object} context The context object to pass into any function
 *      found.
 * @param {ReadonlyArray<ExtraConfigType>} extraConfigTypes The config types to check.
 * @param {string} namespacedBasePath The namespaced base path of the directory to which config base paths are relative.
 * @param {PathImpl} path Path-handling implementation.
 * @returns {Promise<Array>} A flattened array containing only config objects.
 * @throws {TypeError} When a config function returns a function.
 */
async function normalize(
	items,
	context,
	extraConfigTypes,
	namespacedBasePath,
	path,
) {
	const allowFunctions = extraConfigTypes.includes("function");
	const allowArrays = extraConfigTypes.includes("array");

	/**
	 * Recursively flattens items and resolves config functions into config objects.
	 * @param {Array} array The array to traverse.
	 * @returns {AsyncGenerator<Object, void, void>} Async generator yielding config objects.
	 * @throws {TypeError} If functions or arrays are not allowed, or if a config function returns another function.
	 */
	async function* flatTraverse(array) {
		for (let item of array) {
			if (typeof item === "function") {
				if (!allowFunctions) {
					throw new TypeError("Unexpected function.");
				}

				item = item(context);
				if (item.then) {
					item = await item;
				}
			}

			if (Array.isArray(item)) {
				if (!allowArrays) {
					throw new TypeError("Unexpected array.");
				}
				yield* flatTraverse(item);
			} else if (typeof item === "function") {
				throw new TypeError(
					"A config function can only return an object or array.",
				);
			} else {
				yield item;
			}
		}
	}

	/*
	 * Async iterables cannot be used with the spread operator, so we need to manually
	 * create the array to return.
	 */
	const asyncIterable = flatTraverse(items);
	const configs = [];

	for await (const config of asyncIterable) {
		configs.push(normalizeConfigPatterns(config, namespacedBasePath, path));
	}

	return configs;
}

/**
 * Normalizes a `ConfigArray` by flattening it and executing any functions
 * that are found inside.
 * @param {Array} items The items in a `ConfigArray`.
 * @param {Object} context The context object to pass into any function
 *      found.
 * @param {ReadonlyArray<ExtraConfigType>} extraConfigTypes The config types to check.
 * @param {string} namespacedBasePath The namespaced base path of the directory to which config base paths are relative.
 * @param {PathImpl} path Path-handling implementation
 * @returns {Array} A flattened array containing only config objects.
 * @throws {TypeError} When a config function returns a function.
 */
function normalizeSync(
	items,
	context,
	extraConfigTypes,
	namespacedBasePath,
	path,
) {
	const allowFunctions = extraConfigTypes.includes("function");
	const allowArrays = extraConfigTypes.includes("array");

	/**
	 * Recursively flattens items and resolves config functions into config objects.
	 * @param {Array} array The array to traverse.
	 * @returns {Generator<Object, void, void>} Generator yielding config objects.
	 * @throws {TypeError} If functions or arrays are not allowed, if a config function returns another function, or if it returns a promise.
	 */
	function* flatTraverse(array) {
		for (let item of array) {
			if (typeof item === "function") {
				if (!allowFunctions) {
					throw new TypeError("Unexpected function.");
				}

				item = item(context);
				if (item.then) {
					throw new TypeError(
						"Async config functions are not supported.",
					);
				}
			}

			if (Array.isArray(item)) {
				if (!allowArrays) {
					throw new TypeError("Unexpected array.");
				}

				yield* flatTraverse(item);
			} else if (typeof item === "function") {
				throw new TypeError(
					"A config function can only return an object or array.",
				);
			} else {
				yield item;
			}
		}
	}

	const configs = [];

	for (const config of flatTraverse(items)) {
		configs.push(normalizeConfigPatterns(config, namespacedBasePath, path));
	}

	return configs;
}

// Detects repeated slashes or `.`/`..` segments in an absolute posix path.
const POSIX_UNSAFE_SEGMENT_REGEX = /\/\/|\/\.{1,2}(?:\/|$)/u;

/**
 * Computes the posix relative path between two already-resolved absolute
 * paths. This is a port of the `relative()` implementation from
 * `@jsr/std__path/posix` without the redundant `resolve()` calls, for use
 * when both paths are known to be normalized absolute paths.
 * @param {string} from The resolved path to start from.
 * @param {string} to The resolved path to reach.
 * @returns {string} The relative path.
 */
function posixRelativeResolved(from, to) {
	if (from === to) {
		return "";
	}

	const fromEnd = from.length;
	const fromLen = fromEnd - 1;
	const toEnd = to.length;
	const toLen = toEnd - 1;

	// Compare paths to find the longest common path from root
	const length = fromLen < toLen ? fromLen : toLen;
	let lastCommonSep = -1;
	let i = 0;
	for (; i <= length; ++i) {
		if (i === length) {
			if (toLen > length) {
				if (to.charCodeAt(1 + i) === SLASH_CHAR_CODE) {
					// `from` is the exact base path for `to`
					return to.slice(2 + i);
				}

				if (i === 0) {
					// `from` is the root
					return to.slice(1 + i);
				}
			} else if (fromLen > length) {
				if (from.charCodeAt(1 + i) === SLASH_CHAR_CODE) {
					// `to` is the exact base path for `from`
					lastCommonSep = i;
				} else if (i === 0) {
					// `to` is the root
					lastCommonSep = 0;
				}
			}
			break;
		}
		const fromCode = from.charCodeAt(1 + i);
		if (fromCode !== to.charCodeAt(1 + i)) {
			break;
		} else if (fromCode === SLASH_CHAR_CODE) {
			lastCommonSep = i;
		}
	}

	let out = "";

	// Generate the relative path based on the path difference between
	// `to` and `from`
	for (i = 2 + lastCommonSep; i <= fromEnd; ++i) {
		if (i === fromEnd || from.charCodeAt(i) === SLASH_CHAR_CODE) {
			out += out.length === 0 ? ".." : "/..";
		}
	}

	// Lastly, append the rest of the destination (`to`) path that comes
	// after the common path parts
	if (out.length > 0) {
		return out + to.slice(1 + lastCommonSep);
	}

	let toStart = 1 + lastCommonSep;
	if (to.charCodeAt(toStart) === SLASH_CHAR_CODE) {
		++toStart;
	}
	return to.slice(toStart);
}

/**
 * Fast path for computing a posix relative path when the given path is
 * an already-normalized absolute path.
 * @param {string} filePath The absolute path to convert.
 * @param {string} basePath The absolute base path to compute the relative path against.
 * @returns {string|undefined} The relative path, or `undefined` if the fast
 * 		path cannot be used and the caller must fall back to full resolution.
 */
function fastPosixRelative(filePath, basePath) {
	if (
		filePath.charCodeAt(0) !== SLASH_CHAR_CODE ||
		POSIX_UNSAFE_SEGMENT_REGEX.test(filePath)
	) {
		return undefined;
	}

	// a single trailing slash is dropped by path resolution
	let end = filePath.length;
	if (end > 1 && filePath.charCodeAt(end - 1) === SLASH_CHAR_CODE) {
		end--;
	}

	if (basePath === "/") {
		return filePath.slice(1, end);
	}

	const baseLength = basePath.length;

	if (
		basePath.charCodeAt(0) !== SLASH_CHAR_CODE ||
		basePath.charCodeAt(baseLength - 1) === SLASH_CHAR_CODE ||
		POSIX_UNSAFE_SEGMENT_REGEX.test(basePath)
	) {
		return undefined;
	}

	// the common case: the path is inside the base path
	if (filePath.startsWith(basePath)) {
		if (end === baseLength) {
			return "";
		}

		if (filePath.charCodeAt(baseLength) === SLASH_CHAR_CODE) {
			return filePath.slice(baseLength + 1, end);
		}
	}

	// both paths are normalized absolute paths at this point
	return posixRelativeResolved(
		basePath,
		end === filePath.length ? filePath : filePath.slice(0, end),
	);
}

/**
 * Converts a given path to a relative path with all separator characters replaced by forward slashes (`"/"`).
 * @param {string} fileOrDirPath The unprocessed path to convert.
 * @param {string} namespacedBasePath The namespaced base path of the directory to which the calculated path shall be relative.
 * @param {PathImpl} path Path-handling implementations.
 * @returns {string} A relative path with all separator characters replaced by forward slashes.
 */
function toRelativePath(fileOrDirPath, namespacedBasePath, path) {
	if (path === posixPath) {
		const fastResult = fastPosixRelative(fileOrDirPath, namespacedBasePath);

		if (fastResult !== undefined) {
			return fastResult;
		}
	}

	const fullPath = path.resolve(namespacedBasePath, fileOrDirPath);
	const namespacedFullPath = path.toNamespacedPath(fullPath);
	const relativePath = path.relative(namespacedBasePath, namespacedFullPath);
	return relativePath.replaceAll(path.SEPARATOR, "/");
}

/**
 * Applies a list of ignore matchers to a file path, honoring negated
 * patterns, starting from a previous ignore state.
 * @param {FileMatcher[]} ignores The ignore matchers to apply.
 * @param {string} filePath The unprocessed file path to pass to functions.
 * @param {string} relativeFilePathToCheck The relative file path to match patterns against.
 * @param {boolean} initialShouldIgnore The ignore state to start from.
 * @returns {boolean} True if the path should be ignored and false if not.
 */
function matchesIgnores(
	ignores,
	filePath,
	relativeFilePathToCheck,
	initialShouldIgnore,
) {
	let shouldIgnore = initialShouldIgnore;

	for (let i = 0; i < ignores.length; i++) {
		const matcher = ignores[i];

		if (!shouldIgnore) {
			if (typeof matcher === "function") {
				shouldIgnore = matcher(filePath);
			} else if (matcher.charCodeAt(0) !== EXCLAMATION_POINT_CHAR_CODE) {
				shouldIgnore = doMatch(relativeFilePathToCheck, matcher);
			} else {
				// don't check negated patterns because we're not ignored yet
				shouldIgnore = false;
			}
			continue;
		}

		// only need to check negated patterns because we're ignored
		if (
			typeof matcher === "string" &&
			matcher.charCodeAt(0) === EXCLAMATION_POINT_CHAR_CODE
		) {
			shouldIgnore = !doMatch(relativeFilePathToCheck, matcher, true);
		}
	}

	return shouldIgnore;
}

/**
 * Determines if a given file path should be ignored based on the given
 * matcher.
 * @param {Array<{ basePath?: string, ignores: FileMatcher[] }>} configs Configuration objects containing `ignores`.
 * @param {string} filePath The unprocessed file path to check.
 * @param {string} relativeFilePath The path of the file to check relative to the base path,
 * 		using forward slash (`"/"`) as a separator.
 * @param {Object} [basePathData] Additional data needed to recalculate paths for configuration objects
 *  	that have `basePath` property.
 * @param {string} [basePathData.basePath] Namespaced path to which `relativeFilePath` is relative.
 * @param {PathImpl} [basePathData.path] Path-handling implementation.
 * @returns {boolean} True if the path should be ignored and false if not.
 */
function shouldIgnorePath(
	configs,
	filePath,
	relativeFilePath,
	{ basePath, path } = {},
) {
	let shouldIgnore = false;

	// lazily computed absolute version of `relativeFilePath`
	let fullFilePath = null;

	for (const config of configs) {
		let relativeFilePathToCheck = relativeFilePath;
		if (config.basePath) {
			if (fullFilePath === null) {
				/*
				 * `relativeFilePath` is always a normalized relative path with
				 * forward slashes, so on posix systems it can simply be
				 * appended to the base path. If the result contains any
				 * unexpected segments, `toRelativePath()` normalizes it.
				 */
				fullFilePath =
					path === posixPath
						? `${basePath === "/" ? "" : basePath}/${relativeFilePath}`
						: path.resolve(basePath, relativeFilePath);
			}

			relativeFilePathToCheck = toRelativePath(
				fullFilePath,
				config.basePath,
				path,
			);

			if (
				relativeFilePathToCheck === "" ||
				EXTERNAL_PATH_REGEX.test(relativeFilePathToCheck)
			) {
				continue;
			}

			if (relativeFilePath.endsWith("/")) {
				relativeFilePathToCheck += "/";
			}
		}
		shouldIgnore = matchesIgnores(
			config.ignores,
			filePath,
			relativeFilePathToCheck,
			shouldIgnore,
		);
	}

	return shouldIgnore;
}

/**
 * Matches a single file matcher against the provided file path.
 * @param {string} filePath The unprocessed file path to pass to functions.
 * @param {string} relativeFilePath The relative file path to match string patterns against.
 * @param {FileMatcher} pattern The matcher pattern or function.
 * @returns {boolean} True if the string pattern matches `relativeFilePath` or the matcher function returns true for `filePath`, false otherwise.
 * @throws {TypeError} If the matcher is not a string or function.
 */
function matchFilePattern(filePath, relativeFilePath, pattern) {
	if (isString(pattern)) {
		return doMatch(relativeFilePath, pattern);
	}

	if (typeof pattern === "function") {
		return pattern(filePath);
	}

	throw new TypeError(`Unexpected matcher type ${pattern}.`);
}

/**
 * Determines if a given file path is matched by the given `files` patterns,
 * excluding any matches from `ignores`.
 * @param {string} filePath The unprocessed file path to check.
 * @param {string} relativeFilePath The path of the file to check relative to the base path,
 * 		using forward slash (`"/"`) as a separator.
 * @param {FilesMatcher[]} files The `files` patterns to match against.
 * @param {FileMatcher[]|undefined} ignores The `ignores` patterns to exclude, if any.
 * @returns {boolean} True if the file path is matched by the patterns,
 *      false if not.
 */
function pathMatchesFiles(filePath, relativeFilePath, files, ignores) {
	// check for all matches to files
	let filePathMatchesPattern = false;

	for (let i = 0; i < files.length; i++) {
		const pattern = files[i];

		if (Array.isArray(pattern)) {
			let matchesAll = true;

			for (let j = 0; j < pattern.length; j++) {
				if (!matchFilePattern(filePath, relativeFilePath, pattern[j])) {
					matchesAll = false;
					break;
				}
			}

			if (matchesAll) {
				filePathMatchesPattern = true;
				break;
			}
		} else if (matchFilePattern(filePath, relativeFilePath, pattern)) {
			filePathMatchesPattern = true;
			break;
		}
	}

	/*
	 * If the file path matches the files patterns, then check to see
	 * if there are any files to ignore. `relativeFilePath` is already
	 * relative to any config `basePath`, so ignores are matched directly.
	 */
	if (filePathMatchesPattern && ignores) {
		filePathMatchesPattern = !matchesIgnores(
			ignores,
			filePath,
			relativeFilePath,
			false,
		);
	}

	return filePathMatchesPattern;
}

/*
 * Pattern to detect universal file patterns: `*`, patterns starting with
 * `!`, or patterns ending with `/*` or `/**`.
 */
const UNIVERSAL_PATTERN_REGEX = /^\*$|^!|\/\*{1,2}$/u;

/**
 * Derived information about a config object that is expensive to compute
 * on every file path lookup, so it's computed once per config object and
 * cached.
 * @typedef {Object} ConfigMetadata
 * @property {boolean} isGlobalIgnores True if the config object only has
 * 		`ignores` (aside from meta fields) and therefore acts as global ignores.
 * @property {FilesMatcher[]|null} universalFiles The universal patterns found
 * 		in `files`, or `null` if the config has no `files`.
 * @property {FilesMatcher[]|null} nonUniversalFiles The non-universal patterns
 * 		found in `files`, or `null` if the config has no `files`.
 */

/**
 * A cache for config object metadata.
 * @type {WeakMap<Object, ConfigMetadata>}
 */
const configMetadataCache = new WeakMap();

/**
 * Calculates derived information about a config object.
 * @param {Object} config The config object to calculate metadata for.
 * @returns {ConfigMetadata} The metadata for the config object.
 */
function calculateConfigMetadata(config) {
	const metadata = {
		isGlobalIgnores: false,
		universalFiles: null,
		nonUniversalFiles: null,
	};

	if (config.files) {
		/*
		 * If a config has a files pattern * or patterns ending in /** or /*,
		 * and the filePath only matches those patterns, then the config is only
		 * applied if there is another config where the filePath matches
		 * a file with a specific extensions such as *.js.
		 */
		const universalFiles = [];
		const nonUniversalFiles = [];

		for (const element of config.files) {
			if (Array.isArray(element)) {
				/*
				 * filePath matches an element that is an array only if it matches
				 * all patterns in it (AND operation). Therefore, if there is at least
				 * one non-universal pattern in the array, and filePath matches the array,
				 * then we know for sure that filePath matches at least one non-universal
				 * pattern, so we can consider the entire array to be non-universal.
				 * In other words, all patterns in the array need to be universal
				 * for it to be considered universal.
				 */
				if (
					element.every(pattern =>
						UNIVERSAL_PATTERN_REGEX.test(pattern),
					)
				) {
					universalFiles.push(element);
				} else {
					nonUniversalFiles.push(element);
				}
			} else if (UNIVERSAL_PATTERN_REGEX.test(element)) {
				universalFiles.push(element);
			} else {
				nonUniversalFiles.push(element);
			}
		}

		metadata.universalFiles = universalFiles;
		metadata.nonUniversalFiles = nonUniversalFiles;
	} else if (config.ignores) {
		/*
		 * We only count ignores as global if there are no other keys in the
		 * object aside from meta fields. In this case, the config acts like
		 * a globally ignored pattern. If there are additional keys, then
		 * ignores act like exclusions.
		 */
		let nonMetaKeyCount = 0;

		for (const key of Object.keys(config)) {
			if (!META_FIELDS.has(key)) {
				nonMetaKeyCount++;
			}
		}

		metadata.isGlobalIgnores = nonMetaKeyCount === 1;
	}

	return metadata;
}

/**
 * Retrieves cached metadata for a config object, calculating it first
 * if not already cached.
 * @param {Object} config The config object to get metadata for.
 * @returns {ConfigMetadata} The metadata for the config object.
 */
function getConfigMetadata(config) {
	// non-object configs cannot be used as WeakMap keys
	if (typeof config !== "object" || config === null) {
		return calculateConfigMetadata(Object(config));
	}

	let metadata = configMetadataCache.get(config);

	if (metadata === undefined) {
		metadata = calculateConfigMetadata(config);
		configMetadataCache.set(config, metadata);
	}

	return metadata;
}

/**
 * Ensures that a ConfigArray has been normalized.
 * @param {ConfigArray} configArray The ConfigArray to check.
 * @returns {void}
 * @throws {Error} When the `ConfigArray` is not normalized.
 */
function assertNormalized(configArray) {
	// TODO: Throw more verbose error
	if (!configArray.isNormalized()) {
		throw new Error(
			"ConfigArray must be normalized to perform this operation.",
		);
	}
}

/**
 * Ensures that config types are valid.
 * @param {ReadonlyArray<ExtraConfigType>} extraConfigTypes The config types to check.
 * @returns {void}
 * @throws {TypeError} When the config types array is invalid.
 */
function assertExtraConfigTypes(extraConfigTypes) {
	if (!Array.isArray(extraConfigTypes)) {
		throw new TypeError("extraConfigTypes must be an array.");
	}

	if (extraConfigTypes.length > 2) {
		throw new TypeError("extraConfigTypes must contain at most two items.");
	}

	for (const configType of extraConfigTypes) {
		if (!CONFIG_TYPES.has(configType)) {
			throw new TypeError(
				`Unexpected config type "${configType}" in extraConfigTypes. Expected one of: "array", "function".`,
			);
		}
	}
}

/**
 * Returns path-handling implementations for Unix or Windows, depending on a given absolute path.
 * @param {string} fileOrDirPath The absolute path to check.
 * @returns {PathImpl} Path-handling implementations for the specified path.
 * @throws {Error} An error is thrown if the specified argument is not an absolute path.
 */
function getPathImpl(fileOrDirPath) {
	// Posix absolute paths always start with a slash.
	if (fileOrDirPath.startsWith("/")) {
		return posixPath;
	}

	// Windows absolute paths start with a letter followed by a colon and at least one backslash,
	// or with two backslashes in the case of UNC paths.
	// Forward slashed are automatically normalized to backslashes.
	if (/^(?:[A-Za-z]:[/\\]|[/\\]{2})/u.test(fileOrDirPath)) {
		return windowsPath;
	}

	throw new Error(
		`Expected an absolute path but received "${fileOrDirPath}"`,
	);
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

export const ConfigArraySymbol = {
	isNormalized: Symbol("isNormalized"),
	configCache: Symbol("configCache"),
	schema: Symbol("schema"),
	finalizeConfig: Symbol("finalizeConfig"),
	preprocessConfig: Symbol("preprocessConfig"),
};

// used to store calculate data for faster lookup
const dataCache = new WeakMap();

/**
 * Represents an array of config objects and provides method for working with
 * those config objects.
 */
export class ConfigArray extends Array {
	/**
	 * The namespaced path of the config file directory.
	 * @type {string}
	 */
	#namespacedBasePath;

	/**
	 * Path-handling implementations.
	 * @type {PathImpl}
	 */
	#path;

	/**
	 * Creates a new instance of ConfigArray.
	 * @param {Iterable|Function|Object} configs An iterable yielding config
	 *      objects, or a config function, or a config object.
	 * @param {Object} options The options for the ConfigArray.
	 * @param {string} [options.basePath="/"] The absolute path of the config file directory.
	 * 		Defaults to `"/"`.
	 * @param {boolean} [options.normalized=false] Flag indicating if the
	 *      configs have already been normalized.
	 * @param {ObjectDefinition} [options.schema] The additional schema
	 *      definitions to use for the ConfigArray schema.
	 * @param {ReadonlyArray<ExtraConfigType>} [options.extraConfigTypes] List of config types supported.
	 * @throws {TypeError} When the `basePath` is not a non-empty string,
	 */
	constructor(
		configs,
		{
			basePath = "/",
			normalized = false,
			schema: customSchema,
			extraConfigTypes = [],
		} = {},
	) {
		super();

		/**
		 * Tracks if the array has been normalized.
		 * @type {boolean}
		 * @private
		 */
		this[ConfigArraySymbol.isNormalized] = normalized;

		/**
		 * The schema used for validating and merging configs.
		 * @type {ObjectSchemaInstance}
		 * @private
		 */
		this[ConfigArraySymbol.schema] = new ObjectSchema(
			Object.assign({}, customSchema, baseSchema),
		);

		if (!isString(basePath) || !basePath) {
			throw new TypeError("basePath must be a non-empty string");
		}

		/**
		 * The path of the config file that this array was loaded from.
		 * This is used to calculate filename matches.
		 * @type {string}
		 */
		this.basePath = basePath;

		assertExtraConfigTypes(extraConfigTypes);

		/**
		 * The supported config types.
		 * @type {ReadonlyArray<ExtraConfigType>}
		 */
		this.extraConfigTypes = [...extraConfigTypes];
		Object.freeze(this.extraConfigTypes);

		/**
		 * A cache to store calculated configs for faster repeat lookup.
		 * @type {Map<string, Object>}
		 * @private
		 */
		this[ConfigArraySymbol.configCache] = new Map();

		// init cache
		dataCache.set(this, {
			explicitMatches: new Map(),
			directoryMatches: new Map(),
			files: undefined,
			ignores: undefined,
		});

		// load the configs into this array
		if (Array.isArray(configs)) {
			this.push(...configs);
		} else {
			this.push(configs);
		}

		// select path-handling implementations depending on the base path
		this.#path = getPathImpl(basePath);

		// On Windows, `path.relative()` returns an absolute path when given two paths on different drives.
		// The namespaced base path is useful to make sure that calculated relative paths are always relative.
		// On Unix, it is identical to the base path.
		this.#namespacedBasePath = this.#path.toNamespacedPath(basePath);
	}

	/**
	 * Prevent normal array methods from creating a new `ConfigArray` instance.
	 * This is to ensure that methods such as `slice()` won't try to create a
	 * new instance of `ConfigArray` behind the scenes as doing so may throw
	 * an error due to the different constructor signature.
	 * @type {ArrayConstructor} The `Array` constructor.
	 */
	static get [Symbol.species]() {
		return Array;
	}

	/**
	 * Returns the `files` globs from every config object in the array.
	 * This can be used to determine which files will be matched by a
	 * config array or to use as a glob pattern when no patterns are provided
	 * for a command line interface.
	 * @returns {Array<FilesMatcher>} An array of matchers.
	 */
	get files() {
		assertNormalized(this);

		// if this data has been cached, retrieve it
		const cache = dataCache.get(this);

		if (cache.files) {
			return cache.files;
		}

		// otherwise calculate it

		const result = [];

		for (const config of this) {
			if (config.files) {
				config.files.forEach(filePattern => {
					result.push(filePattern);
				});
			}
		}

		// store result
		cache.files = result;
		dataCache.set(this, cache);

		return result;
	}

	/**
	 * Returns ignore matchers that should always be ignored regardless of
	 * the matching `files` fields in any configs. This is necessary to mimic
	 * the behavior of things like .gitignore and .eslintignore, allowing a
	 * globbing operation to be faster.
	 * @returns {Array<{ basePath?: string, name?: string, ignores: FileMatcher[] }>} An array of config objects representing global ignores.
	 */
	get ignores() {
		assertNormalized(this);

		// if this data has been cached, retrieve it
		const cache = dataCache.get(this);

		if (cache.ignores) {
			return cache.ignores;
		}

		// otherwise calculate it

		const result = [];

		for (const config of this) {
			/*
			 * We only count ignores if there are no other keys in the object.
			 * In this case, it acts like a globally ignored pattern. If there
			 * are additional keys, then ignores act like exclusions.
			 */
			if (config.ignores && getConfigMetadata(config).isGlobalIgnores) {
				result.push(config);
			}
		}

		// store result
		cache.ignores = result;
		dataCache.set(this, cache);

		return result;
	}

	/**
	 * Indicates if the config array has been normalized.
	 * @returns {boolean} True if the config array is normalized, false if not.
	 */
	isNormalized() {
		return this[ConfigArraySymbol.isNormalized];
	}

	/**
	 * Normalizes a config array by flattening embedded arrays and executing
	 * config functions.
	 * @param {Object} [context] The context object for config functions.
	 * @returns {Promise<ConfigArray>} The current ConfigArray instance.
	 */
	async normalize(context = {}) {
		if (!this.isNormalized()) {
			const normalizedConfigs = await normalize(
				this,
				context,
				this.extraConfigTypes,
				this.#namespacedBasePath,
				this.#path,
			);
			this.length = 0;
			this.push(
				...normalizedConfigs.map(
					this[ConfigArraySymbol.preprocessConfig].bind(this),
				),
			);
			this.forEach(assertValidBaseConfig);
			this[ConfigArraySymbol.isNormalized] = true;

			// prevent further changes
			Object.freeze(this);
		}

		return this;
	}

	/**
	 * Normalizes a config array by flattening embedded arrays and executing
	 * config functions.
	 * @param {Object} [context] The context object for config functions.
	 * @returns {ConfigArray} The current ConfigArray instance.
	 */
	normalizeSync(context = {}) {
		if (!this.isNormalized()) {
			const normalizedConfigs = normalizeSync(
				this,
				context,
				this.extraConfigTypes,
				this.#namespacedBasePath,
				this.#path,
			);
			this.length = 0;
			this.push(
				...normalizedConfigs.map(
					this[ConfigArraySymbol.preprocessConfig].bind(this),
				),
			);
			this.forEach(assertValidBaseConfig);
			this[ConfigArraySymbol.isNormalized] = true;

			// prevent further changes
			Object.freeze(this);
		}

		return this;
	}

	/* eslint-disable class-methods-use-this -- Desired as instance methods */

	/**
	 * Finalizes the state of a config before being cached and returned by
	 * `getConfig()`. Does nothing by default but is provided to be
	 * overridden by subclasses as necessary.
	 * @param {Object} config The config to finalize.
	 * @returns {Object} The finalized config.
	 */
	// Cast key to `never` to prevent TypeScript from adding the signature `[x: symbol]: (config: any) => any` to the type of the class.
	[/** @type {never} */ (ConfigArraySymbol.finalizeConfig)](config) {
		return config;
	}

	/**
	 * Preprocesses a config during the normalization process. This is the
	 * method to override if you want to convert an array item before it is
	 * validated for the first time. For example, if you want to replace a
	 * string with an object, this is the method to override.
	 * @param {Object} config The config to preprocess.
	 * @returns {Object} The config to use in place of the argument.
	 */
	// Cast key to `never` to prevent TypeScript from adding the signature `[x: symbol]: (config: any) => any` to the type of the class.
	[/** @type {never} */ (ConfigArraySymbol.preprocessConfig)](config) {
		return config;
	}

	/* eslint-enable class-methods-use-this -- Desired as instance methods */

	/**
	 * Returns the config object for a given file path and a status that can be used to determine why a file has no config.
	 * @param {string} filePath The path of a file to get a config for.
	 * @returns {{ config?: Object, status: "ignored"|"external"|"unconfigured"|"matched" }}
	 * An object with an optional property `config` and property `status`.
	 * `config` is the config object for the specified file as returned by {@linkcode ConfigArray.getConfig},
	 * `status` a is one of the constants returned by {@linkcode ConfigArray.getConfigStatus}.
	 */
	getConfigWithStatus(filePath) {
		assertNormalized(this);

		const cache = this[ConfigArraySymbol.configCache];

		// first check the cache for a filename match to avoid duplicate work
		const cachedConfigWithStatus = cache.get(filePath);

		if (cachedConfigWithStatus) {
			return cachedConfigWithStatus;
		}

		// check to see if the file is outside the base path

		const relativeToBaseFilePath = toRelativePath(
			filePath,
			this.#namespacedBasePath,
			this.#path,
		);

		if (EXTERNAL_PATH_REGEX.test(relativeToBaseFilePath)) {
			if (debug.enabled) {
				debug(`No config for file ${filePath} outside of base path`);
			}

			// cache and return result
			cache.set(filePath, CONFIG_WITH_STATUS_EXTERNAL);
			return CONFIG_WITH_STATUS_EXTERNAL;
		}

		// next check to see if the file should be ignored

		// check if this should be ignored due to its directory
		if (this.isDirectoryIgnored(this.#path.dirname(filePath))) {
			if (debug.enabled) {
				debug(`Ignoring ${filePath} based on directory pattern`);
			}

			// cache and return result
			cache.set(filePath, CONFIG_WITH_STATUS_IGNORED);
			return CONFIG_WITH_STATUS_IGNORED;
		}

		if (
			shouldIgnorePath(this.ignores, filePath, relativeToBaseFilePath, {
				basePath: this.#namespacedBasePath,
				path: this.#path,
			})
		) {
			if (debug.enabled) {
				debug(`Ignoring ${filePath} based on file pattern`);
			}

			// cache and return result
			cache.set(filePath, CONFIG_WITH_STATUS_IGNORED);
			return CONFIG_WITH_STATUS_IGNORED;
		}

		// filePath isn't automatically ignored, so try to construct config

		const matchingConfigIndices = [];
		let matchFound = false;
		const debugEnabled = debug.enabled;

		// lazily computed absolute version of `filePath`
		let fullFilePath = null;

		for (let index = 0; index < this.length; index++) {
			const config = this[index];
			let relativeFilePath = relativeToBaseFilePath;

			if (config.basePath) {
				if (fullFilePath === null) {
					/*
					 * `relativeToBaseFilePath` is always a normalized relative
					 * path with forward slashes, so on posix systems it can
					 * simply be appended to the base path. If the result
					 * contains any unexpected segments, `toRelativePath()`
					 * normalizes it.
					 */
					fullFilePath =
						this.#path === posixPath
							? `${this.#namespacedBasePath === "/" ? "" : this.#namespacedBasePath}/${relativeToBaseFilePath}`
							: this.#path.resolve(
									this.#namespacedBasePath,
									filePath,
								);
				}

				relativeFilePath = toRelativePath(
					fullFilePath,
					config.basePath,
					this.#path,
				);

				if (EXTERNAL_PATH_REGEX.test(relativeFilePath)) {
					if (debugEnabled) {
						debug(
							`Skipped config found for ${filePath} (based on config's base path: ${config.basePath}`,
						);
					}
					continue;
				}
			}

			const metadata = getConfigMetadata(config);

			if (!config.files) {
				if (!config.ignores) {
					if (debugEnabled) {
						debug(`Universal config found for ${filePath}`);
					}
					matchingConfigIndices.push(index);
					continue;
				}

				if (metadata.isGlobalIgnores) {
					if (debugEnabled) {
						debug(
							`Skipped config found for ${filePath} (global ignores)`,
						);
					}
					continue;
				}

				/*
				 * `relativeFilePath` is already calculated as relative to the
				 * config's `basePath`, so ignores are matched directly.
				 */
				if (
					matchesIgnores(
						config.ignores,
						filePath,
						relativeFilePath,
						false,
					)
				) {
					if (debugEnabled) {
						debug(
							`Skipped config found for ${filePath} (based on ignores: ${config.ignores})`,
						);
					}
					continue;
				}

				if (debugEnabled) {
					debug(
						`Matching config found for ${filePath} (based on ignores: ${config.ignores})`,
					);
				}
				matchingConfigIndices.push(index);
				continue;
			}

			const { universalFiles, nonUniversalFiles } = metadata;

			// universal patterns were found so we need to check the config twice
			if (universalFiles.length) {
				if (debugEnabled) {
					debug(
						"Universal files patterns found. Checking carefully.",
					);
				}

				// check that the config matches without the non-universal files first
				if (
					nonUniversalFiles.length &&
					pathMatchesFiles(
						filePath,
						relativeFilePath,
						nonUniversalFiles,
						config.ignores,
					)
				) {
					if (debugEnabled) {
						debug(`Matching config found for ${filePath}`);
					}
					matchingConfigIndices.push(index);
					matchFound = true;
					continue;
				}

				// if there wasn't a match then check if it matches with universal files
				if (
					pathMatchesFiles(
						filePath,
						relativeFilePath,
						universalFiles,
						config.ignores,
					)
				) {
					if (debugEnabled) {
						debug(`Matching config found for ${filePath}`);
					}
					matchingConfigIndices.push(index);
					continue;
				}

				// if we make it here, then there was no match
				continue;
			}

			// the normal case
			if (
				pathMatchesFiles(
					filePath,
					relativeFilePath,
					config.files,
					config.ignores,
				)
			) {
				if (debugEnabled) {
					debug(`Matching config found for ${filePath}`);
				}
				matchingConfigIndices.push(index);
				matchFound = true;
			}
		}

		// if matching both files and ignores, there will be no config to create
		if (!matchFound) {
			debug(`No matching configs found for ${filePath}`);

			// cache and return result
			cache.set(filePath, CONFIG_WITH_STATUS_UNCONFIGURED);
			return CONFIG_WITH_STATUS_UNCONFIGURED;
		}

		// check to see if there is a config cached by indices
		const indicesKey = matchingConfigIndices.toString();
		let configWithStatus = cache.get(indicesKey);

		if (configWithStatus) {
			// also store for filename for faster lookup next time
			cache.set(filePath, configWithStatus);

			return configWithStatus;
		}

		// otherwise construct the config

		// eslint-disable-next-line array-callback-return, consistent-return -- rethrowConfigError always throws an error
		let finalConfig = matchingConfigIndices.reduce((result, index) => {
			try {
				return this[ConfigArraySymbol.schema].merge(
					result,
					this[index],
				);
			} catch (validationError) {
				rethrowConfigError(this[index], index, validationError);
			}
		}, {});

		finalConfig = this[ConfigArraySymbol.finalizeConfig](finalConfig);

		configWithStatus = Object.freeze({
			config: finalConfig,
			status: "matched",
		});
		cache.set(filePath, configWithStatus);
		cache.set(indicesKey, configWithStatus);

		return configWithStatus;
	}

	/**
	 * Returns the config object for a given file path.
	 * @param {string} filePath The path of a file to get a config for.
	 * @returns {Object|undefined} The config object for this file or `undefined`.
	 */
	getConfig(filePath) {
		return this.getConfigWithStatus(filePath).config;
	}

	/**
	 * Determines whether a file has a config or why it doesn't.
	 * @param {string} filePath The path of the file to check.
	 * @returns {"ignored"|"external"|"unconfigured"|"matched"} One of the following values:
	 * * `"ignored"`: the file is ignored
	 * * `"external"`: the file is outside the base path
	 * * `"unconfigured"`: the file is not matched by any config
	 * * `"matched"`: the file has a matching config
	 */
	getConfigStatus(filePath) {
		return this.getConfigWithStatus(filePath).status;
	}

	/**
	 * Determines if the given filepath is ignored based on the configs.
	 * @param {string} filePath The path of a file to check.
	 * @returns {boolean} True if the path is ignored, false if not.
	 * @deprecated Use `isFileIgnored` instead.
	 */
	isIgnored(filePath) {
		return this.isFileIgnored(filePath);
	}

	/**
	 * Determines if the given filepath is ignored based on the configs.
	 * @param {string} filePath The path of a file to check.
	 * @returns {boolean} True if the path is ignored, false if not.
	 */
	isFileIgnored(filePath) {
		return this.getConfigStatus(filePath) === "ignored";
	}

	/**
	 * Determines if the given directory is ignored based on the configs.
	 * This checks only default `ignores` that don't have `files` in the
	 * same config. A pattern such as `/foo` be considered to ignore the directory
	 * while a pattern such as `/foo/**` is not considered to ignore the
	 * directory because it is matching files.
	 * @param {string} directoryPath The path of a directory to check.
	 * @returns {boolean} True if the directory is ignored, false if not. Will
	 * 		return true for any directory that is not inside of `basePath`.
	 * @throws {Error} When the `ConfigArray` is not normalized.
	 */
	isDirectoryIgnored(directoryPath) {
		assertNormalized(this);

		const relativeDirectoryPath = toRelativePath(
			directoryPath,
			this.#namespacedBasePath,
			this.#path,
		);

		// basePath directory can never be ignored
		if (relativeDirectoryPath === "") {
			return false;
		}

		if (EXTERNAL_PATH_REGEX.test(relativeDirectoryPath)) {
			return true;
		}

		// first check the cache
		const cache = dataCache.get(this).directoryMatches;

		if (cache.has(relativeDirectoryPath)) {
			return cache.get(relativeDirectoryPath);
		}

		const directoryParts = relativeDirectoryPath.split("/");
		const partCount = directoryParts.length;
		let partIndex = 0;
		let relativeDirectoryToCheck = "";
		let result;

		/*
		 * In order to get the correct gitignore-style ignores, where an
		 * ignored parent directory cannot have any descendants unignored,
		 * we need to check every directory starting at the parent all
		 * the way down to the actual requested directory.
		 *
		 * We aggressively cache all of this info to make sure we don't
		 * have to recalculate everything for every call.
		 */
		do {
			relativeDirectoryToCheck += `${directoryParts[partIndex++]}/`;

			result = cache.get(relativeDirectoryToCheck);

			if (result === undefined) {
				result = shouldIgnorePath(
					this.ignores,
					this.#path.join(this.basePath, relativeDirectoryToCheck),
					relativeDirectoryToCheck,
					{
						basePath: this.#namespacedBasePath,
						path: this.#path,
					},
				);

				cache.set(relativeDirectoryToCheck, result);
			}
		} while (!result && partIndex < partCount);

		// also cache the result for the requested path
		cache.set(relativeDirectoryPath, result);

		return result;
	}
}
