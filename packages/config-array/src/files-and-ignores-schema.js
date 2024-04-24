/**
 * @fileoverview ConfigSchema
 * @author Nicholas C. Zakas
 */

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Asserts that a given value is an array.
 * @param {*} value The value to check.
 * @returns {void}
 * @throws {TypeError} When the value is not an array.
 */
function assertIsArray(value) {
	if (!Array.isArray(value)) {
		throw new TypeError('Expected value to be an array.');
	}
}

/**
 * Asserts that a given value is an array containing only strings and functions.
 * @param {*} value The value to check.
 * @returns {void}
 * @throws {TypeError} When the value is not an array of strings and functions.
 */
function assertIsArrayOfStringsAndFunctions(value, name) {
	assertIsArray(value, name);

	if (value.some(item => typeof item !== 'string' && typeof item !== 'function')) {
		throw new TypeError('Expected array to only contain strings and functions.');
	}
}

/**
 * Asserts that a given value is a non-empty array.
 * @param {*} value The value to check.
 * @returns {void}
 * @throws {TypeError} When the value is not an array or an empty array.
 */
function assertIsNonEmptyArray(value) {
	if (!Array.isArray(value) || value.length === 0) {
		throw new TypeError('Expected value to be a non-empty array.');
	}
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * The schema for `files` and `ignores` that every ConfigArray uses.
 * @type Object
 */
export const filesAndIgnoresSchema = Object.freeze({
	files: {
		required: false,
		merge() {
			return undefined;
		},
		validate(value) {

			// first check if it's an array
			assertIsNonEmptyArray(value);

			// then check each member
			value.forEach(item => {
				if (Array.isArray(item)) {
					assertIsArrayOfStringsAndFunctions(item);
				} else if (typeof item !== 'string' && typeof item !== 'function') {
					throw new TypeError('Items must be a string, a function, or an array of strings and functions.');
				}
			});

		}
	},
	ignores: {
		required: false,
		merge() {
			return undefined;
		},
		validate: assertIsArrayOfStringsAndFunctions
	}
});
