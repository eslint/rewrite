const {
    defineConfig,
} = require("eslint/config");

const _import = require("eslint-plugin-import");

const {
    fixupPluginRules,
} = require("@eslint/compat");

const reactHooks = require("eslint-plugin-react-hooks");

module.exports = defineConfig([{
    plugins: {
        import: fixupPluginRules(_import),
    },
}, {
    plugins: {
        "react-hooks": fixupPluginRules(reactHooks),
    },
}]);