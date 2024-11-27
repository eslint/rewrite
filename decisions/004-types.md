# Handling Type Definitions for ESLint

Date: 2024-06-27

Status: accepted

## Context

The `@types/eslint` package was created without consulting the ESLint team, leading to expectations for our APIs to conform to its definitions. This situation has caused some frustration as it affects how users interact with ESLint and its ecosystem. To address this, we need a clear strategy for managing type definitions moving forward.

## Decision

### 1. Core Rewrite and Types in `@eslint/core`

The core rewrite will produce its own types in `@eslint/core`, likely featuring a significantly different API from the current one. This approach will ensure that we have full control over the type definitions and can design them according to the needs of the rewritten core. This will avoid the need to have a separate package for types.

### 2. Interim Type Definitions Convergence

In the interim, `@types/eslint` should pull in type definitions from `@eslint/core` where applicable. This will help us start converging type definitions and ensure consistency. Types such as `Position`, `SourceLocation`, `RuleSeverity`, `Language`, etc., will be defined in `@eslint/core` and used by `@types/eslint`. We will seek to gradually increase the number of types that `@types/eslint` uses from `@eslint/core`, but `@types/eslint` will still contain the canonical source of truth for types related to ESLint v9.x API.

### 3. Maintaining `@types/eslint`

We do not intend to take over full maintenance of `@types/eslint`. Instead, we will focus on ensuring compatibility where necessary while maintaining control over our core types in `@eslint/core`. This strategy allows us to avoid dependence on DefinitelyTyped for changes and ensures our type definitions remain accurate and up-to-date.

## Consequences

For the ESLint team, this decision will:

- Ensure we have control over our type definitions.
- Allow us to design a more coherent and well-integrated type system in the new `@eslint/core`.
- Provide a clear path for integrating these types with `@types/eslint`, improving consistency across the ecosystem.

For the community, this decision may:

- Require adjustments to adapt to the new type definitions in `@eslint/core`.
- Improve the accuracy and reliability of type definitions used in ESLint-related projects.

We recognize that this may frustrate or anger some contributors, but we believe that this approach balances the need for accurate type definitions with the practicalities of maintaining a complex project like ESLint.
