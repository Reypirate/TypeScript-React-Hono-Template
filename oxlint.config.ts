import { defineConfig } from "oxlint";

export default defineConfig({
  categories: {
    correctness: "error",
    pedantic: "warn",
    perf: "warn",
    suspicious: "warn",
    style: "off",
  },
  ignorePatterns: [
    "**/env.ts",
    "**/routeTree.gen.ts",
    ".cache",
    ".git",
    ".tanstack",
    ".turbo",
    "coverage",
    "dist",
    "node_modules",
  ],
  plugins: ["typescript", "react", "import", "jsx-a11y"],
  rules: {
    "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
    "import/no-unassigned-import": "off",
    "react/exhaustive-deps": "warn",
    "react/react-in-jsx-scope": "off",
    "react/rules-of-hooks": "error",
    "typescript/consistent-type-imports": [
      "warn",
      { fixStyle: "separate-type-imports", prefer: "type-imports" },
    ],
    "typescript/no-explicit-any": "warn",
    "typescript/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }],
    "typescript/no-non-null-assertion": "warn",
    "typescript/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
  },
  settings: {
    react: {
      version: "19",
    },
  },
});
