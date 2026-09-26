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
    include: ["tests/**/*.test.ts"],
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
