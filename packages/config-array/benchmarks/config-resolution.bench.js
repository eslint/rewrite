/**
 * @fileoverview Benchmark for ConfigArray config resolution.
 *
 * Measures the cost of `getConfigWithStatus()` and `isDirectoryIgnored()`
 * across many unique file paths against a realistic flat-config-style
 * config array. Each run uses a fresh `ConfigArray` instance so that the
 * per-path result cache doesn't hide resolution cost; a second pass over
 * the same paths exercises the cache-hit path.
 *
 * Usage:
 *   node benchmarks/config-resolution.bench.js [--windows] [--runs=N]
 *
 * Options:
 *   --windows   Use Windows-style paths (drive letter and backslashes).
 *   --runs=N    Number of timed runs (default 100).
 *
 * @author Nicholas C. Zakas
 */

//------------------------------------------------------------------------------
// Imports
//------------------------------------------------------------------------------

import { performance } from "node:perf_hooks";
import { ConfigArray } from "../src/index.js";

//------------------------------------------------------------------------------
// Options
//------------------------------------------------------------------------------

const useWindowsPaths = process.argv.includes("--windows");
const runsArg = process.argv.find(arg => arg.startsWith("--runs="));
const RUNS = runsArg ? Number(runsArg.slice("--runs=".length)) : 100;
const WARMUP_RUNS = 10;
const FILE_COUNT = 1500;
const DIRECTORY_CHECK_COUNT = 50;

const BASE_PATH = useWindowsPaths ? "C:\\project" : "/project";
const SEPARATOR = useWindowsPaths ? "\\" : "/";

//------------------------------------------------------------------------------
// Fixtures
//------------------------------------------------------------------------------

/**
 * A schema for the custom config keys used by the fixture configs.
 * @type {Object}
 */
const customSchema = {
	languageOptions: {
		required: false,
		merge(a = {}, b = {}) {
			return { ...a, ...b };
		},
		validate() {},
	},
	rules: {
		required: false,
		merge(a = {}, b = {}) {
			return { ...a, ...b };
		},
		validate() {},
	},
};

/**
 * Creates a realistic flat-config-style array of config objects.
 * @returns {Array<Object>} The config objects.
 */
function makeConfigs() {
	return [
		// global ignores
		{
			ignores: [
				"**/node_modules/",
				"dist/**",
				"coverage/**",
				"**/*.min.js",
				"!dist/keep.js",
			],
		},

		// universal config
		{
			name: "base",
			languageOptions: { ecmaVersion: 2026 },
		},

		// all JS files
		{
			name: "js",
			files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
			ignores: ["**/*.config.js"],
			rules: { semi: 2, quotes: 1 },
		},

		// TS files
		{
			name: "ts",
			files: ["src/**/*.ts", "src/**/*.tsx"],
			rules: { "no-var": 2 },
		},

		// tests, including an AND pattern
		{
			name: "tests",
			files: ["tests/**/*.js", ["**/*.test.js", "tests/**"]],
			rules: { "prefer-const": 1 },
		},

		// universal pattern config (triggers universal files handling)
		{
			name: "universal-src",
			files: ["src/**"],
			rules: { "no-console": 1 },
		},

		// config with a base path
		{
			name: "based",
			basePath: "packages/lib",
			files: ["**/*.js"],
			rules: { "no-alert": 2 },
		},

		// markdown files
		{
			name: "docs",
			files: ["docs/**/*.md"],
			rules: {},
		},
	];
}

/**
 * Creates a list of mostly-unique file paths that are a mix of matched,
 * ignored, and unconfigured files.
 * @returns {Array<string>} The file paths.
 */
function makeFilePaths() {
	const dirs = [
		"src",
		"src/components",
		"src/utils/deep/nested",
		"tests",
		"tests/unit",
		"lib",
		"docs",
		"packages/lib/src",
		"node_modules/foo",
		"dist/assets",
		"coverage/lcov",
	];
	const exts = [
		".js",
		".mjs",
		".ts",
		".tsx",
		".md",
		".txt",
		".test.js",
		".min.js",
		".config.js",
	];
	const paths = [];

	for (let i = 0; i < FILE_COUNT; i++) {
		const dir = dirs[i % dirs.length].replaceAll("/", SEPARATOR);
		const ext = exts[i % exts.length];

		paths.push(`${BASE_PATH}${SEPARATOR}${dir}${SEPARATOR}file${i}${ext}`);
	}

	return paths;
}

const filePaths = makeFilePaths();

//------------------------------------------------------------------------------
// Benchmark
//------------------------------------------------------------------------------

/**
 * Runs one full resolution pass over all file paths with a fresh
 * `ConfigArray` instance.
 * @returns {Promise<{matched: number, ignored: number, other: number}>} Counts
 *		of file statuses, used as a sanity check.
 */
async function once() {
	const configs = new ConfigArray(makeConfigs(), {
		basePath: BASE_PATH,
		schema: customSchema,
		extraConfigTypes: ["array", "function"],
	});

	await configs.normalize();

	let matched = 0,
		ignored = 0,
		other = 0;

	// first pass: every lookup is a cache miss
	for (const filePath of filePaths) {
		const { status } = configs.getConfigWithStatus(filePath);

		if (status === "matched") {
			matched++;
		} else if (status === "ignored") {
			ignored++;
		} else {
			other++;
		}
	}

	// second pass: every lookup is a cache hit
	for (const filePath of filePaths) {
		configs.getConfigWithStatus(filePath);
	}

	// directory ignore checks
	for (let i = 0; i < DIRECTORY_CHECK_COUNT; i++) {
		configs.isDirectoryIgnored(
			`${BASE_PATH}${SEPARATOR}src${SEPARATOR}dir${i}`,
		);
		configs.isDirectoryIgnored(
			`${BASE_PATH}${SEPARATOR}node_modules${SEPARATOR}pkg${i}`,
		);
	}

	return { matched, ignored, other };
}

for (let i = 0; i < WARMUP_RUNS; i++) {
	await once();
}

if (globalThis.gc) {
	globalThis.gc();
}

const times = [];
let sanity;

for (let i = 0; i < RUNS; i++) {
	const start = performance.now();

	sanity = await once();
	times.push(performance.now() - start);
}

times.sort((a, b) => a - b);

const mean = times.reduce((a, b) => a + b, 0) / times.length;
const median = times[Math.floor(times.length / 2)];
const p10 = times[Math.floor(times.length * 0.1)];

/* eslint-disable no-console -- CLI benchmark reports results to stdout */
console.log(
	`paths=${useWindowsPaths ? "windows" : "posix"} statuses=${JSON.stringify(sanity)}`,
);
console.log(
	`runs=${RUNS} mean=${mean.toFixed(3)}ms median=${median.toFixed(3)}ms p10=${p10.toFixed(3)}ms min=${times[0].toFixed(3)}ms`,
);
/* eslint-enable no-console -- end of benchmark output */
