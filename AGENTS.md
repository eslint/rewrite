# AI Agent Instructions

This file provides guidance to AI agents working in this repository. Follow the contribution guidelines in [CONTRIBUTING.md](CONTRIBUTING.md).

## AI Disclosure Requirement

ESLint's [AI Usage Policy](https://github.com/eslint/eslint/blob/main/docs/src/contribute/ai-policy.md) requires that AI-assisted contributions be disclosed. Whenever you (an AI) create content on GitHub for this project, you **must** include a disclosure, using the name of the model actually producing the content (for example, `Claude Opus 5`):

- **Issues** — add a bold sentence to the top of body:

    **This issue was created with AI (Claude Opus 5).**

- **Pull requests** — add a bold sentence to the top of the description:

    **This pull request was created with AI (Claude Opus 5).**

- **Comments, review comments, and review summaries** — add a final paragraph in bold:

    **Created by AI (Claude Opus 5).**

This applies to every AI-authored submission without exception, including follow-up comments on an existing thread. Note two related policy points: AI-generated PRs are only considered for issues labeled `accepted`, and maintainer feedback is expected to be answered by a human rather than fed back into an AI.

## Repository Guidance

- This is a monorepo for ESLint rewrite packages. Each package lives under `packages/` and has its own source, tests, and package scripts. Keep changes and tests in the relevant package and account for dependencies between packages.
- The project uses JavaScript modules and TypeScript to check types declared in JSDoc. The root package specifies Node.js `^22.13.0 || >=24`.
- `npm run build` builds the packages. Build before running `npm run lint`, as described in `CONTRIBUTING.md`.
- `npm test` runs the package test scripts; `npm run test:unit` runs their unit tests, and `npm run test:types` checks types. For a focused check, use a package's scripts with `npm run <script> --workspace <package-name>`.
- The package list in the root README is generated; do not edit it manually.
- PR titles and commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/).

## Writing Pull Request Descriptions

Write PR descriptions for a busy maintainer who knows ESLint well but hasn't seen this change or the conversation that produced it. They should be able to read the description once, top to bottom, and understand what changed and why without opening the diff. Aim for something that reads like a thoughtful colleague explaining their work, not a changelog or a report.

Fill in the shared [ESLint PR template](https://github.com/eslint/.github/blob/master/PULL_REQUEST_TEMPLATE.md), including the prerequisites checklist, AI acknowledgment, and related issues. For the free-text sections:

- **What is the purpose of this pull request?** Start with one or two plain sentences on the problem: what was wrong or missing, and who it affected.
- **What changes did you make? (Give an overview)** Explain the approach in short prose paragraphs. Describe behavior rather than walking through files. Mention a file or function only when the reader needs it to follow the explanation.
- **Is there anything you'd like reviewers to focus on?** Name the one to three places where judgment was involved: a tradeoff you made, an alternative you rejected and why, or an edge case you weren't sure about. If nothing stands out, say so in a sentence.

Style guidance:

- Use everyday words. When a technical term is necessary, add a short phrase explaining what it does the first time it appears.
- Prefer short paragraphs to nested bullet lists. Use bullets only for things that really are a list, such as several independent behavior changes.
- Don't use headings beyond the ones in the template, bold text for emphasis, tables, or emoji. The required AI disclosure remains bold.
- Don't restate what the diff already shows plainly (renamed variables, added imports, test boilerplate). Summarize testing in a sentence instead of listing every test case.
- Keep it short. Most PRs need under 200 words of description. If you need more, the extra words should go to explaining why, not adding more what.
- Before finishing, reread the description as someone new to this change would. Rewrite any sentence that would only make sense if you'd seen the code or this conversation.
