import { defineConfig, includeIgnoreFile } from "eslint/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

export default defineConfig([includeIgnoreFile(gitignorePath, { gitignoreResolution: true }), {
    rules: {
        "no-console": "off",
    },
}]);