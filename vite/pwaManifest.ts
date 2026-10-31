import type { ManifestOptions } from "vite-plugin-pwa";
import { SHARE_TARGET_ACTION, SHORTCUT_URLS } from "../src/shared/lib/pwa.ts";

const PWA_THEME_COLOR = "#FD7014";

const ICONS = [
  {
    src: "pwa-64x64.png",
    sizes: "64x64",
    type: "image/png",
  },
  {
    src: "pwa-192x192.png",
    sizes: "192x192",
    type: "image/png",
  },
  {
    src: "pwa-512x512.png",
    sizes: "512x512",
    type: "image/png",
  },
  {
    src: "maskable-icon-512x512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
];

const SHORTCUT_ICONS = [
  {
    src: "pwa-192x192.png",
    sizes: "192x192",
    type: "image/png",
  },
];

/**
 * Web app manifest. Kept outside `vite.config.ts` so the PWA surface can be
 * unit-tested (share target, shortcuts, icon references).
 */
export const pwaManifest = {
  name: "Notekeeper",
  short_name: "Notekeeper",
  description:
    "Streamline your daily note-taking with Notekeeper. Organize, access, and enhance productivity with ease.",
  theme_color: PWA_THEME_COLOR,
  background_color: "#ffffff",
  display: "standalone",
  start_url: "/",
  scope: "/",
  icons: ICONS,
  share_target: {
    // GET keeps the share flow on a normal navigation, so the existing
    // Workbox precache/navigateFallback serves the app offline with no custom
    // service-worker route.
    action: SHARE_TARGET_ACTION,
    method: "GET",
    params: {
      title: "title",
      text: "text",
      url: "url",
    },
  },
  shortcuts: [
    {
      name: "New note",
      short_name: "New note",
      description: "Create a blank note",
      url: SHORTCUT_URLS.newNote,
      icons: SHORTCUT_ICONS,
    },
    {
      name: "Search notes",
      short_name: "Search",
      description: "Search across all notes",
      url: SHORTCUT_URLS.search,
      icons: SHORTCUT_ICONS,
    },
  ],
} satisfies Partial<ManifestOptions>;
