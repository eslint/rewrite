const {
    defineConfig,
} = require("eslint/config");

const {
    fixupConfigRules,
    fixupPluginRules,
} = require("@eslint/compat");

const jsxA11Y = require("eslint-plugin-jsx-a11y");
const tanstackQuery = require("@tanstack/eslint-plugin-query");
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