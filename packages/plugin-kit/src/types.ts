/**
 * @fileoverview Types for the plugin-kit package.
 * @author Nicholas C. Zakas
 */

//------------------------------------------------------------------------------
// Imports
//------------------------------------------------------------------------------

import type { RuleVisitor } from "@eslint/core";

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * Adds matching `:exit` selector properties for each key of a `RuleVisitor`.
 */
export type CustomRuleVisitorWithExit<RuleVisitorType extends RuleVisitor> = {
	[Key in keyof RuleVisitorType as
		| Key
		| `${Key & string}:exit`]: RuleVisitorType[Key];
};

/**
 * A map of names to string values, or `null` when no value is provided.
 */
export type StringConfig = Record<string, string | null>;

/**
 * A map of names to boolean flags.
 */
export type BooleanConfig = Record<string, boolean>;
