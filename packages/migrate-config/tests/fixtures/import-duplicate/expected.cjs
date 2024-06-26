const react = require("eslint-plugin-react");

const {
    fixupPluginRules,
} = require("@eslint/compat");

const reactHooks = require("eslint-plugin-react-hooks");

module.exports = [{
    plugins: {
        react: fixupPluginRules(react),
    },
}, {
    plugins: {
        "react-hooks": fixupPluginRules(reactHooks),
    },
}];