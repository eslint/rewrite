/**
 * @filedescription Types for backcompat package.
 */

/*
 * NOTE: These are minimal type definitions to help avoid errors in the
 * backcompat package. They are not intended to be complete and should be
 * replaced when the actual types are available.
 */

export type FixupLegacyRuleDefinition = (context: Object) => Object;

export interface FixupRuleDefinition {
    meta?: Object;
    create(context: Object): Object;
}

export interface FixupPluginDefinition {
    meta?: Object;
    rules?: Record<string, FixupRuleDefinition>;
    configs?: Record<string, Object>;
    processors?: Record<string, Object>;
}

export interface FixupConfig {
    files?: Array<string>;
    ignores?: Array<string>;
    name?: string;
    languageOptions?: Record<string, any>;
    linterOptions?: Record<string, any>;
    processor?: string|Object;
    plugins?: Record<string, FixupPluginDefinition>;
    rules?: Record<string, any>;
}

export type FixupConfigArray = Array<FixupConfig>;
