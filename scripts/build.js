/**
 * @fileoverview Build script for the project. Because we are using a monorepo,
 * we need to build each package in the correct order. Otherwise, the type
 * definitions for the packages that depend on other packages won't be correct.
 * @author Nicholas C. Zakas
 */

//------------------------------------------------------------------------------
// Imports
//------------------------------------------------------------------------------

import { execSync } from "node:child_process";
import path from "node:path";
import fsp from "node:fs/promises";
import { fileURLToPath } from "node:url";

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url); // eslint-disable-line no-underscore-dangle -- convention
const __dirname = path.dirname(__filename); // eslint-disable-line no-underscore-dangle -- convention
const PACKAGES_DIR = path.resolve(__dirname, "..", "packages");

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Gets a list of directories in the packages directory.
 * @returns {Promise<string[]>} A promise that resolves with an array of package directories.
 */
async function getPackageDirs() {
	const packageDirs = await fsp.readdir(PACKAGES_DIR);
	return packageDirs.map(entry => `packages/${entry}`);
}

/**
 * Calculates the dependencies between packages.
 * @param {Array<string>} packageDirs An array of package directories.
 * @returns {Map<string, Set<string>>} A map of package names to the set of dependencies.
 */
async function calculatePackageDependencies(packageDirs) {
	return new Map(
		await Promise.all(
			packageDirs.map(async packageDir => {
				const packageJson = await fsp.readFile(
					path.join(packageDir, "package.json"),
					"utf8",
				);
				const pkg = JSON.parse(packageJson);
				const dependencies = new Set();

				if (pkg.dependencies) {
					for (const dep of Object.keys(pkg.dependencies)) {
						dependencies.add(dep);
					}
				}

				if (pkg.devDependencies) {
					for (const dep of Object.keys(pkg.devDependencies)) {
						dependencies.add(dep);
					}
				}

				return [
					pkg.name,
					{ name: pkg.name, dir: packageDir, dependencies },
				];
			}),
		),
	);
}

/**
 * Creates an array of directories to be built in order to sastify dependencies.
 * @param {Map<string,{name:string,dir:string,dependencies:Set<string>}} dependencies The
 * dependencies between packages.
 * @returns {Array<string>} An array of directories to be built in order.
 */
function createBuildOrder(dependencies) {
	const buildOrder = [];
	const seen = new Set();

	function visit(name) {
		if (!seen.has(name)) {
			seen.add(name);

			// we only need to deal with dependencies in this monorepo
			if (dependencies.has(name)) {
				const { dependencies: deps, dir } = dependencies.get(name);
				deps.forEach(visit);
				buildOrder.push(dir);
			}
		}
	}

	dependencies.forEach((value, key) => {
		visit(key);
	});

	return buildOrder;
}

/**
 * Builds the packages in the correct order.
 * @param {Array<string>} packageDirs An array of directories to build in order.
 * @returns {void}
 */
function buildPackages(packageDirs) {
	console.log(`Building packages in this order: ${packageDirs.join(", ")}`);

	for (const packageDir of packageDirs) {
		console.log(`Building ${packageDir}...`);
		execSync(`npm run build -w ${packageDir} --if-present`, {
			stdio: "inherit",
		});
	}

	console.log("Done building packages.");
}

//------------------------------------------------------------------------------
// Main Script
//------------------------------------------------------------------------------

const packageDirs = await getPackageDirs();
const dependencies = await calculatePackageDependencies(packageDirs);
const buildOrder = createBuildOrder(dependencies);

buildPackages(buildOrder);
