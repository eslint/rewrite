/**
 * @fileoverview Type tests for ObjectSchema package.
 * @author Francesco Trotta
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import "@eslint/object-schema";
import { MergeStrategy } from "@eslint/object-schema";

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

// #region MergeStrategy

MergeStrategy.overwrite(1, 2) satisfies 2;
MergeStrategy.overwrite("a", "b") satisfies "b";
MergeStrategy.overwrite(true, false) satisfies false;
MergeStrategy.overwrite({ a: 1 }, { b: 2 }) satisfies { b: 2 };

// @ts-expect-error Type 'number' does not satisfy the expected type 'string'.
MergeStrategy.overwrite(1, 2) satisfies string;
// @ts-expect-error Type 'number' does not satisfy the expected type 'boolean'.
MergeStrategy.overwrite(1, 2) satisfies boolean;
// @ts-expect-error Type 'string' does not satisfy the expected type 'number'.
MergeStrategy.overwrite("a", "b") satisfies number;
// @ts-expect-error Type 'string' does not satisfy the expected type 'boolean'.
MergeStrategy.overwrite("a", "b") satisfies boolean;
// @ts-expect-error Type 'boolean' does not satisfy the expected type 'number'.
MergeStrategy.overwrite(true, false) satisfies number;
// @ts-expect-error Type 'boolean' does not satisfy the expected type 'string'.
MergeStrategy.overwrite(true, false) satisfies string;

MergeStrategy.replace(1, 2) satisfies number;
MergeStrategy.replace("a", "b") satisfies string;
MergeStrategy.replace(true, false) satisfies boolean;
MergeStrategy.replace({ a: 1 }, { b: 2 }) satisfies Record<string, number>;

// @ts-expect-error Type 'number' does not satisfy the expected type 'string'.
MergeStrategy.replace(1, 2) satisfies string;
// @ts-expect-error Type 'number' does not satisfy the expected type 'boolean'.
MergeStrategy.replace(1, 2) satisfies boolean;
// @ts-expect-error Type 'string' does not satisfy the expected type 'number'.
MergeStrategy.replace("a", "b") satisfies number;
// @ts-expect-error Type 'string' does not satisfy the expected type 'boolean'.
MergeStrategy.replace("a", "b") satisfies boolean;
// @ts-expect-error Type 'boolean' does not satisfy the expected type 'number'.
MergeStrategy.replace(true, false) satisfies number;
// @ts-expect-error Type 'boolean' does not satisfy the expected type 'string'.
MergeStrategy.replace(true, false) satisfies string;

const sym1: unique symbol = Symbol("sym1");
const sym2: unique symbol = Symbol("sym2");
MergeStrategy.assign({ [sym1]: 1 }, { [sym2]: true }) satisfies {
	[sym1]: number;
	[sym2]: boolean;
};
MergeStrategy.assign({ 1: 1 }, { 2: 2 }) satisfies {
	1: number;
	2: number;
};
MergeStrategy.assign({ a: 1 }, { b: 2 }) satisfies {
	a: number;
	b: number;
};
MergeStrategy.assign({ a: 1 } as const, { b: 2 } as const) satisfies {
	readonly a: 1;
	readonly b: 2;
};
MergeStrategy.assign({ a: 1 }, { a: "a" }) satisfies {
	a: "a";
};

// @ts-expect-error Type 'number' is not assignable to parameter of type 'Record<string | number | symbol, unknown>'.
MergeStrategy.assign(1, 2);
// @ts-expect-error Type 'string' is not assignable to parameter of type 'Record<string | number | symbol, unknown>'.
MergeStrategy.assign("a", "b");
// @ts-expect-error Type 'boolean' is not assignable to parameter of type 'Record<string | number | symbol, unknown>'.
MergeStrategy.assign(true, false);
// @ts-expect-error `{ a: "a" }` should overwrite `{ a: 1 }`.
MergeStrategy.assign({ a: 1 }, { a: "a" }) satisfies {
	a: 1;
};

// #endregion MergeStrategy
