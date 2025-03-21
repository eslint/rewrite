const {
    defineConfig,
} = require("eslint/config");

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
