/* eslint-disable import/no-extraneous-dependencies */
/** @type {import("eslint").Linter} */
module.exports = {
    extends: ['./packages/eslint-config/typescript-dynamic', './packages/eslint-config/import-strict'],
    rules: {
        ...require('@webundsoehne/eslint-config/utils').generateImportGroups({ tsconfigDir: __dirname })
    }
}
