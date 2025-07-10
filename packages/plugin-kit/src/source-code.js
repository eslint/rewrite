/**
 * @fileoverview A collection of helper classes for implementing `SourceCode`.
 * @author Nicholas C. Zakas
 */

/* eslint class-methods-use-this: off -- Required to complete interface. */

//-----------------------------------------------------------------------------
// Type Definitions
//-----------------------------------------------------------------------------

/** @typedef {import("@eslint/core").VisitTraversalStep} VisitTraversalStep */
/** @typedef {import("@eslint/core").CallTraversalStep} CallTraversalStep */
/** @typedef {import("@eslint/core").TraversalStep} TraversalStep */
/** @typedef {import("@eslint/core").SourceLocation} SourceLocation */
/** @typedef {import("@eslint/core").SourceLocationWithOffset} SourceLocationWithOffset */
/** @typedef {import("@eslint/core").SourceRange} SourceRange */
/** @typedef {import("@eslint/core").Directive} IDirective */
/** @typedef {import("@eslint/core").DirectiveType} DirectiveType */
/** @typedef {import("@eslint/core").SourceCodeBaseTypeOptions} SourceCodeBaseTypeOptions */
/**
 * @typedef {import("@eslint/core").TextSourceCode<Options>} TextSourceCode<Options>
 * @template {SourceCodeBaseTypeOptions} [Options=SourceCodeBaseTypeOptions]
 */

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * Determines if a node has ESTree-style loc information.
 * @param {object} node The node to check.
 * @returns {node is {loc:SourceLocation}} `true` if the node has ESTree-style loc information, `false` if not.
 */
function hasESTreeStyleLoc(node) {
	return "loc" in node;
}

/**
 * Determines if a node has position-style loc information.
 * @param {object} node The node to check.
 * @returns {node is {position:SourceLocation}} `true` if the node has position-style range information, `false` if not.
 */
function hasPosStyleLoc(node) {
	return "position" in node;
}

/**
 * Determines if a node has ESTree-style range information.
 * @param {object} node The node to check.
 * @returns {node is {range:SourceRange}} `true` if the node has ESTree-style range information, `false` if not.
 */
function hasESTreeStyleRange(node) {
	return "range" in node;
}

/**
 * Determines if a node has position-style range information.
 * @param {object} node The node to check.
 * @returns {node is {position:SourceLocationWithOffset}} `true` if the node has position-style range information, `false` if not.
 */
function hasPosStyleRange(node) {
	return "position" in node;
}

/**
 * Performs binary search to find the line number containing a given target index.
 * Returns the lower bound - the index of the first element greater than the target.
 * **Please note that the `lineStartIndices` should be sorted in ascending order**.
 * - Time Complexity: O(log n) - Significantly faster than linear search for large files.
 * @param {number[]} lineStartIndices Sorted array of line start indices.
 * @param {number} targetIndex The target index to find the line number for.
 * @returns {number} The line number for the target index.
 */
function findLineNumberBinarySearch(lineStartIndices, targetIndex) {
	let low = 0;
	let high = lineStartIndices.length - 1;

	while (low < high) {
		const mid = ((low + high) / 2) | 0; // Use bitwise OR to floor the division.

		if (targetIndex < lineStartIndices[mid]) {
			high = mid;
		} else {
			low = mid + 1;
		}
	}

	return low;
}

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * A class to represent a step in the traversal process where a node is visited.
 * @implements {VisitTraversalStep}
 */
export class VisitNodeStep {
	/**
	 * The type of the step.
	 * @type {"visit"}
	 * @readonly
	 */
	type = "visit";

	/**
	 * The kind of the step. Represents the same data as the `type` property
	 * but it's a number for performance.
	 * @type {1}
	 * @readonly
	 */
	kind = 1;

	/**
	 * The target of the step.
	 * @type {object}
	 */
	target;

	/**
	 * The phase of the step.
	 * @type {1|2}
	 */
	phase;

	/**
	 * The arguments of the step.
	 * @type {Array<any>}
	 */
	args;

	/**
	 * Creates a new instance.
	 * @param {Object} options The options for the step.
	 * @param {object} options.target The target of the step.
	 * @param {1|2} options.phase The phase of the step.
	 * @param {Array<any>} options.args The arguments of the step.
	 */
	constructor({ target, phase, args }) {
		this.target = target;
		this.phase = phase;
		this.args = args;
	}
}

/**
 * A class to represent a step in the traversal process where a
 * method is called.
 * @implements {CallTraversalStep}
 */
export class CallMethodStep {
	/**
	 * The type of the step.
	 * @type {"call"}
	 * @readonly
	 */
	type = "call";

