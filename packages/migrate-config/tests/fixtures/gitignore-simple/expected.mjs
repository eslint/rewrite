import { includeIgnoreFile } from "@eslint/compat";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

export default [includeIgnoreFile(gitignorePath), {
    rules: {
        "no-console": "off",
    },
}];