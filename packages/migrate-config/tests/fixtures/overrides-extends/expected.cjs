const {
    defineConfig,
} = require("eslint/config");

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
    files: ["src/app/**"],
    ignores: ["**/*.test.js"],
    extends: compat.extends("airbnb"),
}, {
    files: ["src/app/**/*.test.js"],
    extends: compat.extends("airbnb-base"),
}, {
    ignores: ["src/app/**/*.spec.js"],
    extends: compat.extends("airbnb-base"),
}]);