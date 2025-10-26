import globals from "globals";
import js from "@eslint/js";
import { FlatCompat } from '@eslint/eslintrc';

// Utility needed to load legacy configurations like "eslint:recommended" and "prettier"
const compat = new FlatCompat({
  baseDirectory: import.meta.url,
  resolvePluginsRelativeTo: import.meta.url
});

export default [
  // 1. Inherit the standard "eslint:recommended" rules
  js.configs.recommended,

  // 2. Define the execution environment and language features
  {
    languageOptions: {
      // Enable Node.js global variables (like require, module, __dirname)
      globals: globals.node,
      // Enable features up to ES2021 (for async/await, modern syntax)
      ecmaVersion: 2021,
      sourceType: "module",
    },
  },

  // 3. Define custom rules
  {
    rules: {
      "no-console": "warn", // Allows console.log but flags it
      "no-unused-vars": "error", // Prevents leaving unused variables
      "no-var": "error", // Enforce use of const/let instead of var
      "prefer-const": "error", // Enforce const when variable is not reassigned
    }
  },

  // 4. Integrate Prettier to disable conflicting rules
  // This uses the compatibility layer to import the legacy 'prettier' configuration
  ...compat.extends("prettier"),
];