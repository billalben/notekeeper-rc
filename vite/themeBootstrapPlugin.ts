import { fileURLToPath, URL } from "node:url";
import { build, type Plugin } from "vite";

const SRC_DIR = fileURLToPath(new URL("../src", import.meta.url));
const ENTRY = fileURLToPath(
  new URL("../src/app/themeBootstrap.entry.ts", import.meta.url),
);
const PLACEHOLDER = "<!--! theme bootstrap (injected) -->";

/**
 * Bundle the pre-paint bootstrap to a self-contained IIFE so shared constants
 * (storage keys, supported languages, appearance allow-lists) stay in one place
 * while the shipped `index.html` still carries an inline, render-blocking
 * script and therefore never flashes the wrong theme.
 */
const bundleThemeBootstrap = async (): Promise<string> => {
  const result = await build({
    configFile: false,
    logLevel: "silent",
    resolve: { alias: { "@": SRC_DIR } },
    build: {
      write: false,
      minify: true,
      target: "es2020",
      lib: {
        entry: ENTRY,
        formats: ["iife"],
        name: "__notekeeperThemeBootstrap",
        fileName: () => "theme-bootstrap.js",
      },
    },
  });

  if ("close" in result) {
    throw new Error("Unexpected watcher while bundling the theme bootstrap.");
  }

  const output = Array.isArray(result) ? result[0].output : result.output;
  const chunk = output.find((item) => item.type === "chunk");
  if (!chunk || chunk.type !== "chunk") {
    throw new Error("Failed to bundle the theme bootstrap script.");
  }
  return chunk.code;
};

export const themeBootstrapPlugin = (): Plugin => {
  let script = "";

  return {
    name: "notekeeper:theme-bootstrap",

    async buildStart() {
      script = await bundleThemeBootstrap();
    },

    transformIndexHtml(html) {
      if (!script) return html;
      return html.replace(PLACEHOLDER, () => `<script>${script}</script>`);
    },
  };
};
