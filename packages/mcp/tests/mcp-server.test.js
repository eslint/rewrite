/**
 * @fileoverview Tests for MCP server
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

import { mcpServer } from "../src/mcp-server.js";
import assert from "node:assert";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { fileURLToPath } from "node:url";

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

const dirname = path.dirname(fileURLToPath(import.meta.url));
const passingFilePath = path.join(dirname, "fixtures", "passing.js");
const syntaxErrorFilePath = path.join(dirname, "fixtures", "syntax-error.js");

const filePathsJsonSchema = {
	$schema: "http://json-schema.org/draft-07/schema#",
	additionalProperties: false,
	properties: {
		filePaths: {
			items: {
				type: "string",
				minLength: 1,
			},
			minItems: 1,
			type: "array",
		},
	},
	required: ["filePaths"],
	type: "object",
};

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("MCP Server", () => {
	let client, clientTransport, serverTransport;

	beforeEach(async () => {
		client = new Client({
			name: "test client",
			version: "1.0",
		});

		[clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();

		// Note: must connect server first or else client hangs
		await mcpServer.connect(serverTransport);
		await client.connect(clientTransport);
	});

	describe("Tools", () => {
		it("should list tools", async () => {
			const { tools } = await client.listTools();

			assert.strictEqual(tools.length, 1);
			assert.strictEqual(tools[0].name, "lint-files");
			assert.deepStrictEqual(tools[0].inputSchema, filePathsJsonSchema);
		});

		describe("lint-files", () => {
			it("should return zero lint messages for a valid file", async () => {
				const { content: rawResults } = await client.callTool({
					name: "lint-files",
					arguments: {
						filePaths: [passingFilePath],
					},
				});

				const results = rawResults
					.slice(1, rawResults.length - 1)
					.map(({ type, text }) => ({
						type,
						text: JSON.parse(text),
					}));

				assert.deepStrictEqual(results, [
					{
						type: "text",
						text: {
							filePath: passingFilePath,
							messages: [],
							suppressedMessages: [],
							errorCount: 0,
							fatalErrorCount: 0,
							warningCount: 0,
							fixableErrorCount: 0,
							fixableWarningCount: 0,
							usedDeprecatedRules: [],
						},
					},
				]);
			});

			it("should return zero lint messages for a valid file and a syntax error for an invalid file", async () => {
				const { content: rawResults } = await client.callTool({
					name: "lint-files",
					arguments: {
						filePaths: [passingFilePath, syntaxErrorFilePath],
					},
				});

				const results = rawResults
					.slice(1, rawResults.length - 1)
					.map(({ type, text }) => ({
						type,
						text: JSON.parse(text),
					}));
				assert.deepStrictEqual(results, [
					{
						type: "text",
						text: {
							filePath: passingFilePath,
							messages: [],
							suppressedMessages: [],
							errorCount: 0,
							fatalErrorCount: 0,
							warningCount: 0,
							fixableErrorCount: 0,
							fixableWarningCount: 0,
							usedDeprecatedRules: [],
						},
					},
					{
						type: "text",
						text: {
							filePath: syntaxErrorFilePath,
							messages: [
								{
									ruleId: null,
									severity: 2,
									fatal: true,
									message:
										"Parsing error: Unexpected token }",
									line: 1,
									column: 3,
								},
							],
							suppressedMessages: [],
							errorCount: 1,
							fatalErrorCount: 1,
							warningCount: 0,
							fixableErrorCount: 0,
							fixableWarningCount: 0,
							usedDeprecatedRules: [],
							source: "{}}\n",
						},
					},
				]);
			});
		});
	});
});
