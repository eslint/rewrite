import { readFile, writeFile } from "node:fs/promises";

const oldSourceText = await readFile("dist/esm/index.d.ts", "utf-8");
const newSourceText = oldSourceText.replaceAll(
	'import("./types.ts")',
	'import("./types.ts", { with: { "resolution-mode": "import" } })',
);
await writeFile("dist/cjs/index.d.cts", newSourceText);
