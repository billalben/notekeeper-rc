import { afterEach, describe, expect, it } from "vitest";
import {
  ACCENT_CSS_VARIABLES,
  ACCENT_TOKENS,
  applyAccentToRoot,
  buildAccentPalette,
  contrastRatio,
  normalizeHexColor,
} from "@/shared/lib/accent";

const SEEDS = [
  "#ff0000",
  "#ff8800",
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#0000ff",
  "#8800ff",
  "#ff00ff",
  "#808080",
  "#000000",
  "#ffffff",
];

const resetRoot = (): void => {
  document.documentElement.removeAttribute("data-accent");
  document.documentElement.style.cssText = "";
};

afterEach(resetRoot);

describe("normalizeHexColor", () => {
  it("normalizes valid colors", () => {
    expect(normalizeHexColor("#7C4DFF")).toBe("#7c4dff");
    expect(normalizeHexColor("7c4dff")).toBe("#7c4dff");
    expect(normalizeHexColor("#abc")).toBe("#aabbcc");
    expect(normalizeHexColor("  #ABC  ")).toBe("#aabbcc");
  });

  it("rejects invalid colors", () => {
    expect(normalizeHexColor("pink")).toBeNull();
    expect(normalizeHexColor("#12345")).toBeNull();
    expect(normalizeHexColor("")).toBeNull();
    expect(normalizeHexColor(null)).toBeNull();
    expect(normalizeHexColor(42)).toBeNull();
  });
});

describe("buildAccentPalette", () => {
  it("throws for an invalid seed", () => {
    expect(() => buildAccentPalette("not-a-color")).toThrow();
  });

  it("returns complete light and dark palettes", () => {
    for (const seed of SEEDS) {
      const palette = buildAccentPalette(seed);

      for (const theme of ["light", "dark"] as const) {
        for (const token of ACCENT_TOKENS) {
          expect(palette[theme][token]).toMatch(/^#[0-9a-f]{6}$/);
        }
      }
    }
  });

  it("derives readable on-colors for every hue", () => {
    for (const seed of SEEDS) {
      const { light, dark } = buildAccentPalette(seed);

      expect(
        contrastRatio(light.primary, light.onPrimary),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(light.primaryContainer, light.onPrimaryContainer),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(dark.primary, dark.onPrimary),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(dark.primaryContainer, dark.onPrimaryContainer),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("is deterministic", () => {
    expect(buildAccentPalette("#7c4dff")).toEqual(
      buildAccentPalette("#7C4DFF"),
    );
  });
});

describe("applyAccentToRoot", () => {
  const root = (): HTMLElement => document.documentElement;

  it("sets data-accent for presets without inline variables", () => {
    applyAccentToRoot(root(), "blue", "#7c4dff");

    expect(root().getAttribute("data-accent")).toBe("blue");
    for (const variable of ACCENT_CSS_VARIABLES) {
      expect(root().style.getPropertyValue(variable)).toBe("");
    }
  });

  it("sets derived variables for a custom accent", () => {
    const palette = buildAccentPalette("#7c4dff");

    applyAccentToRoot(root(), "custom", "#7c4dff");

    expect(root().getAttribute("data-accent")).toBe("custom");
    expect(root().style.getPropertyValue("--primary-light")).toBe(
      palette.light.primary,
    );
    expect(root().style.getPropertyValue("--primary-dark")).toBe(
      palette.dark.primary,
    );
  });

  it("clears custom variables when switching back to a preset", () => {
    applyAccentToRoot(root(), "custom", "#7c4dff");
    applyAccentToRoot(root(), "green");

    expect(root().getAttribute("data-accent")).toBe("green");
    for (const variable of ACCENT_CSS_VARIABLES) {
      expect(root().style.getPropertyValue(variable)).toBe("");
    }
  });

  it("ignores an invalid custom color", () => {
    applyAccentToRoot(root(), "custom", "not-a-color");

    expect(root().hasAttribute("data-accent")).toBe(false);
    for (const variable of ACCENT_CSS_VARIABLES) {
      expect(root().style.getPropertyValue(variable)).toBe("");
    }
  });
});
