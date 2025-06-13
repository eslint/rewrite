/**
 * @fileoverview ConfigSchema
 * @author Nicholas C. Zakas
 */

//------------------------------------------------------------------------------
// Types
//------------------------------------------------------------------------------

/** @typedef {import("@eslint/object-schema").PropertyDefinition} PropertyDefinition */
/** @typedef {import("@eslint/object-schema").ObjectDefinition} ObjectDefinition */

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * A strategy that does nothing.
 * @type {PropertyDefinition}
 */
const NOOP_STRATEGY = {
	required: false,
	merge() {
		return undefined;
	},
	validate() {},
};

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * The base schema that every ConfigArray uses.
 * @type {ObjectDefinition}
 */
export const baseSchema = Object.freeze({
	name: {
		required: false,
		merge() {
			return undefined;
		},
		validate(value) {
			if (typeof value !== "string") {
				throw new TypeError("Property must be a string.");
			}
		},
	},
	basePath: NOOP_STRATEGY,
	files: NOOP_STRATEGY,
	ignores: NOOP_STRATEGY,
});
