/**
 * @fileoverview Tests for MCP server
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import assert from "node:assert";
import childProcess from "node:child_process";
import path from "node:path";

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

const forkedProcesses = new Set();
const EXECUTABLE_PATH = path.resolve("./src/mcp-cli.js");

/**
 * Forks the process to run an instance of ESLint.
 * @returns {ChildProcess} The resulting child process
 */
function runServer(options) {
	const newProcess = childProcess.fork(
		EXECUTABLE_PATH,
		[],
		Object.assign({ silent: true }, options),
	);

	forkedProcesses.add(newProcess);
	return newProcess;
}

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("MCP server", () => {
	it("should start the MCP server when the --mcp flag is used", done => {
		const child = runServer(["--mcp"]);

		// should not have anything on std out
		child.stdout.on("data", data => {
			assert.fail(`Unexpected stdout data: ${data}`);
		});

		child.stderr.on("data", data => {
			assert.match(data.toString(), /ESLint MCP server is running/u);
			done();
		});
	});

	afterEach(() => {
		// Clean up all the processes after every test.
		forkedProcesses.forEach(child => child.kill());
		forkedProcesses.clear();
	});
});
