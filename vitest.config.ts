import { defineConfig, defineProject, mergeConfig } from "vitest/config";

export const baseConfig = defineConfig({
  test: {
    coverage: {
      provider: "istanbul" as const,
      reporter: [
        [
          "json",
          {
            file: `../coverage.json`,
          },
        ],
      ] as const,
      enabled: true,
    },
  },
});

const uiConfig = mergeConfig(
  baseConfig,
  defineProject({
    test: {
      environment: "jsdom",
    },
  }),
);

export default uiConfig;
