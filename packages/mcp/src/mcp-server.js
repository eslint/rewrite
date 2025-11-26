/**
 * @fileoverview MCP Server for handling requests and responses to ESLint.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ESLint } from "eslint";

//-----------------------------------------------------------------------------
// Server
//-----------------------------------------------------------------------------

const mcpServer = new McpServer({
	name: "ESLint",
	version: "0.2.0", // x-release-please-version
});

// Important: Cursor throws an error when `describe()` is used in the schema.
const filePathsSchema = {
	filePaths: z.array(z.string().min(1)).nonempty(),
};

//-----------------------------------------------------------------------------
// Tools
//-----------------------------------------------------------------------------

mcpServer.tool(
	"lint-files",
	"Lint files using ESLint. You must provide a list of absolute file paths to the files you want to lint. The absolute file paths should be in the correct format for your operating system (e.g., forward slashes on Unix-like systems, backslashes on Windows).",
	filePathsSchema,
	async ({ filePaths }) => {
		const eslint = new ESLint({
			// enable lookup from file rather than from cwd
			flags: ["unstable_config_lookup_from_file"],
		});

		const type = /** @type {const} */ ("text");
		const results = await eslint.lintFiles(filePaths);
		const content = results.map(result => ({
			type,
			text: JSON.stringify(result),
		}));

		content.unshift({
			type,
			text: "Here are the results of running ESLint on the provided files. Before doing anything else, you must display the full list to the user:",
		});
		content.push({
			type,
			text: "If the user asked to fix any issues found, proceed in fixing them. If the user did not ask to fix issues found, you must ask the user for confirmation before attempting to fix the issues found.",
		});

		return {
			content,
		};
	},
);

export { mcpServer };
