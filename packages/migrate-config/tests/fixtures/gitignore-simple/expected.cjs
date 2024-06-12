const {
    includeIgnoreFile,
} = require("@eslint/compat");

const path = require("node:path");
const gitignorePath = path.resolve(__dirname, ".gitignore");

module.exports = [includeIgnoreFile(gitignorePath), {
    rules: {
        "no-console": "off",
    },
}];