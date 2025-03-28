/**
 * @fileoverview Publishes all of the packages in dependency order
 * via GitHub workflow.
 *
 * Usage:
 *
 *   node scripts/publish.js [--dry-run]
 *
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import {
	getPackageDirs,
	calculatePackageDependencies,
	createBuildOrder,
} from "./shared.js";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

//-----------------------------------------------------------------------------
// Read CLI Args
//-----------------------------------------------------------------------------

const dryRun = process.argv.includes("--dry-run");

// for dry runs only output to console and don't execute anything
const exec = dryRun ? text => console.log(text) : execSync;

//-----------------------------------------------------------------------------
// Read Step Output
//-----------------------------------------------------------------------------

if (!process.env.STEPS_RELEASE_OUTPUTS) {
	console.error("No release outputs found.");
	process.exit(1);
}

const releaseOutputs = JSON.parse(process.env.STEPS_RELEASE_OUTPUTS);

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * Gets the output of a GitHub Actions step from the environment variables.
 * @param {string} packageDir The directory of the package.
 * @param {string} name The name of the output.
 * @return {string} The output value.
 */
function getReleaseOutput(packageDir, name) {
	return releaseOutputs[`${packageDir}--${name}`];
}

/**
 * Gets the list of packages to publish.
 * @param {Array<string>} packageDirs The list of package directories.
 * @return {Array<string>} The list of packages to publish.
 */
function getPackagesToPublish(packageDirs) {
	return packageDirs.filter(
		packageDir =>
			getReleaseOutput(packageDir, "release_created") === "true",
	);
}

/**
 * Maps the dependencies into a structure where they keys are package
 * paths and the values are an array of package paths.
 * @param {Map<string, { name:string, dir: string, dependencies: Set<string> }>} dependencies The dependencies to map.
 * @return {Map<string, Set<string>>} The mapped dependencies.
 */
function mapDependenciesToPaths(dependencies) {
	const mappedDependencies = new Map();

	for (const [, { dir: packageDir, dependencies: deps }] of dependencies) {
		const pathDeps = [...deps]
			.filter(dep => dependencies.has(dep))
			.map(dep => dependencies.get(dep).dir);
		mappedDependencies.set(packageDir, new Set(pathDeps));
	}

	return mappedDependencies;
}

/**
 * Publishes the packages to npm. If one package fails to publish, the rest
 * will still be published.
 * @param {Array<string>} packageDirs The list of package directories.
 * @param {Map<string, Set<string>>} dependencies The dependencies between packages.
 * @return {Map<string,string>} A map of package directory to whether it was published successfully.
 */
function publishPackagesToNpm(packageDirs, dependencies) {
	console.log(
		`Publishing packages to npm in this order: ${packageDirs.join(", ")}`,
	);

	const results = new Map();

	for (const packageDir of packageDirs) {
		// check if any dependencies previously failed
		const deps = dependencies.get(packageDir);
		const hasNotOkDeps =
			deps &&
			[...deps].some(
				dep => results.has(dep) && results.get(dep) !== "ok",
			);

		if (hasNotOkDeps) {
			console.log(`Skipping ${packageDir} (missing dependencies)`);
			results.set(packageDir, "Skipped (missing dependencies)");
			continue;
		}

		console.log(`Publishing ${packageDir}...`);
		try {
			exec(`npm publish -w ${packageDir} --provenance`, {
				stdio: "inherit",
				env: process.env,
			});

			results.set(packageDir, "ok");
		} catch (error) {
			console.error(`Failed to publish ${packageDir} to npm`);
			console.log(error.message);

			results.set(packageDir, error.message);
		}
	}

	console.log("Done publishing packages to npm.");
	return results;
}

/**
 * Publishes the packages to JSR. If one package fails to publish, the rest
 * will still be published.
 * @param {Array<string>} packageDirs The list of package directories.
 * @return {Map<string,string>} A map of package directory to whether it was published successfully.
 **/
function publishPackagesToJsr(packageDirs) {
	console.log(
		`Publishing packages to JSR in this order: ${packageDirs.join(", ")}`,
	);

	const results = new Map();

	for (const packageDir of packageDirs) {
		// Skip if no jsr.json exists
		if (!existsSync(join(packageDir, "jsr.json"))) {
			console.log(`Skipping ${packageDir} (no jsr.json found)`);
			results.set(packageDir, "ok (skipped)");
			continue;
		}

		console.log(`Publishing ${packageDir}...`);
		try {
			exec(`npx jsr publish`, {
				stdio: "inherit",
				env: process.env,
				cwd: packageDir,
			});

			results.set(packageDir, "ok");
		} catch (error) {
			console.error(`Failed to publish ${packageDir} to JSR`);
			console.log(error.message);

			results.set(packageDir, error.message);
		}
	}

	console.log("Done publishing packages to JSR.");
	return results;
}

/**
 * Posts the results to social media.
 * @param {Map<string,string>} npmPublishResults The results of the npm publish.
 * @return {void}
 */
function postResultToSocialMedia(npmPublishResults) {
	const messages = [];

	for (const [packageDir, result] of npmPublishResults) {
		if (result !== "ok") {
			continue;
		}

		const packageJson = JSON.parse(
			readFileSync(join(packageDir, "package.json"), "utf8"),
		);
		const packageName = packageJson.name.slice(1); // remove leading @
		const packageVersion = packageJson.version;

		messages.push(
			`${packageName} v${packageVersion}\n${getReleaseOutput(packageDir, "html_url")}`,
		);
	}

	// group four messages per post to avoid post limits
	const messageChunks = [];
	for (let i = 0; i < messages.length; i += 4) {
		messageChunks.push(messages.slice(i, i + 4).join("\n\n"));
	}

	for (const messageChunk of messageChunks) {
		const message = `Just released:\n\n${messageChunk}`;

		console.log(message);

		exec(
			`npx @humanwhocodes/crosspost -t -b -m ${JSON.stringify(message)}`,
			{
				stdio: "inherit",
				env: process.env,
			},
		);
	}

	console.log("Posted to social media.");
}

//-----------------------------------------------------------------------------
// Main
//-----------------------------------------------------------------------------

const packageDirs = await getPackageDirs();
const dependencies = await calculatePackageDependencies(packageDirs);
const buildOrder = createBuildOrder(dependencies);
const packagesToPublish = getPackagesToPublish(buildOrder);

if (packagesToPublish.length === 0) {
	console.log("No packages to publish.");
	process.exit(0);
}

const npmPublishResults = publishPackagesToNpm(
	packagesToPublish,
	mapDependenciesToPaths(dependencies),
);
const jsrPublishResults = publishPackagesToJsr(packagesToPublish);

postResultToSocialMedia(npmPublishResults);

process.exitCode = [...npmPublishResults, ...jsrPublishResults].some(
	([, value]) => !value.startsWith("ok"),
)
	? 1
	: 0;
