/**
 * @fileoverview Type tests for ESLint Plugin Kit.
 * @author Francesco Trotta
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import {
	BooleanConfig,
	CallMethodStep,
	ConfigCommentParser,
	Directive,
	DirectiveType,
	RulesConfig,
	SourceLocation,
	SourceRange,
	StringConfig,
	TextSourceCodeBase,
	VisitNodeStep,
} from "@eslint/plugin-kit";

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

// CallMethodStep
class TestCallMethodStep extends CallMethodStep {
	constructor({ target, args }: { target: string; args: [string, number] }) {
		super({ target, args });
	}
}
const step2 = new TestCallMethodStep({ target: "foo", args: ["foo", 42] });
step2.args satisfies unknown[];
step2.kind satisfies 2;
step2.target satisfies string;
step2.type satisfies "call";

// ConfigCommentParser
const configCommentParser = new ConfigCommentParser();
configCommentParser.parseDirective("foo") satisfies
	| { label: string; value: string; justification: string }
	| undefined;
const jsonLikeConfig = configCommentParser.parseJSONLikeConfig("bar");
if (jsonLikeConfig.ok) {
	jsonLikeConfig.config satisfies RulesConfig;
} else {
	jsonLikeConfig.error.message satisfies string;
}
configCommentParser.parseListConfig("baz") satisfies BooleanConfig;
configCommentParser.parseStringConfig("qux") satisfies StringConfig;

// Directive
void ((type: "disable" | "enable" | "disable-next-line" | "disable-line") => {
	const directive = new Directive({
		type,
		node: {},
		value: "foo",
		justification: "bar",
	});
	directive.justification satisfies string;
	directive.node satisfies unknown;
	directive.type satisfies DirectiveType;
	directive.value satisfies string;
});

// TextSourceCodeBase
class TestTextSourceCode extends TextSourceCodeBase {
	declare ast: { foo: string; bar: number };
	constructor({
		text,
		ast,
	}: {
		text: string;
		ast: { foo: string; bar: number };
	}) {
		super({ text, ast, lineEndingPattern: /\r\n|[\r\n\u2028\u2029]/u });
	}
}
const sourceCode = new TestTextSourceCode({
	text: "text",
	ast: { foo: "ABC", bar: 123 },
});
sourceCode.ast satisfies { foo: string; bar: number };
sourceCode.text satisfies string;
sourceCode.lines satisfies string[];
sourceCode.getAncestors({}) satisfies object[];
sourceCode.getLoc({}) satisfies SourceLocation;
sourceCode.getLocFromIndex(0) satisfies { line: number; column: number };
sourceCode.getParent({}) satisfies object | undefined;
sourceCode.getRange({}) satisfies SourceRange;
sourceCode.getText() satisfies string;
sourceCode.getText({}, 0, 1) satisfies string;

// TextSourceCodeBase (with options)
interface CustomOptions {
	LangOptions: { option1: string; option2: boolean };
	RootNode: { type: string };
	SyntaxElementWithLoc: { value: string };
	ConfigNode: { config: string };
}
class TestTextSourceCodeWithOptions extends TextSourceCodeBase<CustomOptions> {
	declare ast: CustomOptions["RootNode"];

	constructor({
		text,
		ast,
	}: {
		text: string;
		ast: CustomOptions["RootNode"];
	}) {
		super({ text, ast });
	}
}

/* eslint-disable no-new -- Needed to test the constructor. */
new TestTextSourceCodeWithOptions({
	// @ts-expect-error Wrong type should be caught
	text: 1,
	// @ts-expect-error Wrong type should be caught
	ast: { type: true },
});
new TestTextSourceCodeWithOptions({
	// @ts-expect-error Wrong type should be caught
	text: true,
	// @ts-expect-error Wrong type should be caught
	ast: { unknown: true },
});
/* eslint-enable no-new -- Constructor test ends here. */

const sourceCodeWithOptions = new TestTextSourceCodeWithOptions({
	text: "text",
	ast: { type: "customRootNode" },
});
sourceCodeWithOptions.ast satisfies {
	type: string;
} satisfies CustomOptions["RootNode"];
sourceCodeWithOptions.text satisfies string;
sourceCodeWithOptions.lines satisfies string[];
sourceCodeWithOptions.getAncestors({ value: "" }) satisfies {
	value: string;
}[] satisfies CustomOptions["SyntaxElementWithLoc"][];
sourceCodeWithOptions.getLoc({ value: "" }) satisfies SourceLocation;
sourceCodeWithOptions.getLocFromIndex(0) satisfies {
	line: number;
	column: number;
};
sourceCodeWithOptions.getParent({ value: "" }) satisfies
	| { value: string }
	| undefined satisfies CustomOptions["SyntaxElementWithLoc"] | undefined;
sourceCodeWithOptions.getRange({ value: "" }) satisfies SourceRange;
sourceCodeWithOptions.getText() satisfies string;
sourceCodeWithOptions.getText({ value: "" }, 0, 1) satisfies string;

// @ts-expect-error Wrong type should be caught
sourceCodeWithOptions.getAncestors({});
// @ts-expect-error Wrong type should be caught
sourceCodeWithOptions.getLoc({});
// @ts-expect-error Wrong type should be caught
sourceCodeWithOptions.getLocFromIndex("foo");
// @ts-expect-error Wrong type should be caught
sourceCodeWithOptions.getParent({});
// @ts-expect-error Wrong type should be caught
sourceCodeWithOptions.getRange({});
// @ts-expect-error Wrong type should be caught
sourceCodeWithOptions.getText({}, 0, 1);

// VisitNodeStep
class TestVisitNodeStep extends VisitNodeStep {
	constructor({ target, phase }: { target: object; phase: 1 | 2 }) {
		super({ target, phase, args: ["foo", 42] });
	}
}
const step1 = new TestVisitNodeStep({ target: { foo: "bar" }, phase: 2 });
step1.args satisfies unknown[];
step1.kind satisfies 1;
step1.phase satisfies 1 | 2;
step1.target satisfies object;
step1.type satisfies "visit";
