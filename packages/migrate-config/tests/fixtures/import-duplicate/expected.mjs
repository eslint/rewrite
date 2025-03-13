import { defineConfig } from "eslint/config";
import _import from "eslint-plugin-import";
import { fixupPluginRules } from "@eslint/compat";
import reactHooks from "eslint-plugin-react-hooks";

export default defineConfig([{
    plugins: {
        import: fixupPluginRules(_import),
    },
}, {
    plugins: {
        "react-hooks": fixupPluginRules(reactHooks),
    },
}]);