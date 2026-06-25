const {
    defineConfig,
    includeIgnoreFile,
} = require("eslint/config");

const path = require("node:path");
const gitignorePath = path.resolve(__dirname, ".gitignore");

module.exports = defineConfig([includeIgnoreFile(gitignorePath, { gitignoreResolution: true }), {
    rules: {
        "no-console": "off",
    },
}]);