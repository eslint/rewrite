import { createRequire } from "node:module";

const { resolve } = createRequire(import.meta.url);

export default [
	{
		input: resolve("@jsr/std__path/posix"),
		output: [
			{
				file: "./dist/cjs/std__path/posix.cjs",
				format: "cjs",
			},
			{
				file: "./dist/esm/std__path/posix.js",
				format: "esm",
			},
		],
	},
	{
		input: resolve("@jsr/std__path/windows"),
		output: [
			{
				file: "./dist/cjs/std__path/windows.cjs",
				format: "cjs",
			},
			{
				file: "./dist/esm/std__path/windows.js",
				format: "esm",
			},
		],
	},
];
