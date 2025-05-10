#!/usr/bin/env node
/**
 * @fileoverview CLI to run the MCP server.
 * @author Nicholas C. Zakas
 */

/*
 * IMPORTANT!
 *
 * Because this file is executable, `npm install` changes its permission to
 * include the executable bit. This is a problem because it causes the file to
 * be marked as changed in Git, even though it hasn't. This, in turn, causes
 * JSR to think the directory is dirty and fails the build. To prevent this,
 * we ran:
 * $ git update-index --chmod=+x packages/mcp/src/mcp-cli.js
 * This manually changes the executable bit in Git so that it doesn't think the file
 * is changed.
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { mcpServer } from "./mcp-server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * Disconnects the server and sets exit code to 0.
 * @returns {void}
 */
function disconnect() {
	mcpServer.close();
	process.exitCode = 0;
}

//-----------------------------------------------------------------------------
// Main
//-----------------------------------------------------------------------------

await mcpServer.connect(new StdioServerTransport());

// Note: do not use console.log() because stdout is part of the server transport
// eslint-disable-next-line no-console -- Needed to output information
console.error(`ESLint MCP server is running. cwd: ${process.cwd()}`);

process.on("SIGINT", disconnect);
process.on("SIGTERM", disconnect);
