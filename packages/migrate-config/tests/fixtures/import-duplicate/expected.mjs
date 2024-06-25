import react from "eslint-plugin-react";
import { fixupPluginRules } from "@eslint/compat";
import reactHooks from "eslint-plugin-react-hooks";

export default [{
    plugins: {
        react: fixupPluginRules(react),
    },
}, {
    plugins: {
        "react-hooks": fixupPluginRules(reactHooks),
    },
}];