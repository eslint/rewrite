/**
 * @fileoverview Types for the plugin-kit package.
 * @author Nicholas C. Zakas
 */

//------------------------------------------------------------------------------
// Imports
//------------------------------------------------------------------------------

import type { RuleDefinition, RuleDefinitionTypeOptions } from "@eslint/core";

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * Defaults for non-language-related `RuleDefinition` options.
 */
export interface CustomRuleTypeDefinitions {
	RuleOptions: unknown[];
	MessageIds: string;
	ExtRuleDocs: Record<string, unknown>;
}

/**
 * A helper type to define language specific specializations of the `RuleDefinition` type.
 *
 * @example
 * ```ts
 * type YourRuleDefinition<
 * 	Options extends Partial<CustomRuleTypeDefinitions> = {},
 * > = CustomRuleDefinitionType<
 * 	{
 * 		LangOptions: YourLanguageOptions;
 * 		Code: YourSourceCode;
 * 		Visitor: YourRuleVisitor;
 * 		Node: YourNode;
 * 	},
 * 	Options
 * >;
 * ```
 */
export type CustomRuleDefinitionType<
	LanguageSpecificOptions extends Omit<
		RuleDefinitionTypeOptions,
		keyof CustomRuleTypeDefinitions
	>,
	Options extends Partial<CustomRuleTypeDefinitions>,
> = RuleDefinition<
	// Language specific type options (non-configurable)
	LanguageSpecificOptions &
		Required<
			// Rule specific type options (custom)
			Options &
				// Rule specific type options (defaults)
				Omit<CustomRuleTypeDefinitions, keyof Options>
		>
>;

export type StringConfig = Record<string, string | null>;
export type BooleanConfig = Record<string, boolean>;
