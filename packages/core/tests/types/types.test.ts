/**
 * @fileoverview Type tests for ESLint Core.
 * @author Francesco Trotta
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import type {
	CustomRuleDefinitionType,
	CustomRuleTypeDefinitions,
	File,
	FileProblem,
	Language,
	LanguageContext,
	LanguageOptions,
	LinterOptionsConfig,
	OkParseResult,
	ParseResult,
	RuleConfig,
	RuleContext,
	RuleDefinition,
	RulesConfig,
	RulesMeta,
	RulesMetaDocs,
	RuleTextEdit,
	RuleTextEditor,
	RuleVisitor,
	SettingsConfig,
	SourceLocation,
	SourceRange,
	TextSourceCode,
	TraversalStep,
} from "@eslint/core";

//-----------------------------------------------------------------------------
// Helper types
//-----------------------------------------------------------------------------

interface TestNode {
	type: string;
	start: number;
	lenght: number;
}

interface TestRootNode {
	type: "root";
	start: number;
	length: number;
}

//-----------------------------------------------------------------------------
// Tests for config types
//-----------------------------------------------------------------------------

const emptyRules: RulesConfig = {};

const rules: RulesConfig = {
	"no-console": "error",
	"no-unused-vars": 0,
	"json/no-duplicate-keys": ["warn"],
	"css/use-baseline": [1, { available: "widely" }],
};

const emptySettings: SettingsConfig = {};

const settings: SettingsConfig = {
	foo: true,
	bar: "baz",
};

const ruleConfig1: RuleConfig = "error";
const ruleConfig2: RuleConfig = 1;
const ruleConfig3: RuleConfig = ["error", { foo: "bar" }];
const ruleConfig4: RuleConfig<string[]> = ["error", "foo", "bar"];
const ruleConfig5: RuleConfig<[{ available: "widely" | "newly" }]> = [
	"error",
	{ available: "widely" },
];
const ruleConfig6: RuleConfig<["always" | "never"]> = ["error"];

const linterConfig: LinterOptionsConfig = {
	noInlineConfig: true,
	reportUnusedDisableDirectives: "error",
	reportUnusedInlineConfigs: "warn",
};

//-----------------------------------------------------------------------------
// Tests for shared types
//-----------------------------------------------------------------------------

interface TestLanguageOptions extends LanguageOptions {
	howMuch?: "yes" | "no" | boolean;
}

class TestSourceCode
	implements
		TextSourceCode<{
			LangOptions: TestLanguageOptions;
			RootNode: TestRootNode;
			SyntaxElementWithLoc: unknown;
			ConfigNode: unknown;
		}>
{
	text: string;
	ast: TestRootNode;
	notMuch: "no" | false;
	visitorKeys?: Record<string, string[]>;

	constructor(text: string, ast: TestRootNode) {
		this.text = text;
		this.ast = ast;
		this.notMuch = false;
	}

	/* eslint-disable class-methods-use-this -- not all methods need `this` */

	getLoc(syntaxElement: { start: number; length: number }): SourceLocation {
		return {
			start: { line: 1, column: syntaxElement.start + 1 },
			end: {
				line: 1,
				column: syntaxElement.start + 1 + syntaxElement.length,
			},
		};
	}

	getRange(syntaxElement: { start: number; length: number }): SourceRange {
		return [
			syntaxElement.start,
			syntaxElement.start + syntaxElement.length,
		];
	}

	*traverse(): Iterable<TraversalStep> {
		// To be implemented.
	}

	applyLanguageOptions(languageOptions: TestLanguageOptions): void {
		if (languageOptions.howMuch === "yes") {
			this.notMuch = "no";
		}
	}

	applyInlineConfig(): {
		configs: { loc: SourceLocation; config: { rules: RulesConfig } }[];
		problems: FileProblem[];
	} {
		throw new Error("Method not implemented.");
	}

	/* eslint-enable class-methods-use-this -- not all methods need `this` */
}

//-----------------------------------------------------------------------------
// Tests for language-related types
//-----------------------------------------------------------------------------

interface TestNormalizedLanguageOptions extends TestLanguageOptions {
	howMuch: boolean; // option is required and must be a boolean
}

const testLanguage: Language = {
	fileType: "text",
	lineStart: 1,
	columnStart: 1,
	nodeTypeKey: "type",

	validateLanguageOptions(languageOptions: TestLanguageOptions): void {
		if (
			!["yes", "no", true, false, undefined].includes(
				languageOptions.howMuch,
			)
		) {
			throw Error("Invalid options.");
		}
	},

	normalizeLanguageOptions(
		languageOptions: TestLanguageOptions,
	): TestNormalizedLanguageOptions {
		const { howMuch } = languageOptions;
		return { howMuch: howMuch === "yes" || howMuch === true };
	},

	parse(
		file: File,
		context: { languageOptions: TestNormalizedLanguageOptions },
	): ParseResult<TestRootNode> {
		context.languageOptions.howMuch satisfies boolean;
		return {
			ok: true,
			ast: {
				type: "root",
				start: 0,
				length: file.body.length,
			},
		};
	},

	createSourceCode(
		file: File,
		input: OkParseResult<TestRootNode>,
		context: LanguageContext<TestNormalizedLanguageOptions>,
	): TestSourceCode {
		context.languageOptions.howMuch satisfies boolean;
		return new TestSourceCode(String(file.body), input.ast);
	},
};

testLanguage.defaultLanguageOptions satisfies LanguageOptions | undefined;

