# Rewrite the ESLint Core

Date: 2022-10-31

Status: accepted

## Context

ESLint was first released in 2013, meaning it will be ten years old next year. During that time, the way people write JavaScript has changed dramatically and we have been using the incremental approach to updating ESLint. This has served us well, as we've been able to keep up with changes fairly quickly while building off the same basic core as in 2013. However, the current core has several problems that prevent us from moving forward with key new features:

1. **Synchronous core.** Because `Linter` is synchronous, that prevents us from allowing asynchronous rules and asynchronous parsers.
1. **Inflexible API design.** We have two APIs, `ESLint` and `Linter`, and we're forced to keep adding to these depending on use cases. For example, anything that needs to be accessible in the browser needs to be on `Linter` whether it makes sense API-wise or not.
1. **Node.js-centric.** People want to use ESLint in whatever environment they write JavaScript, whether that be a server runtime or in the browser. Being tied to the way Node.js does things prevents us from easily porting to other runtimes.
1. **JavaScript-centric.** There is a lot of logic tied to linting JavaScript when it doesn't have to be. The core should be language-agnostic.

## Decision

We will rewrite the ESLint core from scratch. The rewrite will happen in a separate repo so we can clearly distinguish between the rewritten functionality and the original. We will not aim for 100% feature parity with the original core from the start, but rather, will rebuild the core with the features we are sure we need and then rely on user feedback to identify gaps.

## Consequences

For a period of time, we will end up maintaining two versions of ESLint. This is a necessary step to ensure that we don't disrupt the normal flow of ESLint usage until we are certain that the new core is ready for production use.

When the new core is ready, we will need to be careful about the migration plan for users as we don't want to alienate folks or make it seem like too big of a change.

## See Also

- <https://github.com/eslint/eslint/discussions/16557>
