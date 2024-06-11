# Use JavaScript and JSDoc with tsc

Date: 2022-10-31

Status: accepted

## Context

The [decision to rewrite the core](./001-rewrite-core.md) in a new repository brings with it the opportunity to do things differently, which naturally brought up the idea of rewriting the core in TypeScript. While TypeScript has advantages for many projects, the nature of ESLint makes this less appealing.

The ESLint project is more than just the `eslint` CLI tool. It is also [Espree](https://github.com/eslint/espree), [`eslint-scope`](https://github.com/eslint/eslint-scope), and other utilities that ESLint uses to lint JavaScript code. Part of maintaining stability in ESLint is ESLint's ability to effectively test all of these utilities every time ESLint is run. Rewriting in TypeScript would necessarily mean switching to use [`typescript-eslint`](https://typescript-eslint.io) for linting our own project, which would mean we'd no longer be dogfooding our own utilities.

## Decision

The rewrite will use JavaScript and JSDoc comments along with `tsc` to enforce type checking. This allows ESLint to continue to dogfood its own parser, scope analyzer, and related tools without foregoing the type safety that TypeScript provides. We will use TypeScript for defining interfaces where necessary, as this is more convenient than JSDoc format, but not for functionality.

Additionally, each package in the rewrite repository will publish its own types.

## Consequences

For the ESLint team, this represents an improvement over the current development process where the old core has no type checking. We will be able to catch more bugs during development time and finally have control over our own type definitions instead of whatever gets published to [DefinitelyTyped](https://definitelytyped.org/) without our knowledge.

This may frustrate or anger folks who prefer to write TypeScript and may result in fewer outside contributions to ESLint.
