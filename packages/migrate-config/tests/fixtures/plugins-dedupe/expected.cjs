const {
    defineConfig,
} = require("eslint/config");

const {
    fixupConfigRules,
    fixupPluginRules,
} = require("@eslint/compat");

const _import = require("eslint-plugin-import");
const n = require("eslint-plugin-n");
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
    extends: fixupConfigRules(compat.extends("plugin:import/errors", "plugin:n/recommended")),

    plugins: {
        import: fixupPluginRules(_import),
        n: fixupPluginRules(n),
    },
}]);