	/**
	 * The kind of the step. Represents the same data as the `type` property
	 * but it's a number for performance.
	 * @type {2}
	 * @readonly
	 */
	kind = 2;

	/**
	 * The name of the method to call.
	 * @type {string}
	 */
	target;

	/**
	 * The arguments to pass to the method.
	 * @type {Array<any>}
	 */
	args;

	/**
	 * Creates a new instance.
	 * @param {Object} options The options for the step.
	 * @param {string} options.target The target of the step.
	 * @param {Array<any>} options.args The arguments of the step.
	 */
	constructor({ target, args }) {
		this.target = target;
		this.args = args;
	}
}

/**
 * A class to represent a directive comment.
 * @implements {IDirective}
 */
export class Directive {
	/**
	 * The type of directive.
	 * @type {DirectiveType}
	 * @readonly
	 */
	type;

	/**
	 * The node representing the directive.
	 * @type {unknown}
	 * @readonly
	 */
	node;

	/**
	 * Everything after the "eslint-disable" portion of the directive,
	 * but before the "--" that indicates the justification.
	 * @type {string}
	 * @readonly
	 */
	value;

	/**
	 * The justification for the directive.
	 * @type {string}
	 * @readonly
	 */
	justification;

	/**
	 * Creates a new instance.
	 * @param {Object} options The options for the directive.
	 * @param {"disable"|"enable"|"disable-next-line"|"disable-line"} options.type The type of directive.
	 * @param {unknown} options.node The node representing the directive.
	 * @param {string} options.value The value of the directive.
	 * @param {string} options.justification The justification for the directive.
	 */
	constructor({ type, node, value, justification }) {
		this.type = type;
		this.node = node;
		this.value = value;
		this.justification = justification;
	}
}

/**
 * Source Code Base Object
 * @template {SourceCodeBaseTypeOptions & {RootNode: object, SyntaxElementWithLoc: object}} [Options=SourceCodeBaseTypeOptions & {RootNode: object, SyntaxElementWithLoc: object}]
 * @implements {TextSourceCode<Options>}
 */
export class TextSourceCodeBase {
	/**
	 * The lines of text in the source code.
	 * @type {Array<string>}
	 */
	#lines = [];

	/**
	 * The indices of the start of each line in the source code.
	 * @type {Array<number>}
	 */
	#lineStartIndices = [0];

	/**
	 * The pattern to match lineEndings in the source code.
	 * @type {RegExp}
	 */
	#lineEndingPattern;

	/**
	 * The AST of the source code.
	 * @type {Options['RootNode']}
	 */
	ast;

	/**
	 * The text of the source code.
	 * @type {string}
	 */
	text;

	/**
	 * Creates a new instance.
	 * @param {Object} options The options for the instance.
	 * @param {string} options.text The source code text.
	 * @param {Options['RootNode']} options.ast The root AST node.
	 * @param {RegExp} [options.lineEndingPattern] The pattern to match lineEndings in the source code. Defaults to `/\r?\n/u`.
	 */
	constructor({ text, ast, lineEndingPattern = /\r?\n/u }) {
		this.ast = ast;
		this.text = text;
		this.#lineEndingPattern = lineEndingPattern;
	}

	/**
	 * Parses the source text into lines and updates the `#lines` and `#lineStartIndices` properties.
	 * @param {string} text The source text to parse into lines.
	 * @returns {boolean} `true` if the text was successfully parsed into lines, `false` otherwise.
	 */
	#parseText(text) {
		// Create a new RegExp instance to avoid lastIndex issues.
		const match = structuredClone(this.#lineEndingPattern).exec(text);

		if (!match) {
			return false;
		}

		this.#lines.push(text.slice(0, match.index));
		this.#lineStartIndices.push(
			(this.#lineStartIndices.at(-1) ?? 0) +
				match.index +
				match[0].length,
		);

		return true;
	}

	/**
	 * Ensures `#lines` is lazily calculated from the source text.
	 * @returns {void}
	 */
	#ensureLines() {
		// If `#lines` has already been calculated, do nothing.
		if (this.#lines.length === this.#lineStartIndices.length) {
			return;
		}

		while (
			this.#parseText(this.text.slice(this.#lineStartIndices.at(-1)))
		) {
			// Continue parsing until no more matches are found.
		}

		this.#lines.push(this.text.slice(this.#lineStartIndices.at(-1)));

		Object.freeze(this.#lines);
	}

