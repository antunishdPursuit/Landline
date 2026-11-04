import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "server-only": fileURLToPath(new URL("./__mocks__/server-only.js", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    environmentOptions: { jsdom: { url: "http://localhost/" } },
    include: ["__tests__/**/*.test.ts", "__tests__/**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
    fileParallelism: false,
  },
});
