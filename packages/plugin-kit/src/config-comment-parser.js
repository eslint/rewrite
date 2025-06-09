/**
 * @fileoverview Config Comment Parser
 * @author Nicholas C. Zakas
 */

/* eslint class-methods-use-this: off -- Methods desired on instance */

//------------------------------------------------------------------------------
// Imports
//------------------------------------------------------------------------------

import levn from "levn";

//-----------------------------------------------------------------------------
// Type Definitions
//-----------------------------------------------------------------------------

/** @typedef {import("@eslint/core").RuleConfig} RuleConfig */
/** @typedef {import("@eslint/core").RulesConfig} RulesConfig */
/** @typedef {import("./types.ts").StringConfig} StringConfig */
/** @typedef {import("./types.ts").BooleanConfig} BooleanConfig */

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

const directivesPattern = /^([a-z]+(?:-[a-z]+)*)(?:\s|$)/u;
const validSeverities = new Set([0, 1, 2, "off", "warn", "error"]);

/**
 * Determines if the severity in the rule configuration is valid.
 * @param {RuleConfig} ruleConfig A rule's configuration.
 * @returns {boolean} `true` if the severity is valid, otherwise `false`.
 */
function isSeverityValid(ruleConfig) {
	const severity = Array.isArray(ruleConfig) ? ruleConfig[0] : ruleConfig;
	return validSeverities.has(severity);
}

/**
 * Determines if all severities in the rules configuration are valid.
 * @param {RulesConfig} rulesConfig The rules configuration to check.
 * @returns {boolean} `true` if all severities are valid, otherwise `false`.
 */
function isEverySeverityValid(rulesConfig) {
	return Object.values(rulesConfig).every(isSeverityValid);
}

/**
 * Represents a directive comment.
 */
export class DirectiveComment {
	/**
	 * The label of the directive, such as "eslint", "eslint-disable", etc.
	 * @type {string}
	 */
	label = "";

	/**
	 * The value of the directive (the string after the label).
	 * @type {string}
	 */
	value = "";

	/**
	 * The justification of the directive (the string after the --).
	 * @type {string}
	 */
	justification = "";

	/**
	 * Creates a new directive comment.
	 * @param {string} label The label of the directive.
	 * @param {string} value The value of the directive.
	 * @param {string} justification The justification of the directive.
	 */
	constructor(label, value, justification) {
		this.label = label;
		this.value = value;
		this.justification = justification;
	}
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

/**
 * Object to parse ESLint configuration comments.
 */
export class ConfigCommentParser {
	/**
	 * Parses a list of "name:string_value" or/and "name" options divided by comma or
	 * whitespace. Used for "global" comments.
	 * @param {string} string The string to parse.
	 * @returns {StringConfig} Result map object of names and string values, or null values if no value was provided.
	 */
	parseStringConfig(string) {
		const items = /** @type {StringConfig} */ ({});

		// Collapse whitespace around `:` and `,` to make parsing easier
		const trimmedString = string
			.trim()
			.replace(/(?<!\s)\s*([:,])\s*/gu, "$1");

		trimmedString.split(/\s|,+/u).forEach(name => {
			if (!name) {
				return;
			}

			// value defaults to null (if not provided), e.g: "foo" => ["foo", null]
			const [key, value = null] = name.split(":");

			items[key] = value;
		});

		return items;
	}

	/**
	 * Parses a JSON-like config.
	 * @param {string} string The string to parse.
	 * @returns {({ok: true, config: RulesConfig}|{ok: false, error: {message: string}})} Result map object
	 */
	parseJSONLikeConfig(string) {
		// Parses a JSON-like comment by the same way as parsing CLI option.
		try {
			const items =
				/** @type {RulesConfig} */ (levn.parse("Object", string)) || {};

			/*
			 * When the configuration has any invalid severities, it should be completely
			 * ignored. This is because the configuration is not valid and should not be
			 * applied.
			 *
			 * For example, the following configuration is invalid:
			 *
			 *    "no-alert: 2 no-console: 2"
			 *
			 * This results in a configuration of { "no-alert": "2 no-console: 2" }, which is
			 * not valid. In this case, the configuration should be ignored.
			 */
			if (isEverySeverityValid(items)) {
				return {
					ok: true,
					config: items,
				};
			}
		} catch {
			// levn parsing error: ignore to parse the string by a fallback.
		}

		/*
		 * Optionator cannot parse commaless notations.
		 * But we are supporting that. So this is a fallback for that.
		 */
		const normalizedString = string
			.replace(/([-a-zA-Z0-9/]+):/gu, '"$1":')
			.replace(/(\]|[0-9])\s+(?=")/u, "$1,");

		try {
			const items = JSON.parse(`{${normalizedString}}`);

			return {
				ok: true,
				config: items,
			};
		} catch (ex) {
			const errorMessage = ex instanceof Error ? ex.message : String(ex);

			return {
				ok: false,
				error: {
					message: `Failed to parse JSON from '${normalizedString}': ${errorMessage}`,
				},
			};
		}
	}

	/**
	 * Parses a config of values separated by comma.
	 * @param {string} string The string to parse.
	 * @returns {BooleanConfig} Result map of values and true values
	 */
	parseListConfig(string) {
		const items = /** @type {BooleanConfig} */ ({});

		string.split(",").forEach(name => {
			const trimmedName = name
				.trim()
				.replace(
					/^(?<quote>['"]?)(?<ruleId>.*)\k<quote>$/su,
					"$<ruleId>",
				);

			if (trimmedName) {
				items[trimmedName] = true;
			}
		});

		return items;
	}

	/**
	 * Extract the directive and the justification from a given directive comment and trim them.
	 * @param {string} value The comment text to extract.
	 * @returns {{directivePart: string, justificationPart: string}} The extracted directive and justification.
	 */
	#extractDirectiveComment(value) {
		const match = /\s-{2,}\s/u.exec(value);

		if (!match) {
			return { directivePart: value.trim(), justificationPart: "" };
		}

		const directive = value.slice(0, match.index).trim();
		const justification = value.slice(match.index + match[0].length).trim();

		return { directivePart: directive, justificationPart: justification };
	}

	/**
	 * Parses a directive comment into directive text and value.
	 * @param {string} string The string with the directive to be parsed.
	 * @returns {DirectiveComment|undefined} The parsed directive or `undefined` if the directive is invalid.
	 */
	parseDirective(string) {
		const { directivePart, justificationPart } =
			this.#extractDirectiveComment(string);
		const match = directivesPattern.exec(directivePart);

		if (!match) {
			return undefined;
		}

		const directiveText = match[1];
		const directiveValue = directivePart.slice(
			match.index + directiveText.length,
		);

		return new DirectiveComment(
			directiveText,
			directiveValue.trim(),
			justificationPart,
		);
	}
}
