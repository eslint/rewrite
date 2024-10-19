# Contributing

Please be sure to read the contribution guidelines before making or requesting a change.

## Code of Conduct

This project adheres to the [OpenJS Foundation Code of Conduct](https://eslint.org/conduct). We kindly request that you read over our code of conduct before contributing.

## Commands

### Building

[Rollup](https://rollupjs.org) and [TypeScript](https://www.typescriptlang.org) are used to turn source files in `packages/*/src/` into outputs in `packages/*/dist/`.

```shell
npm run build
```

### Linting

ESLint is linted using ESLint.
[Building](#building) the project must be done before it can lint itself.

```shell
npm run lint
```

### Type Checking

This project is written in JavaScript and uses [TypeScript](https://www.typescriptlang.org) to validate types declared in JSDoc comments.

```shell
npm run test:types
```

Add `--watch` to run in a "watch" mode:

```shell
npm run test:types -- --watch
```
