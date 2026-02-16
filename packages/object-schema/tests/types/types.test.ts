/**
 * @fileoverview Type tests for ObjectSchema package.
 * @author Francesco Trotta
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import {
	type BuiltInMergeStrategy,
	type BuiltInValidationStrategy,
	MergeStrategy,
	type ObjectDefinition,
	ObjectSchema,
	type PropertyDefinition,
} from "@eslint/object-schema";

//-----------------------------------------------------------------------------
// Tests for BuiltInValidationStrategy
//-----------------------------------------------------------------------------

// #region BuiltInValidationStrategy

const validationArray: BuiltInValidationStrategy = "array";
const validationBoolean: BuiltInValidationStrategy = "boolean";
const validationNumber: BuiltInValidationStrategy = "number";
const validationObject: BuiltInValidationStrategy = "object";
const validationObjectOptional: BuiltInValidationStrategy = "object?";
const validationString: BuiltInValidationStrategy = "string";
const validationNonEmptyString: BuiltInValidationStrategy = "string!";

// @ts-expect-error -- Invalid validation strategy
const invalidValidation: BuiltInValidationStrategy = "invalid";

// #endregion BuiltInValidationStrategy

//-----------------------------------------------------------------------------
// Tests for BuiltInMergeStrategy
//-----------------------------------------------------------------------------

// #region BuiltInMergeStrategy

const mergeAssign: BuiltInMergeStrategy = "assign";
const mergeOverwrite: BuiltInMergeStrategy = "overwrite";
const mergeReplace: BuiltInMergeStrategy = "replace";

// @ts-expect-error -- Invalid merge strategy
const invalidMerge: BuiltInMergeStrategy = "invalid";

// #endregion BuiltInMergeStrategy

//-----------------------------------------------------------------------------
// Tests for MergeStrategy
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
MergeStrategy.assign(undefined, { bar: true }) satisfies {
	bar: true;
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

//-----------------------------------------------------------------------------
// Tests for PropertyDefinition
//-----------------------------------------------------------------------------

// #region PropertyDefinition

// PropertyDefinition with built-in strategies
const propertyWithBuiltInStrategies = {
	merge: "replace",
	validate: "string",
} satisfies PropertyDefinition;

// PropertyDefinition with a required flag
const propertyWithRequired = {
	required: true,
	merge: "replace",
	validate: "string",
} satisfies PropertyDefinition;

propertyWithBuiltInStrategies.merge satisfies
	| BuiltInMergeStrategy
	| ((target: any, source: any) => any);
propertyWithBuiltInStrategies.validate satisfies
	| BuiltInValidationStrategy
	| ((value: any) => void);
propertyWithRequired.required satisfies boolean;

// PropertyDefinition with custom functions
const propertyWithCustomFunctions = {
	merge(target, source) {
		return source ?? target;
	},
	validate(value) {
		if (typeof value !== "string") {
			throw new TypeError("Expected a string.");
		}
	},
} satisfies PropertyDefinition;

// PropertyDefinition with requires
const propertyWithRequires = {
	requires: ["otherKey1", "otherKey2"],
	merge: "overwrite",
	validate: "object",
} satisfies PropertyDefinition;

propertyWithRequires.requires satisfies string[];

// PropertyDefinition with subschema
const propertyWithSchema = {
	schema: {
		nestedKey: {
			merge: "replace",
			validate: "string",
		},
	},
} satisfies PropertyDefinition;

propertyWithSchema.schema satisfies ObjectDefinition;

// @ts-expect-error -- merge and validate are required when schema isn't present
const propertyMissingMerge: PropertyDefinition = {
	validate: "string",
};

// @ts-expect-error -- merge and validate are required when schema isn't present
const propertyMissingValidate: PropertyDefinition = {
	merge: "replace",
};

// #endregion PropertyDefinition

//-----------------------------------------------------------------------------
// Tests for ObjectDefinition
//-----------------------------------------------------------------------------

// #region ObjectDefinition

const emptyDefinition: ObjectDefinition = {};

const objectDefinition: ObjectDefinition = {
	name: {
		required: true,
		merge: "replace",
		validate: "string!",
	},
	count: {
		required: false,
		merge: "overwrite",
		validate: "number",
	},
	options: {
		required: false,
		merge: "assign",
		validate: "object?",
		schema: {
			enabled: {
				required: false,
				merge: "replace",
				validate: "boolean",
			},
		},
	},
};

objectDefinition satisfies Record<string, PropertyDefinition>;

// #endregion ObjectDefinition

//-----------------------------------------------------------------------------
// Tests for ObjectSchema class
//-----------------------------------------------------------------------------

// #region ObjectSchema

const schema = new ObjectSchema({
	name: {
		required: true,
		merge: "replace",
		validate: "string",
	},
	values: {
		required: false,
		merge: "assign",
		validate: "array",
	},
});

schema.hasKey("name") satisfies boolean;
schema.hasKey("nonexistent") satisfies boolean;

schema.merge(
	{ name: "first", values: [1, 2] },
	{ name: "second", values: [3, 4] },
);

schema.validate({ name: "test" });

// ObjectSchema with custom merge/validate functions
const schemaWithFunctions = new ObjectSchema({
	customProp: {
		required: false,
		merge(target, source) {
			return { ...target, ...source };
		},
		validate(value) {
			if (!value || typeof value !== "object") {
				throw new TypeError("Expected an object.");
			}
		},
	},
});

// ObjectSchema with subschema
const schemaWithSubschema = new ObjectSchema({
	config: {
		required: true,
		merge: "assign",
		validate: "object",
		schema: {
			setting1: {
				required: true,
				merge: "replace",
				validate: "string",
			},
			setting2: {
				required: false,
				merge: "replace",
				validate: "number",
			},
		},
	},
});

// #endregion ObjectSchema
