# ESLint Configuration Migrator

## Overview

This package aids in the migration of the legacy ESLint configuration file format (`.eslintrc.`) to the new ESLint configuration file format (`eslint.config.js`).

**Note:** The generated configuration file isn't guaranteed to work in all cases, but it should get you a lot closer to a working configuration file than manually trying to migrate.

## Limitations

This tool currently works well for the following config file formats:

-   `.eslintrc`
-   `.eslintrc.json`
-   `.eslintrc.yml`

If you are using a JavaScript configuration file (`.eslintrc.js`, `.eslintrc.cjs`, `.eslintrc.mjs`), this tool currently is only capable of migrating the _evaluated_ configuration. That means any logic you may have inside of the file will be lost. If your configuration file is mostly static, then you'll get a good result; if your configuration file is more complex (using functions, calculating paths, etc.) then this tool will not provide an equivalent configuration file.

## Usage

You can run this package on the command line without installing it first by using `npx` or a similar tool:

```shell
npx @eslint/migrate-config .eslintrc.json
# or
bunx @eslint/migrate-config .eslintrc.json
```

The tool will automatically find your `.eslintignore` file in the same directory and migrate that into your new configuration file.

### CommonJS Output

By default, this tool generates an ESM file (`.mjs` extension). If you'd like to generate a CommonJS file instead, pass the `--commonjs` flag:

```shell
npx @eslint/migrate-config .eslintrc.json --commonjs
# or
bunx @eslint/migrate-config .eslintrc.json --commonjs
```

## Followup Steps

Once you have completed the migration, you may need to manually modify the resulting config file.

### Double-Check Compatibility

There are some plugins that might be used with compatibility features in the output that may no longer need them. You should double-check your plugins to see if they have fully ESLint v9-compatible versions of the packages.

### `--ext`

If you are using `--ext` on the command line, such as:

```shell
npx eslint --ext .ts .
```

You'll need to remove the `--ext` from the command line and add an equivalent object into your configuration file. For example, `--ext .ts` requires an object like this in your configuration file:

```js
export default [
	{
		files: ["**/*.ts"],
	},

	// the rest of your config
];
```

This tells ESLint to search for all files ending with `.ts` when a directory is passed on the command line. You can choose to add additional properties to this object if you'd like, but it's not required.

## License

Apache 2.0
