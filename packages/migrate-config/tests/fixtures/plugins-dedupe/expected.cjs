const {
    fixupConfigRules,
    fixupPluginRules,
} = require("@eslint/compat");

const _import = require("eslint-plugin-import");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = [...fixupConfigRules(compat.extends("plugin:import/errors")), {
    plugins: {
        import: fixupPluginRules(_import),
    },
}];