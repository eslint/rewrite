/**
 * @fileoverview Merge Strategy
 */

//-----------------------------------------------------------------------------
// Class
//-----------------------------------------------------------------------------

/**
 * Container class for several different merge strategies.
 */
export class MergeStrategy {
	/**
	 * Merges two keys by overwriting the first with the second.
	 * @param {any} value1 The value from the first object key.
	 * @param {any} value2 The value from the second object key.
	 * @returns {any} The second value.
	 */
	static overwrite(value1, value2) {
		return value2;
	}

	/**
	 * Merges two keys by replacing the first with the second only if the
	 * second is defined.
	 * @param {any} value1 The value from the first object key.
	 * @param {any} value2 The value from the second object key.
	 * @returns {any} The second value if it is defined.
	 */
	static replace(value1, value2) {
		if (typeof value2 !== "undefined") {
			return value2;
		}

		return value1;
	}

	/**
	 * Merges two properties by assigning properties from the second to the first.
	 * @param {any} value1 The value from the first object key.
	 * @param {any} value2 The value from the second object key.
	 * @returns {any} A new object containing properties from both value1 and
	 *      value2.
	 */
	static assign(value1, value2) {
		return Object.assign({}, value1, value2);
	}
}
