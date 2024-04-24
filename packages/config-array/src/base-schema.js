/**
 * @fileoverview ConfigSchema
 * @author Nicholas C. Zakas
 */

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const NOOP_STRATEGY = {
	required: false,
	merge() {
		return undefined;
	},
	validate() { }
};

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * The base schema that every ConfigArray uses.
 * @type Object
 */
export const baseSchema = Object.freeze({
	name: {
		required: false,
		merge() {
			return undefined;
		},
		validate(value) {
			if (typeof value !== 'string') {
				throw new TypeError('Property must be a string.');
			}
		}
	},
	files: NOOP_STRATEGY,
	ignores: NOOP_STRATEGY
});
