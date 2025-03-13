const {
    defineConfig,
} = require("eslint/config");

const {
    includeIgnoreFile,
} = require("@eslint/compat");

const path = require("node:path");
const gitignorePath = path.resolve(__dirname, ".gitignore");

module.exports = defineConfig([includeIgnoreFile(gitignorePath), {
    rules: {
        "no-console": "off",
    },
}]);