const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = [...compat.extends("airbnb").map(config => ({
    ...config,
    files: ["src/app/**"],
    ignores: ["**/*.test.js"],
})), ...compat.extends("airbnb-base").map(config => ({
    ...config,
    files: ["src/app/**/*.test.js"],
})), ...compat.extends("airbnb-base").map(config => ({
    ...config,
    ignores: ["src/app/**/*.spec.js"],
}))];