import { defineConfig } from "eslint/config";
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import prettier from "eslint-plugin-prettier";
import _import from "eslint-plugin-import";
import node from "eslint-plugin-node";
import promise from "eslint-plugin-promise";
import standard from "eslint-plugin-standard";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
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
    extends: fixupConfigRules(compat.extends("eslint:recommended", "plugin:import/errors")),

    plugins: {
        prettier,
        import: fixupPluginRules(_import),
        node,
        promise,
        standard,
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...node.environments.base.globals,
        },

        ecmaVersion: 2018,
        sourceType: "script",
    },

    rules: {
        semi: ["error"],
        quotes: ["error"],
        "no-console": ["warn"],
    },
}, {
    files: ["**/*.ts"],
    ignores: ["**/*.d.ts"],
    extends: compat.extends("plugin:@typescript-eslint/recommended"),

    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        parser: tsParser,
    },

    rules: {
        "@typescript-eslint/no-explicit-any": ["error"],
        "@typescript-eslint/no-unused-vars": ["error"],
    },
}]);