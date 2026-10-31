import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { SHARE_TARGET_ACTION, SHORTCUT_URLS } from "@/shared/lib/pwa";
import { pwaManifest } from "../../vite/pwaManifest";

const publicDir = resolve(process.cwd(), "public");

describe("PWA manifest extras", () => {
  it("registers a GET share target for text and URLs", () => {
    expect(pwaManifest.share_target).toEqual({
      action: SHARE_TARGET_ACTION,
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    });
  });

  it("adds New note and Search shortcuts", () => {
    const shortcuts = pwaManifest.shortcuts ?? [];

    expect(shortcuts.map((shortcut) => shortcut.url)).toEqual([
      SHORTCUT_URLS.newNote,
      SHORTCUT_URLS.search,
    ]);
    expect(shortcuts.map((shortcut) => shortcut.name)).toEqual([
      "New note",
      "Search notes",
    ]);
  });

  it("keeps the existing standalone app configuration", () => {
    expect(pwaManifest.display).toBe("standalone");
    expect(pwaManifest.start_url).toBe("/");
    expect(pwaManifest.scope).toBe("/");
  });

  it("references icons that exist in public/", () => {
    const icons = [
      ...(pwaManifest.icons ?? []),
      ...(pwaManifest.shortcuts ?? []).flatMap(
        (shortcut) => shortcut.icons ?? [],
      ),
    ];

    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      expect(existsSync(resolve(publicDir, icon.src)), icon.src).toBe(true);
    }
  });
});
