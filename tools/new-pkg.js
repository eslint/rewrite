/**
 * @fileoverview Script to bootstrap a new package in the monorepo.
 *
 *   node tools/new-pkg.js --name <pkg-name> --desc <pkg-desc>
 *
 * @author Nicholas C. Zakas
 */

/* eslint no-console: off -- CLI needs output. */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { readFileSync, readdirSync, writeFileSync, cpSync } from "node:fs";
import { parseArgs } from "node:util";

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * Recursively gets all files in a directory.
 * @param {string} dir The directory to search.
 * @param {string[]} fileList The list of files found so far.
 */
function getAllFiles(dir) {
	const fileList = [];
	const files = readdirSync(dir, { withFileTypes: true });

	files.forEach(file => {
		const filePath = `${dir}/${file.name}`;
		if (file.isDirectory()) {
			fileList.push(...getAllFiles(filePath));
		} else {
			fileList.push(filePath);
		}
	});

	return fileList;
}

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const packageNames = readdirSync("./packages");

//-----------------------------------------------------------------------------
// Parse CLI
//-----------------------------------------------------------------------------

const options = {
	name: {
		type: "string",
	},
	desc: {
		type: "string",
	},
};

const { values } = parseArgs({ args: process.argv.slice(2), options });

if (!values.name) {
	throw new Error("--name is required.");
}

if (packageNames.includes(values.name)) {
	throw new Error(`Package ${values.name} already exists.`);
}

if (!values.desc) {
	throw new Error("--desc is required.");
}

packageNames.push(values.name);
packageNames.sort();

//-----------------------------------------------------------------------------
// Creating the new directory
//-----------------------------------------------------------------------------

console.log("Creating new directory...");

const templateDirectory = "./templates/package";
const newDirectory = `./packages/${values.name}`;

cpSync(templateDirectory, newDirectory, { recursive: true });

const allFiles = getAllFiles(newDirectory);

allFiles.forEach(filePath => {
	const content = readFileSync(filePath, "utf8");
	const newContent = content
		.replace(/<%=\s*name\s*%>/gu, values.name)
		.replace(/<%=\s*description\s*%>/gu, values.desc);

	writeFileSync(filePath, newContent, "utf8");
});

console.log("✅ Created", newDirectory);

//-----------------------------------------------------------------------------
// Update issue templates
//-----------------------------------------------------------------------------

console.log("\nUpdating issue templates...");

const issueTemplateFiles = readdirSync("./.github/ISSUE_TEMPLATE");

issueTemplateFiles.forEach(file => {
	const filePath = `./.github/ISSUE_TEMPLATE/${file}`;
	const content = readFileSync(filePath, "utf8");

	if (!content.includes("# packages-start")) {
		return;
	}

	const lines = content.split(/\r?\n/gu);

	const startIndex = lines.findIndex(line =>
		line.includes("# packages-start"),
	);
	const endIndex = lines.findIndex(line => line.includes("# packages-end"));
	const newLines = packageNames.map(
		packageName =>
			`${" ".repeat(14)}- label: "\`@eslint/${packageName}\`"\n${" ".repeat(16)}required: false`,
	);

	lines.splice(startIndex + 1, endIndex - startIndex - 1, ...newLines);

	writeFileSync(filePath, lines.join("\n"), "utf8");

	console.log("✅ Updated", filePath);
});

//-----------------------------------------------------------------------------
// Update README
//-----------------------------------------------------------------------------

console.log("\nUpdating README...");

const readmePath = "./README.md";
const readmeContent = readFileSync(readmePath, "utf8");
const readmeLines = readmeContent.split(/\r?\n/gu);
const readmeStartIndex = readmeLines.findIndex(line =>
	line.includes("<!--packages-start-->"),
);
const readmeEndIndex = readmeLines.findIndex(line =>
	line.includes("<!--packages-end-->"),
);
const newReadmeLines = packageNames.map(
	packageName => `- [\`@eslint/${packageName}\`](./packages/${packageName})`,
);

readmeLines.splice(
	readmeStartIndex + 1,
	readmeEndIndex - readmeStartIndex - 1,
	...newReadmeLines,
);

writeFileSync(readmePath, readmeLines.join("\n"), "utf8");

console.log("✅ Updated", readmePath);

//-----------------------------------------------------------------------------
// Update release-please-manifest.json
//-----------------------------------------------------------------------------

console.log("\nUpdating release-please-manifest.json...");

const manifestPath = "./.release-please-manifest.json";
const manifestContent = readFileSync(manifestPath, "utf8");
let manifest = JSON.parse(manifestContent);

manifest[`packages/${values.name}`] = "0.0.0";

// sort manifest keys
manifest = Object.fromEntries(
	Object.entries(manifest).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)),
);

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

console.log("✅ Updated", manifestPath);

//-----------------------------------------------------------------------------
// Update release-please-config.json
//-----------------------------------------------------------------------------

console.log("\nUpdating release-please-config.json...");

const configPath = "./release-please-config.json";
const configContent = readFileSync(configPath, "utf8");
const config = JSON.parse(configContent);

config.packages[`packages/${values.name}`] = {
	"release-type": "node",
	"extra-files": [
		{
			type: "json",
			path: "jsr.json",
			jsonpath: "$.version",
		},
	],
};

// sort the config.packages keys
config.packages = Object.fromEntries(
	Object.entries(config.packages).sort(([keyA], [keyB]) =>
		keyA.localeCompare(keyB),
	),
);

writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

console.log("✅ Updated", configPath);

//-----------------------------------------------------------------------------
// Final notice
//-----------------------------------------------------------------------------

console.log("\nIMPORTANT!!!!!");
console.log(
	"This script does NOT update the release-please.yml workflow file.",
);
console.log("You must do that manually.");
