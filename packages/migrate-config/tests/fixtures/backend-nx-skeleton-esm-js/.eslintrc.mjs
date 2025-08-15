/* eslint-disable import/no-extraneous-dependencies */
/** @type {import("eslint").Linter} */
export default {
    extends: ['./packages/eslint-config/typescript-dynamic', './packages/eslint-config/import-strict'],
    rules: {
        ...await import('@webundsoehne/eslint-config/utils').generateImportGroups({ tsconfigDir: __dirname })
    }
}
