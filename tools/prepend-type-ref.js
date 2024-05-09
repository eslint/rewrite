/**
 * @fileoverview Prepends a TypeScript reference comment to the beginning of a file.
 * This is necessary because JSR requires that all JavaScript files have a reference
 * to the TypeScript types file. We can't do this in Rollup because that happens
 * before tsc is run. This script is run after tsc is run.
 *
 * Usage:
 *  node tools/prepend-type-ref.js filename.js
 *
 * @author Nicholas C. Zakas
 */
/* global process */
//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";

//-----------------------------------------------------------------------------
// Main
//-----------------------------------------------------------------------------

// read file from the command line
const filePath = process.argv[2];
const filename = path.basename(filePath, ".js");

// read the file
const contents = fs.readFileSync(filePath, "utf8");

// prepend the reference comment
const newContents = `/// <reference types="./${filename}.d.ts" />\n${contents}`;

// write the file back out
fs.writeFileSync(filePath, newContents, "utf8");
