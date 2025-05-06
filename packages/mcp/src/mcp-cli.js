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
 * This tells Git to ignore changes to the executable bit on this file.
 */

import { mcpServer } from "./mcp-server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

await mcpServer.connect(new StdioServerTransport());

// Note: do not use console.log() because stdout is part of the server transport
// eslint-disable-next-line no-console -- Needed to output information
console.error(`ESLint MCP server is running. cwd: ${process.cwd()}`);

process.on("SIGINT", () => {
	mcpServer.close();
	process.exitCode = 0;
});
