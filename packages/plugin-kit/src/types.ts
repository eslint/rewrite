/**
 * @fileoverview Types for the plugin-kit package.
 * @author Nicholas C. Zakas
 */

import type { LanguageOptions } from "@eslint/core";

export type StringConfig = Record<string, string | null>;
export type BooleanConfig = Record<string, boolean>;

export interface SourceCodeBaseTypeOptions {
	LangOptions: LanguageOptions;
	RootNode: unknown;
	SyntaxElementWithLoc: object;
	ConfigNode: unknown;
}
