import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { applyThemeBootstrap } from "@/app/themeBootstrap";

const ROOT_ATTRIBUTES = [
  "data-theme",
  "data-motion",
  "data-accent",
  "data-font",
  "data-density",
  "data-radius",
  "data-contrast",
  "lang",
  "dir",
] as const;

const resetRoot = (): void => {
  for (const attribute of ROOT_ATTRIBUTES) {
    document.documentElement.removeAttribute(attribute);
  }
};

const storageWith = (entries: Record<string, string>) => ({
  getItem: (key: string): string | null => entries[key] ?? null,
});

const settings = (state: object): Record<string, string> => ({
  settings: JSON.stringify({ state, version: 18 }),
});

describe("applyThemeBootstrap", () => {
  beforeEach(resetRoot);
  afterEach(resetRoot);

  it("applies a valid stored theme", () => {
    applyThemeBootstrap({
      storage: storageWith({ theme: "dark" }),
      prefersDark: false,
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("falls back to the system preference when nothing is stored", () => {
    applyThemeBootstrap({ storage: storageWith({}), prefersDark: true });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("falls back to the system preference when the stored theme is invalid", () => {
    applyThemeBootstrap({
      storage: storageWith({ theme: "sepia" }),
      prefersDark: false,
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("applies language and direction from persisted settings", () => {
    applyThemeBootstrap({
      storage: storageWith(settings({ language: "ar" })),
      prefersDark: false,
    });

    expect(document.documentElement.getAttribute("lang")).toBe("ar");
    expect(document.documentElement.getAttribute("dir")).toBe("rtl");
  });

  it("ignores an unsupported language", () => {
    applyThemeBootstrap({
      storage: storageWith(settings({ language: "de" })),
      prefersDark: false,
    });

    expect(document.documentElement.hasAttribute("lang")).toBe(false);
    expect(document.documentElement.hasAttribute("dir")).toBe(false);
  });

  it("applies reduced motion", () => {
    applyThemeBootstrap({
      storage: storageWith(settings({ motion: "reduce" })),
      prefersDark: false,
    });

    expect(document.documentElement.getAttribute("data-motion")).toBe("reduce");
  });

  it("does not set motion for the system preference", () => {
    applyThemeBootstrap({
      storage: storageWith(settings({ motion: "system" })),
      prefersDark: false,
    });

    expect(document.documentElement.hasAttribute("data-motion")).toBe(false);
  });

  it("applies valid appearance attributes and high contrast", () => {
    applyThemeBootstrap({
      storage: storageWith(
        settings({
          appearance: {
            accent: "violet",
            fontScale: "large",
            density: "compact",
            radius: "rounded",
            highContrast: true,
          },
        }),
      ),
      prefersDark: false,
    });

    expect(document.documentElement.getAttribute("data-accent")).toBe("violet");
    expect(document.documentElement.getAttribute("data-font")).toBe("large");
    expect(document.documentElement.getAttribute("data-density")).toBe(
      "compact",
    );
    expect(document.documentElement.getAttribute("data-radius")).toBe(
      "rounded",
    );
    expect(document.documentElement.getAttribute("data-contrast")).toBe("high");
  });

  it("ignores invalid appearance values", () => {
    applyThemeBootstrap({
      storage: storageWith(
        settings({ appearance: { accent: "rainbow", fontScale: 2 } }),
      ),
      prefersDark: false,
    });

    expect(document.documentElement.hasAttribute("data-accent")).toBe(false);
    expect(document.documentElement.hasAttribute("data-font")).toBe(false);
  });

  it("still applies the theme when the settings blob is malformed", () => {
    applyThemeBootstrap({
      storage: storageWith({ theme: "dark", settings: "{ not json" }),
      prefersDark: false,
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.hasAttribute("data-accent")).toBe(false);
  });

  it("ignores a settings blob without a persisted state envelope", () => {
    applyThemeBootstrap({
      storage: storageWith({ settings: JSON.stringify({ version: 18 }) }),
      prefersDark: false,
    });

    expect(document.documentElement.hasAttribute("lang")).toBe(false);
  });
});
