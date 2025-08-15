const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const {
    includeIgnoreFile,
} = require("@eslint/compat");

const path = require("node:path");
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});
const gitignorePath = path.resolve(__dirname, ".gitignore");

module.exports = defineConfig([globalIgnores(["**/baz"]), includeIgnoreFile(gitignorePath), {
    extends: compat.extends("eslint:recommended"),

    rules: {
        "no-console": "off",
    },
}]);