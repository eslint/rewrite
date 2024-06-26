/**
 * @fileoverview Object Schema Tests
 */

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

import assert from "node:assert";
import { ObjectSchema } from "../src/index.js";

//-----------------------------------------------------------------------------
// Class
//-----------------------------------------------------------------------------

describe("ObjectSchema", () => {
	let schema;

	describe("new ObjectSchema()", () => {
		it("should add a new key when a strategy is passed", () => {
			schema = new ObjectSchema({
				foo: {
					merge() {},
					validate() {},
				},
			});

			assert.strictEqual(schema.hasKey("foo"), true);
		});

		it("should throw an error when a strategy is missing a merge() method", () => {
			assert.throws(() => {
				schema = new ObjectSchema({
					foo: {
						validate() {},
					},
				});
			}, /Definition for key "foo" must have a merge property/u);
		});

		it("should throw an error when a strategy is missing a merge() method", () => {
			assert.throws(() => {
				schema = new ObjectSchema();
			}, /Schema definitions missing/u);
		});

		it("should throw an error when a strategy is missing a validate() method", () => {
			assert.throws(() => {
				schema = new ObjectSchema({
					foo: {
						merge() {},
					},
				});
			}, /Definition for key "foo" must have a validate\(\) method/u);
		});

		it("should throw an error when merge is an invalid string", () => {
			assert.throws(() => {
				// eslint-disable-next-line no-new -- testing whether constructor throws an error
				new ObjectSchema({
					foo: {
						merge: "bar",
						validate() {},
					},
				});
			}, /key "foo" missing valid merge strategy/u);
		});

		it("should throw an error when validate is an invalid string", () => {
			assert.throws(() => {
				// eslint-disable-next-line no-new -- testing whether constructor throws an error
				new ObjectSchema({
					foo: {
						merge: "assign",
						validate: "s",
					},
				});
			}, /key "foo" missing valid validation strategy/u);
		});
	});

	describe("merge()", () => {
		it("should throw an error when an unexpected key is found", () => {
			schema = new ObjectSchema({});

			assert.throws(() => {
				schema.merge({ foo: true }, { foo: true });
			}, /Unexpected key "foo"/u);
		});

		it("should throw an error when merge() throws an error", () => {
			schema = new ObjectSchema({
				foo: {
					merge() {
						throw new Error("Boom!");
					},
					validate() {},
				},
			});

			assert.throws(() => {
				schema.merge({ foo: true }, { foo: true });
			}, /Key "foo": Boom!/u);
		});

		it("should throw an error when merge() throws an error with a readonly message", () => {
			schema = new ObjectSchema({
				foo: {
					merge() {
						// eslint-disable-next-line no-throw-literal -- intentionally throwing an object that is not an instance of Error
						throw {
							get message() {
								return "Boom!";
							},
						};
					},
					validate() {},
				},
			});

			assert.throws(() => {
				schema.merge({ foo: true }, { foo: true });
			}, /Key "foo": Boom!/u);
		});

		it("should throw an error with custom properties when merge() throws an error with custom properties", () => {
			schema = new ObjectSchema({
				foo: {
					merge() {
						// eslint-disable-next-line no-throw-literal -- intentionally throwing an object that is not an instance of Error
						throw {
							get message() {
								return "Boom!";
							},
							booya: true,
						};
					},
					validate() {},
				},
			});

			let errorThrown = false;

			try {
				schema.merge({ foo: true }, { foo: true });
			} catch (ex) {
				errorThrown = true;
				assert.strictEqual(ex.booya, true);
			}

			assert.strictEqual(errorThrown, true);
		});

		it("should call the merge() strategy for one key when called", () => {
			schema = new ObjectSchema({
				foo: {
					merge() {
						return "bar";
					},
					validate() {},
				},
			});

			const result = schema.merge({ foo: true }, { foo: false });
			assert.strictEqual(result.foo, "bar");
		});

		it("should not call the merge() strategy when both objects don't contain the key", () => {
			let called = false;

			schema = new ObjectSchema({
				foo: {
					merge() {
						called = true;
					},
					validate() {},
				},
			});

			schema.merge({}, {});
			assert.strictEqual(
				called,
				false,
				"The merge() strategy should not have been called.",
			);
		});

		it("should omit returning the key when the merge() strategy returns undefined", () => {
			schema = new ObjectSchema({
				foo: {
					merge() {
						return undefined;
					},
					validate() {},
				},
			});

			const result = schema.merge({ foo: true }, { foo: false });
			assert.strictEqual(result.foo, undefined);
		});

		it("should call the merge() strategy for two keys when called", () => {
			schema = new ObjectSchema({
				foo: {
					merge() {
						return "bar";
					},
					validate() {},
				},
				bar: {
					merge() {
						return "baz";
					},
					validate() {},
				},
			});

			const result = schema.merge(
				{ foo: true, bar: 1 },
				{ foo: true, bar: 2 },
			);
			assert.strictEqual(result.foo, "bar");
			assert.strictEqual(result.bar, "baz");
		});

		it("should call the merge() strategy for two keys when called on three objects", () => {
			schema = new ObjectSchema({
				foo: {
					merge() {
						return "bar";
					},
					validate() {},
				},
				bar: {
					merge() {
						return "baz";
					},
					validate() {},
				},
			});

			const result = schema.merge(
				{ foo: true, bar: 1 },
				{ foo: true, bar: 3 },
				{ foo: false, bar: 2 },
			);
			assert.strictEqual(result.foo, "bar");
			assert.strictEqual(result.bar, "baz");
		});

		it("should call the merge() strategy when defined as 'overwrite'", () => {
			schema = new ObjectSchema({
				foo: {
					merge: "overwrite",
					validate() {},
				},
			});

			const result = schema.merge({ foo: true }, { foo: false });
			assert.strictEqual(result.foo, false);
		});

		it("should call the merge() strategy when defined as 'assign'", () => {
			schema = new ObjectSchema({
				foo: {
					merge: "assign",
					validate() {},
				},
			});

			const result = schema.merge(
				{ foo: { bar: true } },
				{ foo: { baz: false } },
			);

			assert.strictEqual(result.foo.bar, true);
			assert.strictEqual(result.foo.baz, false);
		});

		it("should call the merge strategy when there's a subschema", () => {
			schema = new ObjectSchema({
				name: {
					schema: {
						first: {
							merge: "replace",
							validate: "string",
						},
						last: {
							merge: "replace",
							validate: "string",
						},
					},
				},
			});

			const result = schema.merge(
				{
					name: {
						first: "n",
						last: "z",
					},
				},
				{
					name: {
						first: "g",
					},
				},
			);

			assert.strictEqual(result.name.first, "g");
			assert.strictEqual(result.name.last, "z");
		});

		it("should return separate objects when using subschema", () => {
			schema = new ObjectSchema({
				age: {
					merge: "replace",
					validate: "number",
				},
				address: {
					schema: {
						street: {
							schema: {
								number: {
									merge: "replace",
									validate: "number",
								},
								streetName: {
									merge: "replace",
									validate: "string",
								},
							},
						},
						state: {
							merge: "replace",
							validate: "string",
						},
					},
				},
			});

			const baseObject = {
				address: {
					street: {
						number: 100,
						streetName: "Foo St",
					},
					state: "HA",
				},
			};

			const result = schema.merge(baseObject, {
				age: 29,
			});

			assert.notStrictEqual(
				result.address.street,
				baseObject.address.street,
			);
			assert.deepStrictEqual(result.address, baseObject.address);
		});

		it("should not error when calling the merge strategy when there's a subschema and no matching key in second object", () => {
			schema = new ObjectSchema({
				name: {
					schema: {
						first: {
							merge: "replace",
							validate: "string",
						},
						last: {
							merge: "replace",
							validate: "string",
						},
					},
				},
			});

			const result = schema.merge(
				{
					name: {
						first: "n",
						last: "z",
					},
				},
				{},
			);

			assert.strictEqual(result.name.first, "n");
			assert.strictEqual(result.name.last, "z");
		});

		it("should not error when calling the merge strategy when there's multiple subschemas and no matching key in second object", () => {
			schema = new ObjectSchema({
				user: {
					schema: {
						name: {
							schema: {
								first: {
									merge: "replace",
									validate: "string",
								},
								last: {
									merge: "replace",
									validate: "string",
								},
							},
						},
					},
				},
			});

			const result = schema.merge(
				{
					user: {
						name: {
							first: "n",
							last: "z",
						},
					},
				},
				{},
			);

			assert.strictEqual(result.user.name.first, "n");
			assert.strictEqual(result.user.name.last, "z");
		});
	});

	describe("validate()", () => {
		it("should throw an error when an unexpected key is found", () => {
			schema = new ObjectSchema({});
			assert.throws(() => {
				schema.validate({ foo: true });
			}, /Unexpected key "foo"/u);
		});

		it("should not throw an error when an expected key is found", () => {
			schema = new ObjectSchema({
				foo: {
					merge() {
						return "bar";
					},
					validate() {},
				},
			});

			schema.validate({ foo: true });
		});

		it("should pass the property value into validate() when key is found", () => {
			schema = new ObjectSchema({
				foo: {
					merge() {
						return "bar";
					},
					validate(value) {
						assert.strictEqual(value, true);
					},
				},
			});

			schema.validate({ foo: true });
		});

		it("should not throw an error when expected keys are found", () => {
			schema = new ObjectSchema({
				foo: {
					merge() {
						return "bar";
					},
					validate() {},
				},
				bar: {
					merge() {
						return "baz";
					},
					validate() {},
				},
			});

			schema.validate({ foo: true, bar: true });
		});

		it("should not throw an error when expected keys are found with required keys", () => {
			schema = new ObjectSchema({
				foo: {
					merge() {
						return "bar";
					},
					validate() {},
				},
				bar: {
					requires: ["foo"],
					merge() {
						return "baz";
					},
					validate() {},
				},
			});

			schema.validate({ foo: true, bar: true });
		});

		it("should throw an error when expected keys are found without required keys", () => {
			schema = new ObjectSchema({
				foo: {
					merge() {
						return "bar";
					},
					validate() {},
				},
				baz: {
					merge() {
						return "baz";
					},
					validate() {},
				},
				bar: {
					name: "bar",
					requires: ["foo", "baz"],
					merge() {},
					validate() {},
				},
			});

			assert.throws(() => {
				schema.validate({ bar: true });
			}, /Key "bar" requires keys "foo", "baz"./u);
		});

		it("should throw an error when an expected key is found but is invalid", () => {
			schema = new ObjectSchema({
				foo: {
					merge() {
						return "bar";
					},
					validate() {
						throw new Error("Invalid key.");
					},
				},
			});

			assert.throws(() => {
				schema.validate({ foo: true });
			}, /Key "foo": Invalid key/u);
		});

		it("should throw an error when an expected key is found but is invalid with a string validator", () => {
			schema = new ObjectSchema({
				foo: {
					merge() {
						return "bar";
					},
					validate: "string",
				},
			});

			assert.throws(() => {
				schema.validate({ foo: true });
			}, /Key "foo": Expected a string/u);
		});

		it("should throw an error when an expected key is found but is invalid with a number validator", () => {
			schema = new ObjectSchema({
				foo: {
					merge() {
						return "bar";
					},
					validate: "number",
				},
			});

			assert.throws(() => {
				schema.validate({ foo: true });
			}, /Key "foo": Expected a number/u);
		});

		it("should throw an error when a required key is missing", () => {
			schema = new ObjectSchema({
				foo: {
					required: true,
					merge() {
						return "bar";
					},
					validate() {},
				},
			});

			assert.throws(() => {
				schema.validate({});
			}, /Missing required key "foo"/u);
		});

		it("should throw an error when a subschema is provided and the value doesn't validate", () => {
			schema = new ObjectSchema({
				name: {
					schema: {
						first: {
							merge: "replace",
							validate: "string",
						},
						last: {
							merge: "replace",
							validate: "string",
						},
					},
				},
			});

			assert.throws(() => {
				schema.validate({
					name: {
						first: 123,
						last: "z",
					},
				});
			}, /Key "name": Key "first": Expected a string/u);
		});

		it("should not throw an error when a subschema is provided and the value validates", () => {
			schema = new ObjectSchema({
				name: {
					schema: {
						first: {
							merge: "replace",
							validate: "string",
						},
						last: {
							merge: "replace",
							validate: "string",
						},
					},
				},
			});

			schema.validate({
				name: {
					first: "n",
					last: "z",
				},
			});
		});
	});
});
