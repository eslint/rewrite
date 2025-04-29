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
    extends: compat.extends(
        "./packages/eslint-config/typescript-dynamic",
        "./packages/eslint-config/import-strict",
    ),

    rules: {
        ...require("@webundsoehne/eslint-config/utils").generateImportGroups({
            tsconfigDir: __dirname,
        }),
    },
}]);
