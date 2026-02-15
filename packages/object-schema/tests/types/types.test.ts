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
	type ObjectDefinition,
	ObjectSchema,
	type PropertyDefinition,
} from "@eslint/object-schema";

//-----------------------------------------------------------------------------
// Tests for BuiltInValidationStrategy
//-----------------------------------------------------------------------------

const validationArray: BuiltInValidationStrategy = "array";
const validationBoolean: BuiltInValidationStrategy = "boolean";
const validationNumber: BuiltInValidationStrategy = "number";
const validationObject: BuiltInValidationStrategy = "object";
const validationObjectOptional: BuiltInValidationStrategy = "object?";
const validationString: BuiltInValidationStrategy = "string";
const validationNonEmptyString: BuiltInValidationStrategy = "string!";

// @ts-expect-error -- Invalid validation strategy
const invalidValidation: BuiltInValidationStrategy = "invalid";

//-----------------------------------------------------------------------------
// Tests for BuiltInMergeStrategy
//-----------------------------------------------------------------------------

const mergeAssign: BuiltInMergeStrategy = "assign";
const mergeOverwrite: BuiltInMergeStrategy = "overwrite";
const mergeReplace: BuiltInMergeStrategy = "replace";

// @ts-expect-error -- Invalid merge strategy
const invalidMerge: BuiltInMergeStrategy = "invalid";

//-----------------------------------------------------------------------------
// Tests for PropertyDefinition
//-----------------------------------------------------------------------------

// PropertyDefinition with built-in strategies
const propertyWithBuiltInStrategies: PropertyDefinition = {
	required: true,
	merge: "replace",
	validate: "string",
};

propertyWithBuiltInStrategies.required satisfies boolean;
propertyWithBuiltInStrategies.merge satisfies
	| BuiltInMergeStrategy
	| ((target: any, source: any) => any);
propertyWithBuiltInStrategies.validate satisfies
	| BuiltInValidationStrategy
	| ((value: any) => void);

// PropertyDefinition with custom functions
const propertyWithCustomFunctions: PropertyDefinition = {
	required: false,
	merge(target, source) {
		return source ?? target;
	},
	validate(value) {
		if (typeof value !== "string") {
			throw new TypeError("Expected a string.");
		}
	},
};

// PropertyDefinition with requires
const propertyWithRequires: PropertyDefinition = {
	required: false,
	requires: ["otherKey1", "otherKey2"],
	merge: "overwrite",
	validate: "object",
};

propertyWithRequires.requires satisfies string[] | undefined; // `requires` is optional.

// PropertyDefinition with subschema
const propertyWithSchema: PropertyDefinition = {
	required: false,
	merge: "assign",
	validate: "object",
	schema: {
		nestedKey: {
			required: true,
			merge: "replace",
			validate: "string",
		},
	},
};

propertyWithSchema.schema satisfies ObjectDefinition | undefined; // `schema` is optional.

//-----------------------------------------------------------------------------
// Tests for ObjectDefinition
//-----------------------------------------------------------------------------

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

//-----------------------------------------------------------------------------
// Tests for ObjectSchema class
//-----------------------------------------------------------------------------

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