//-----------------------------------------------------------------------------
// Tests for rule-related types
//-----------------------------------------------------------------------------

interface TestRuleVisitor extends RuleVisitor {
	Node?: (node: TestNode) => void;
}

type TestMessageIds = "badFoo" | "wrongBar";

type TestRuleContext = RuleContext<{
	LangOptions: TestLanguageOptions;
	Code: TestSourceCode;
	RuleOptions: [{ foo: string; bar: number }];
	Node: TestNode;
	MessageIds: TestMessageIds;
}>;

const testRule: RuleDefinition<{
	LangOptions: TestLanguageOptions;
	Code: TestSourceCode;
	RuleOptions: [{ foo: string; bar: number }];
	Visitor: TestRuleVisitor;
	Node: TestNode;
	MessageIds: "badFoo" | "wrongBar";
	ExtRuleDocs: { baz?: boolean };
}> = {
	meta: {
		type: "problem",
		fixable: "code",
		docs: {
			recommended: true,
		},
		deprecated: {
			message: "use something else",
			url: "https://example.com",
			replacedBy: [
				{
					message: "use this instead",
					url: "https://example.com",
					rule: {
						name: "new-rule",
						url: "https://example.com/rules/new-rule",
					},
					plugin: {
						name: "new-plugin",
						url: "https://example.com/plugins/new-plugin",
					},
				},
			],
		},
		schema: [
			{
				type: "object",
				properties: {
					foo: {
						type: "string",
					},
					bar: {
						type: "integer",
					},
				},
				additionalProperties: false,
			},
		],
		defaultOptions: [{ foo: "always", bar: 5 }],
		messages: {
			badFoo: "change this foo",
			wrongBar: "fix this bar",
		},
		language: "javascript",
		dialects: ["javascript", "typescript"],
	},

	create(context: TestRuleContext): TestRuleVisitor {
		return {
			Foo(node: TestNode) {
				// node.type === "Foo"
				if (context.options[0].foo === "always") {
					context.report({
						messageId: "badFoo",
						loc: {
							start: { line: node.start, column: 1 },
							end: { line: node.start + 1, column: Infinity },
						},
						fix(fixer: RuleTextEditor): RuleTextEdit {
							return fixer.replaceText(
								node,
								context.languageOptions.howMuch === "yes"
									? "👍"
									: "👎",
							);
						},
						suggest: undefined,
					});
				}
			},
			Bar(node: TestNode) {
				// node.type === "Bar"
				context.report({
					message: "This bar is foobar",
					node,
					suggest: [
						{
							messageId: "Bar",
							fix: null,
						},
					],
				});
			},
			Baz(node: TestNode) {
				// node.type === "Baz"
				context.report({
					message: "This baz is foobar",
					loc: { line: node.start, column: 1 },
					fix: null,
					suggest: null,
				});
			},
		};
	},
};

testRule.meta satisfies RulesMeta | undefined;

const testRuleWithInvalidDefaultOptions: RuleDefinition<{
	LangOptions: TestLanguageOptions;
	Code: TestSourceCode;
	RuleOptions: [{ foo: string; bar: number }];
	Visitor: TestRuleVisitor;
	Node: TestNode;
	MessageIds: "badFoo" | "wrongBar";
	ExtRuleDocs: never;
}> = {
	meta: {
		type: "problem",
		schema: [
			{
				type: "object",
				properties: {
					foo: {
						type: "string",
					},
					bar: {
						type: "integer",
					},
				},
				additionalProperties: false,
			},
		],

		defaultOptions: [
			{
				foo: "always",
				bar: 5,
				// @ts-expect-error invalid default option "baz"
				baz: "invalid",
			},
		],
	},

	create(): TestRuleVisitor {
		return {};
	},
};

testRuleWithInvalidDefaultOptions.meta satisfies RulesMeta | undefined;

type TestRuleDefinition<
	Options extends
		Partial<CustomRuleTypeDefinitions> = CustomRuleTypeDefinitions,
> = CustomRuleDefinitionType<
	{
		LangOptions: TestLanguageOptions;
		Code: TestSourceCode;
		Visitor: TestRuleVisitor;
		Node: TestNode;
	},
	Options
>;

testRule satisfies TestRuleDefinition<{
	RuleOptions: [{ foo: string; bar: number }];
	MessageIds: "badFoo" | "wrongBar";
	ExtRuleDocs: { baz?: boolean };
}>;

export type Rule1 = TestRuleDefinition;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- empty object allowed
export type Rule2 = TestRuleDefinition<{}>;

export type Rule3 = TestRuleDefinition<{
	RuleOptions: [number, string];
	MessageIds: "foo" | "bar";
	ExtRuleDocs: { baz: number; qux: string };
}>;

// @ts-expect-error -- non-object not allowed
export type Rule4 = TestRuleDefinition<null>;

// @ts-expect-error -- non-customizable properties not allowed
export type Rule5 = TestRuleDefinition<{ Code: TestSourceCode }>;

// @ts-expect-error -- undefined value not allow for optional property (assumes `exactOptionalPropertyTypes` tsc compiler option)
export type Rule6 = TestRuleDefinition<{ RuleOptions: undefined }>;

export const shouldAllowRecommendedBoolean: RulesMetaDocs = {
	recommended: true,
}
export const shouldAllowRecommendedString: RulesMetaDocs = {
	recommended: "strict",
}

export const shouldAllowRecommendedObject: RulesMetaDocs = {
	recommended: {
		someKey: 'some value',
	}
}