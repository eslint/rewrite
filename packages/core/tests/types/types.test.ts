import type {
	File,
	FileProblem,
	Language,
	LanguageContext,
	LanguageOptions,
	OkParseResult,
	ParseResult,
	RuleContext,
	RuleDefinition,
	RulesConfig,
	RulesMeta,
	RuleTextEdit,
	RuleTextEditor,
	RuleVisitor,
	SourceLocation,
	SourceRange,
	TextSourceCode,
	TraversalStep,
} from "@eslint/core";

interface TestLanguageOptions extends LanguageOptions {
	howMuch?: "yes" | true;
}

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
	visitorKeys?: Record<string, string[]> | undefined;

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

const testLanguage: Language = {
	fileType: "text",
	lineStart: 1,
	columnStart: 1,
	nodeTypeKey: "type",
	validateLanguageOptions(languageOptions: TestLanguageOptions): void {
		if (!["yes", true, undefined].includes(languageOptions.howMuch)) {
			throw Error("Invalid options.");
		}
	},
	normalizeLanguageOptions(
		languageOptions: TestLanguageOptions,
	): TestLanguageOptions {
		return languageOptions ?? {};
	},
	parse(
		file: File,
		context: { languageOptions: TestLanguageOptions },
	): ParseResult<TestRootNode> {
		context.languageOptions.howMuch satisfies string | boolean | undefined;
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
		context: LanguageContext<TestLanguageOptions>,
	): TestSourceCode {
		context.languageOptions.howMuch satisfies string | boolean | undefined;
		return new TestSourceCode(String(file.body), input.ast);
	},
};

testLanguage.defaultLanguageOptions satisfies LanguageOptions | undefined;

interface TestRuleVisitor extends RuleVisitor {
	Node?: (node: TestNode) => void;
}

type TestRuleContext = RuleContext<{
	LangOptions: TestLanguageOptions;
	Code: TestSourceCode;
	RuleOptions: [{ foo: string; bar: number }];
	Node: TestNode;
}>;

const testRule: RuleDefinition<{
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
		fixable: "code",
		messages: {
			badFoo: "change this foo",
			wrongBar: "fix this bar",
		},
	},
	create(context: TestRuleContext): TestRuleVisitor {
		return {
			Foo(node: TestNode) {
				// node.type === "Foo"
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
				});
			},
			Bar(node: TestNode) {
				// node.type === "Bar"
				context.report({
					message: "This bar is foobar",
					node,
					suggest: [
						{
							messageId: "Bar",
						},
					],
				});
			},
		};
	},
};

testRule.meta satisfies RulesMeta | undefined;
