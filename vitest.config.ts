import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      enabled: false,
    },
    environment: "node",
    exclude: [
      ...configDefaults.exclude,
      "**/dist/**",
      "**/tests/integration/**",
      "**/tests/e2e/**",
    ],
  },
});
