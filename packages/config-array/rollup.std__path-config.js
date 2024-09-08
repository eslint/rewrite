export default [
	{
		input: "../../node_modules/@jsr/std__path/posix/mod.js",
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
		input: "../../node_modules/@jsr/std__path/windows/mod.js",
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
