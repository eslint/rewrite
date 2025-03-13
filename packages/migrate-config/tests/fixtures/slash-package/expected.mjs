import { defineConfig } from "eslint/config";
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import jsxA11Y from "eslint-plugin-jsx-a11y";
import tanstackQuery from "@tanstack/eslint-plugin-query";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([{
    extends: fixupConfigRules(compat.extends(
        "react-app",
        "prettier",
        "plugin:jsx-a11y/recommended",
        "plugin:@tanstack/eslint-plugin-query/recommended",
    )),

    plugins: {
        "jsx-a11y": fixupPluginRules(jsxA11Y),
        "@tanstack/query": fixupPluginRules(tanstackQuery),
    },
}]);