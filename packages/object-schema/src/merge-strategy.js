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
	 * @template TValue1 The type of the value from the first object key.
	 * @template TValue2 The type of the value from the second object key.
	 * @param {TValue1} value1 The value from the first object key.
	 * @param {TValue2} value2 The value from the second object key.
	 * @returns {TValue2} The second value.
	 */
	static overwrite(value1, value2) {
		return value2;
	}

	/**
	 * Merges two keys by replacing the first with the second only if the
	 * second is defined.
	 * @template TValue1 The type of the value from the first object key.
	 * @template TValue2 The type of the value from the second object key.
	 * @param {TValue1} value1 The value from the first object key.
	 * @param {TValue2} value2 The value from the second object key.
	 * @returns {TValue1 | TValue2} The second value if it is defined.
	 */
	static replace(value1, value2) {
		if (typeof value2 !== "undefined") {
			return value2;
		}

		return value1;
	}

	/**
	 * Merges two properties by assigning properties from the second to the first.
	 * @template {Record<string | number | symbol, unknown> | undefined} TValue1 The type of the value from the first object key.
	 * @template {Record<string | number | symbol, unknown>} TValue2 The type of the value from the second object key.
	 * @param {TValue1} value1 The value from the first object key.
	 * @param {TValue2} value2 The value from the second object key.
	 * @returns {Omit<TValue1, keyof TValue2> & TValue2} A new object containing properties from both value1 and
	 *      value2.
	 */
	static assign(value1, value2) {
		return Object.assign({}, value1, value2);
	}
}
