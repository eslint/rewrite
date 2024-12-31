/**
 * @fileoverview Build script for `index.d.cts`.
 * This script creates "dist/cjs/index.d.cts" from "dist/esm/index.d.ts" by updating dynamic imports from `"./types.ts"`
 * to include a `"resolution-mode": "import"` import attribute.
 * It's not possible to add the import attributes directly to the source code because they are not allowed by jsr.
 * jsr only includes the ESM types, where the import attributes are not required.
 *
 * @author Francesco Trotta
 */

import { readFile, writeFile } from "node:fs/promises";

const oldSourceText = await readFile("dist/esm/index.d.ts", "utf-8");
const newSourceText = oldSourceText.replaceAll(
	'import("./types.ts")',
	'import("./types.ts", { with: { "resolution-mode": "import" } })',
);
await writeFile("dist/cjs/index.d.cts", newSourceText);
