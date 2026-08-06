import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    globals: false,
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    include: [
      "lib/**/*.test.ts",
      "agent/**/*.test.ts",
      "actions/**/*.test.ts",
      "app/api/**/*.test.ts",
      "app/api/**/*.test.tsx",
      "components/**/*.test.tsx",
      "tests/integration/**/*.test.ts",
      "tests/integration/**/*.test.tsx",
    ],
    coverage: {
      provider: "v8",
      include: [
        "lib/**/*.{ts,tsx}",
        "agent/**/*.{ts,tsx}",
        "actions/**/*.{ts,tsx}",
        "app/api/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
      ],
      exclude: [
        "tests/**",
        "instrumentation-client.ts",
        "proxy.ts",
        "app/layout.tsx",
        "lib/stagehand.ts",
        "lib/browserbase.ts",
        "lib/insforge-client.ts",
        "components/profile/ResumeTemplate.tsx",
        "next.config.ts",
        "postcss.config.mjs",
        "eslint.config.mjs",
      ],
      thresholds: {
        lines: 70,
        statements: 70,
        functions: 70,
        branches: 60,
      },
    },
  },
});
