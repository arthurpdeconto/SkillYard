import js from "@eslint/js";
import globals from "globals";
import tseslint from "@typescript-eslint/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";
import { fileURLToPath } from "node:url";

const tsconfigRootDir = fileURLToPath(new URL(".", import.meta.url));
const tsTypeCheckedConfigs = tseslint.configs["flat/recommended"].map((config) => ({
  ...config,
  files: ["**/*.{ts,tsx}"],
  languageOptions: {
    ...config.languageOptions,
    parserOptions: {
      ...config.languageOptions?.parserOptions,
      project: "./tsconfig.json",
      tsconfigRootDir,
    },
  },
}));
const tsStylisticConfigs = tseslint.configs["flat/stylistic"].map((config) => ({
  ...config,
  files: ["**/*.{ts,tsx}"],
  languageOptions: {
    ...config.languageOptions,
    parserOptions: {
      ...config.languageOptions?.parserOptions,
      project: "./tsconfig.json",
      tsconfigRootDir,
    },
  },
}));

export default [
  nextPlugin.configs["recommended"],
  js.configs.recommended,
  ...tsTypeCheckedConfigs,
  ...tsStylisticConfigs,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      next: nextPlugin,
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
    settings: {
      next: {
        rootDir: ["./"],
      },
    },
  },
];
