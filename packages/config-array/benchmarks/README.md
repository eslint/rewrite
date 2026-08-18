# Config Array Benchmarks

Benchmarks for measuring the performance of `ConfigArray` config resolution.

## Prerequisites

The benchmarks run against the source files in `src/`, which import other
workspace packages, so the repository must be installed and built first:

```shell
npm install
npm run build
```

## Running

From the `packages/config-array` directory:

```shell
npm run bench
```

Or run the script directly to pass options:

```shell
node benchmarks/config-resolution.bench.js [--windows] [--runs=N]
```

| Option      | Description                                                      |
| ----------- | ---------------------------------------------------------------- |
| `--windows` | Use Windows-style paths (drive letter and backslash separators). |
| `--runs=N`  | Number of timed runs (default: 100).                             |

For more stable numbers, allow the benchmark to trigger garbage collection
between the warmup and the timed runs:

```shell
node --expose-gc benchmarks/config-resolution.bench.js
```

## What is measured

Each timed run:

1. Creates and normalizes a fresh `ConfigArray` with a realistic
   flat-config-style fixture (global ignores, universal configs, `files`
   patterns, AND patterns, negated ignores, and a config with `basePath`).
2. Calls `getConfigWithStatus()` for 1,500 unique file paths (cache misses).
3. Calls `getConfigWithStatus()` for the same paths again (cache hits).
4. Calls `isDirectoryIgnored()` for a mix of ignored and non-ignored
   directories.

A fresh `ConfigArray` is used per run so the per-path result cache doesn't
hide resolution cost.

The first output line reports the file status counts
(`matched`/`ignored`/`other`), which should stay constant across runs and
across code changes — if they change, the code change altered matching
behavior, not just performance. The second line reports timing statistics
(mean, median, 10th percentile, and minimum) in milliseconds.

## Comparing changes

To compare against another revision, run the benchmark on both and compare
the medians. For example:

```shell
node benchmarks/config-resolution.bench.js
git stash
node benchmarks/config-resolution.bench.js
git stash pop
```

Run each configuration a few times and expect a few percent of noise between
runs; treat differences under ~5% as inconclusive.
