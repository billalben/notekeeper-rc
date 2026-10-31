import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { pwaManifest } from "./vite/pwaManifest.ts";
import { themeBootstrapPlugin } from "./vite/themeBootstrapPlugin.ts";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    themeBootstrapPlugin(),
    react(),
    VitePWA({
      // Surface new versions to the user instead of swapping silently.
      registerType: "prompt",
      // Registration is handled manually in src/pwa.ts so we can react to
      // update/offline events with toasts.
      injectRegister: null,
      // Our globPatterns already precache every public icon, so skip the
      // plugin's automatic manifest-icon globs to avoid duplicate entries.
      includeManifestIcons: false,
      manifest: pwaManifest,
      workbox: {
        navigateFallback: "index.html",
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Google Fonts stylesheets (Kumbh Sans, Noto Sans Arabic, and the
            // Material Symbols icon font) — needed so icons/text render offline.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        // Keep long-lived vendor code in its own chunks so app/lazy chunks can
        // be re-deployed without busting the whole cache.
        codeSplitting: {
          groups: [
            {
              name: "react",
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            },
            {
              name: "i18n",
              test: /[\\/]node_modules[\\/](i18next|react-i18next)[\\/]/,
            },
          ],
        },
      },
    },
  },
});