	/**
	 * Ensures `#lineStartIndices` is lazily calculated up to the specified index.
	 * @param {number} index The index of a character in a file.
	 * @returns {void}
	 */
	#ensureLineStartIndicesFromIndex(index) {
		// If we've already parsed up to or beyond this index, do nothing.
		if (index <= (this.#lineStartIndices.at(-1) ?? 0)) {
			return;
		}

		while (
			this.#parseText(
				this.text.slice(this.#lineStartIndices.at(-1), index + 1),
			)
		) {
			// Continue parsing until no more matches are found.
		}
	}

	/**
	 * Ensures `#lineStartIndices` is lazily calculated up to the specified loc.
	 * @param {Object} loc A line/column location.
	 * @param {number} loc.line The line number of the location. (0 or 1-indexed based on language.)
	 * @param {number} lineStart The line number at which the parser starts counting.
	 * @returns {void}
	 */
	#ensureLineStartIndicesFromLoc(loc, lineStart) {
		// Calculate line indices up to the potentially next line, as it is needed for the follow‑up calculation.
		const nextLocLineIndex = loc.line - lineStart + 1;
		const lastCalculatedLineIndex = this.#lineStartIndices.length - 1;
		let additionalLinesNeeded = nextLocLineIndex - lastCalculatedLineIndex;

		// If we've already parsed up to or beyond this line, do nothing.
		if (additionalLinesNeeded <= 0) {
			return;
		}

