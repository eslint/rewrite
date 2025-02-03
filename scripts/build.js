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
import {
	getPackageDirs,
	calculatePackageDependencies,
	createBuildOrder,
} from "./shared.js";

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

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
