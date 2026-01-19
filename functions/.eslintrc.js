module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "commonjs",
  },
  extends: [
    "eslint:recommended",
  ],
  rules: {
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "quotes": ["error", "double", { "allowTemplateLiterals": true }],
    "semi": ["error", "always"],
  },
  globals: {
    module: "readonly",
    require: "readonly",
    exports: "readonly",
    process: "readonly",
    console: "readonly",
  },
};