		while (
			this.#parseText(this.text.slice(this.#lineStartIndices.at(-1))) &&
			Boolean(additionalLinesNeeded--)
		) {
			// Continue parsing until no more matches are found.
		}
	}

	/**
	 * Returns the loc information for the given node or token.
	 * @param {Options['SyntaxElementWithLoc']} nodeOrToken The node or token to get the loc information for.
	 * @returns {SourceLocation} The loc information for the node or token.
	 * @throws {Error} If the node or token does not have loc information.
	 */
	getLoc(nodeOrToken) {
		if (hasESTreeStyleLoc(nodeOrToken)) {
			return nodeOrToken.loc;
		}

		if (hasPosStyleLoc(nodeOrToken)) {
			return nodeOrToken.position;
		}

		throw new Error(
			"Custom getLoc() method must be implemented in the subclass.",
		);
	}

	/**
	 * Converts a source text index into a `{ line: number, column: number }` pair.
	 * @param {number} index The index of a character in a file.
	 * @throws {TypeError|RangeError} If non-numeric index or index out of range.
	 * @returns {{line: number, column: number}} A `{ line: number, column: number }` location object with 0 or 1-indexed line and 0 or 1-indexed column based on language.
	 * @public
	 */
	getLocFromIndex(index) {
		if (typeof index !== "number") {
			throw new TypeError("Expected `index` to be a number.");
		}

		if (index < 0 || index > this.text.length) {
			throw new RangeError(
				`Index out of range (requested index ${index}, but source text has length ${this.text.length}).`,
			);
		}

		const {
			start: { line: startLine, column: startColumn },
			end: { line: endLine, column: endColumn },
		} = this.getLoc(this.ast);

		// If the index is at the start, return the start location of the root node.
		if (index === 0) {
			return {
				line: startLine,
				column: startColumn,
			};
		}

		// If the index is `this.text.length`, return the location one "spot" past the last character of the file.
		if (index === this.text.length) {
			return {
				line: endLine,
				column: endColumn,
			};
		}

		// Ensure `#lineStartIndices` are lazily calculated.
		this.#ensureLineStartIndicesFromIndex(index);

		/*
		 * To figure out which line `index` is on, determine the last place at which index could
		 * be inserted into `#lineStartIndices` to keep the list sorted.
		 */
		const lineNumber =
			(index >= (this.#lineStartIndices.at(-1) ?? 0)
				? this.#lineStartIndices.length
				: findLineNumberBinarySearch(this.#lineStartIndices, index)) -
			1 +
			startLine;

		return {
			line: lineNumber,
			column:
				index -
				this.#lineStartIndices[lineNumber - startLine] +
				startColumn,
		};
	}

	/**
	 * Converts a `{ line: number, column: number }` pair into a source text index.
	 * @param {Object} loc A line/column location.
	 * @param {number} loc.line The line number of the location. (0 or 1-indexed based on language.)
	 * @param {number} loc.column The column number of the location. (0 or 1-indexed based on language.)
	 * @throws {TypeError|RangeError} If `loc` is not an object with a numeric
	 * `line` and `column`, if the `line` is less than or equal to zero or
	 * the `line` or `column` is out of the expected range.
	 * @returns {number} The index of the line/column location in a file.
	 * @public
	 */
	getIndexFromLoc(loc) {
		if (
			loc === null ||
			typeof loc !== "object" ||
			typeof loc.line !== "number" ||
			typeof loc.column !== "number"
		) {
			throw new TypeError(
				"Expected `loc` to be an object with numeric `line` and `column` properties.",
			);
		}

		const {
			start: { line: startLine, column: startColumn },
			end: { line: endLine, column: endColumn },
		} = this.getLoc(this.ast);

		if (loc.line < startLine || endLine < loc.line) {
			throw new RangeError(
				`Line number out of range (line ${loc.line} requested). Valid range: ${startLine}-${endLine}`,
			);
		}

		// If the loc is at the start, return the start index of the root node.
		if (loc.line === startLine && loc.column === startColumn) {
			return 0;
		}

		// If the loc is at the end, return the index one "spot" past the last character of the file.
		if (loc.line === endLine && loc.column === endColumn) {
			return this.text.length;
		}

		// Ensure `#lineStartIndices` are lazily calculated.
		this.#ensureLineStartIndicesFromLoc(loc, startLine);

		const isLastLine = loc.line === endLine;
		const lineStartIndex = this.#lineStartIndices[loc.line - startLine];
		const lineEndIndex = isLastLine
			? this.text.length
			: this.#lineStartIndices[loc.line - startLine + 1];
		const positionIndex = lineStartIndex + loc.column - startColumn;

		if (
			loc.column < startColumn ||
			(isLastLine && positionIndex > lineEndIndex) ||
			(!isLastLine && positionIndex >= lineEndIndex)
		) {
			throw new RangeError(
				`Column number out of range (column ${loc.column} requested). Valid range for line ${loc.line}: ${startColumn}-${lineEndIndex - lineStartIndex + startColumn + (isLastLine ? 0 : -1)}`,
			);
		}

		return positionIndex;
	}

	/**
	 * Returns the range information for the given node or token.
	 * @param {Options['SyntaxElementWithLoc']} nodeOrToken The node or token to get the range information for.
	 * @returns {SourceRange} The range information for the node or token.
	 * @throws {Error} If the node or token does not have range information.
	 */
	getRange(nodeOrToken) {
		if (hasESTreeStyleRange(nodeOrToken)) {
			return nodeOrToken.range;
		}

		if (hasPosStyleRange(nodeOrToken)) {
			return [
				nodeOrToken.position.start.offset,
				nodeOrToken.position.end.offset,
			];
		}

		throw new Error(
			"Custom getRange() method must be implemented in the subclass.",
		);
	}

	/* eslint-disable no-unused-vars -- Required to complete interface. */
	/**
	 * Returns the parent of the given node.
	 * @param {Options['SyntaxElementWithLoc']} node The node to get the parent of.
	 * @returns {Options['SyntaxElementWithLoc']|undefined} The parent of the node.
	 * @throws {Error} If the method is not implemented in the subclass.
	 */
	getParent(node) {
		throw new Error("Not implemented.");
	}
	/* eslint-enable no-unused-vars -- Required to complete interface. */

	/**
	 * Gets all the ancestors of a given node
	 * @param {Options['SyntaxElementWithLoc']} node The node
	 * @returns {Array<Options['SyntaxElementWithLoc']>} All the ancestor nodes in the AST, not including the provided node, starting
	 * from the root node at index 0 and going inwards to the parent node.
	 * @throws {TypeError} When `node` is missing.
	 */
	getAncestors(node) {
		if (!node) {
			throw new TypeError("Missing required argument: node.");
		}

		const ancestorsStartingAtParent = [];

		for (
			let ancestor = this.getParent(node);
			ancestor;
			ancestor = this.getParent(ancestor)
		) {
			ancestorsStartingAtParent.push(ancestor);
		}

		return ancestorsStartingAtParent.reverse();
	}

	/**
	 * Gets the source code for the given node.
	 * @param {Options['SyntaxElementWithLoc']} [node] The AST node to get the text for.
	 * @param {number} [beforeCount] The number of characters before the node to retrieve.
	 * @param {number} [afterCount] The number of characters after the node to retrieve.
	 * @returns {string} The text representing the AST node.
	 * @public
	 */
	getText(node, beforeCount, afterCount) {
		if (node) {
			const range = this.getRange(node);
			return this.text.slice(
				Math.max(range[0] - (beforeCount || 0), 0),
				range[1] + (afterCount || 0),
			);
		}
		return this.text;
	}

	/**
	 * Gets the entire source text split into an array of lines.
	 * @returns {Array<string>} The source text as an array of lines.
	 * @public
	 */
	get lines() {
		this.#ensureLines(); // Ensure `#lines` is lazily calculated.

		return this.#lines;
	}

	/**
	 * Traverse the source code and return the steps that were taken.
	 * @returns {Iterable<TraversalStep>} The steps that were taken while traversing the source code.
	 */
	traverse() {
		throw new Error("Not implemented.");
	}
}
