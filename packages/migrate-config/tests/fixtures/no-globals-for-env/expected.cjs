const {
    defineConfig,
} = require("eslint/config");

const {
    fixupConfigRules,
    fixupPluginRules,
} = require("@eslint/compat");

const prettier = require("eslint-plugin-prettier");
const _import = require("eslint-plugin-import");
const node = require("eslint-plugin-node");
const promise = require("eslint-plugin-promise");
const standard = require("eslint-plugin-standard");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
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