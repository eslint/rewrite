const {
    defineConfig,
} = require("eslint/config");

const {
    fixupConfigRules,
    fixupPluginRules,
} = require("@eslint/compat");

const prettier = require("eslint-plugin-prettier");
const _import = require("eslint-plugin-import");
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
    extends: fixupConfigRules(compat.extends("eslint:recommended", "plugin:ava/recommended", "prettier")),

    plugins: {
        prettier,
        import: fixupPluginRules(_import),
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },

        ecmaVersion: 2020,
        sourceType: "module",
    },

    rules: {
        "prettier/prettier": 2,
        "ava/no-ignored-test-files": 0,
        "ava/no-import-test-files": 0,

        "import/no-unresolved": [2, {
            ignore: ["ava", "got"],
        }],

        "import/no-unused-modules": 2,

        "import/order": [2, {
            "newlines-between": "never",
        }],
    },
}]);