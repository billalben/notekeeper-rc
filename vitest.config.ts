import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

// Tests intentionally run without the VitePWA plugin from vite.config.ts so
// service-worker code never loads in the test environment.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@tests": fileURLToPath(new URL("./tests", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    // Reuse one jsdom instance per worker instead of rebuilding it for every
    // test file; module isolation between files is still preserved.
    pool: "vmThreads",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],
    open: false,
    restoreMocks: true,
    clearMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["tests/**", "src/**/*.test.{ts,tsx}"],
    },
  },
});
