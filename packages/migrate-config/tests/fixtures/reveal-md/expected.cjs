const {
    defineConfig,
} = require("eslint/config");

const prettier = require("eslint-plugin-prettier");
const _import = require("eslint-plugin-import");

const {
    fixupPluginRules,
} = require("@eslint/compat");

const globals = require("globals");
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
    extends: compat.extends("eslint:recommended", "prettier"),

    plugins: {
        prettier,
        import: fixupPluginRules(_import),
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },

        ecmaVersion: 2022,
        sourceType: "module",
    },

    rules: {
        "prettier/prettier": ["error", {
            singleQuote: true,
            printWidth: 120,
        }],

        "import/no-unresolved": 2,
    },
}]);