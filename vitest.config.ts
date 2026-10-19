import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      enabled: false,
    },
    environment: "node",
    environmentMatchGlobs: [["**/apps/web/**/*.test.{ts,tsx}", "jsdom"]],
    exclude: [...configDefaults.exclude, "**/tests/integration/**"],
  },
});
