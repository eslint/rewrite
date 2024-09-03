/**
 * @todo This should be contributed up to DefinitelyTyped to make a `@types/levn` package.
 */
declare module "levn" {
	export interface ParseOptions {
		explicit?: boolean | undefined;
		customTypes?: Record<string, CustomParseType>;
	}

	export interface CustomParseType<Value = unknown> {
		typeOf: string;
		validate: (value: unknown) => boolean;
		cast: (value: unknown) => CastedValue<Value>;
	}

	export interface CastedValue<Value = unknown> {
		type: string;
		value: Value;
	}

	// TODO: This comes from type-check.
	export type ParsedType = unknown;

	export function parse(
		type: string,
		string: string,
		options?: unknown,
	): unknown;

	export function parsedTypeParse(
		parsedType: string,
		options?: unknown,
	): unknown;

	export const VERSION: string;
}
