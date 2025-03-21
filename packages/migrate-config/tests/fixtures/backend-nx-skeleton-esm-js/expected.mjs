import { defineConfig } from "eslint/config";

export default defineConfig([{
    extends: compat.extends(
        "./packages/eslint-config/typescript-dynamic",
        "./packages/eslint-config/import-strict",
    ),

    rules: {
        ...(await import("@webundsoehne/eslint-config/utils").generateImportGroups({
            tsconfigDir: __dirname,
        })),
    },
}]);
