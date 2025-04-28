"use strict";

const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const globals = require("globals");
const prettier = require("eslint-plugin-prettier");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});
const airbnbBase = require("eslint-config-airbnb-base");
const bestPractices = require(airbnbBase.extends[0]);
const ignoredProps = bestPractices.rules["no-param-reassign"][1].ignorePropertyModificationsFor.concat("err", "x", "_", "opts", "options", "settings", "config", "cfg");

const additionalChanges = {
    strict: "off",
    "func-names": ["error", "always"],

    "arrow-parens": ["error", "always", {
        requireForBlockBody: true,
    }],

    "prefer-arrow-callback": ["error", {
        allowNamedFunctions: true,
        allowUnboundThis: true,
    }],

    "max-params": ["error", {
        max: 3,
    }],

    "max-statements": ["error", {
        max: 20,
    }],

    "max-statements-per-line": ["error", {
        max: 1,
    }],

    "max-nested-callbacks": ["error", {
        max: 4,
    }],

    "max-depth": ["error", {
        max: 4,
    }],

    "arrow-body-style": ["error", "as-needed", {
        requireReturnForObjectLiteral: false,
    }],

    "no-use-before-define": ["error", {
        functions: false,
        classes: true,
        variables: true,
    }],

    "no-param-reassign": ["error", {
        props: true,
        ignorePropertyModificationsFor: ignoredProps,
    }],

    "no-unused-vars": ["error", {
        ignoreRestSiblings: true,
        vars: "all",
        varsIgnorePattern: "^(?:$$|xx|_|__|[iI]gnor(?:e|ing|ed))",
        args: "after-used",
        argsIgnorePattern: "^(?:$$|xx|_|__|[iI]gnor(?:e|ing|ed))",
        caughtErrors: "none",
    }],
};

const importRules = {
    "import/namespace": ["error", {
        allowComputed: true,
    }],

    "import/no-absolute-path": "error",
    "import/no-webpack-loader-syntax": "error",
    "import/no-self-import": "error",
    "import/no-amd": "error",
    "import/no-duplicates": "error",
    "import/no-extraneous-dependencies": "off",
    "import/no-mutable-exports": "error",
    "import/no-named-as-default-member": "error",
    "import/no-named-as-default": "error",
    "import/order": "error",

    "import/no-unassigned-import": ["error", {
        allow: ["@babel/polyfill", "@babel/register"],
    }],

    "import/prefer-default-export": "off",
    "import/extensions": "off",
    "import/exports-last": "off",
    "import/no-unused-modules": "off",

    "import/no-useless-path-segments": ["error", {
        noUselessIndex: false,
    }],
};

module.exports = defineConfig([{
    languageOptions: {
        globals: {
            ...globals.jest,
            ...globals.node,
            ...globals.commonjs,
        },
    },

    extends: compat.extends("eslint:recommended", "airbnb-base", "plugin:prettier/recommended"),

    plugins: {
        prettier,
    },

    rules: {
        ...additionalChanges,
        ...importRules,
    },
}, globalIgnores(["**/dist"])]);
