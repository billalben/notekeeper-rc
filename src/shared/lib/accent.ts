import type { AccentColor } from "@/shared/stores/settings/types";

export const ACCENT_TOKENS = [
  "primary",
  "onPrimary",
  "primaryContainer",
  "onPrimaryContainer",
  "secondaryContainer",
  "onSecondaryContainer",
] as const;

type AccentToken = (typeof ACCENT_TOKENS)[number];

export type AccentPalette = Record<
  "light" | "dark",
  Record<AccentToken, string>
>;

const THEMES = ["light", "dark"] as const;

const CSS_TOKEN_NAMES: Record<AccentToken, string> = {
  primary: "primary",
  onPrimary: "on-primary",
  primaryContainer: "primary-container",
  onPrimaryContainer: "on-primary-container",
  secondaryContainer: "secondary-container",
  onSecondaryContainer: "on-secondary-container",
};

/** Every inline CSS variable a custom accent overrides. */
export const ACCENT_CSS_VARIABLES = THEMES.flatMap((theme) =>
  ACCENT_TOKENS.map((token) => `--${CSS_TOKEN_NAMES[token]}-${theme}`),
);

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Coerce user input to a lowercase `#rrggbb` value, or null when invalid. */
export const normalizeHexColor = (value: unknown): string | null => {
  if (typeof value !== "string") return null;

  const match = value.trim().match(HEX_PATTERN);
  if (!match) return null;

  const digits = (match[1] ?? "").toLowerCase();
  const expanded =
    digits.length === 3
      ? digits
          .split("")
          .map((digit) => `${digit}${digit}`)
          .join("")
      : digits;

  return `#${expanded}`;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const hexToRgb = (hex: string): [number, number, number] => {
  const digits = hex.slice(1);
  return [
    Number.parseInt(digits.slice(0, 2), 16),
    Number.parseInt(digits.slice(2, 4), 16),
    Number.parseInt(digits.slice(4, 6), 16),
  ];
};

interface Hsl {
  h: number;
  s: number;
  l: number;
}

const rgbToHsl = ([red, green, blue]: [number, number, number]): Hsl => {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const delta = max - min;
  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let h: number;
  if (max === r) h = (g - b) / delta + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  return { h: h * 60, s, l };
};

const hslToHex = (
  hue: number,
  saturation: number,
  lightness: number,
): string => {
  const h = ((hue % 360) + 360) % 360;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lightness - chroma / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    [r, g, b] = [chroma, x, 0];
  } else if (h < 120) {
    [r, g, b] = [x, chroma, 0];
  } else if (h < 180) {
    [r, g, b] = [0, chroma, x];
  } else if (h < 240) {
    [r, g, b] = [0, x, chroma];
  } else if (h < 300) {
    [r, g, b] = [x, 0, chroma];
  } else {
    [r, g, b] = [chroma, 0, x];
  }

  const toHex = (value: number): string =>
    Math.round((value + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const channelLuminance = (value: number): number => {
  const channel = value / 255;
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex);
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
};

/** WCAG 2 contrast ratio between two `#rrggbb` colors. */
export const contrastRatio = (a: string, b: string): number => {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
};

const bestOnColor = (
  background: string,
  hue: number,
  saturation: number,
): string => {
  const light = "#ffffff";
  const dark = hslToHex(hue, clamp(saturation * 0.5, 0, 0.8), 0.1);
  const candidate =
    contrastRatio(background, light) >= contrastRatio(background, dark)
      ? light
      : dark;

  if (contrastRatio(background, candidate) >= 4.5) return candidate;

  // Mid-tone backgrounds can leave both the tinted dark and white just under
  // 4.5:1. Pure black guarantees the best available contrast.
  return contrastRatio(background, "#000000") >=
    contrastRatio(background, light)
    ? "#000000"
    : light;
};

/**
 * Derive the same 12 Light/Dark tokens the preset accents define from a single
 * seed color. "On" colors are picked by real contrast so any hue stays readable.
 */
export const buildAccentPalette = (hex: string): AccentPalette => {
  const normalized = normalizeHexColor(hex);
  if (!normalized) throw new Error(`Invalid accent color: ${hex}`);

  const { h, s } = rgbToHsl(hexToRgb(normalized));

  const lightPrimary = hslToHex(h, clamp(s, 0.1, 0.95), 0.4);
  const lightContainer = hslToHex(h, clamp(s * 0.5, 0.06, 0.55), 0.9);
  const lightOnContainer = bestOnColor(lightContainer, h, s);

  const darkPrimary = hslToHex(h, clamp(s, 0.08, 0.8), 0.78);
  const darkContainer = hslToHex(h, clamp(s, 0.08, 0.75), 0.3);
  const darkOnContainer = bestOnColor(darkContainer, h, s);

  return {
    light: {
      primary: lightPrimary,
      onPrimary: bestOnColor(lightPrimary, h, s),
      primaryContainer: lightContainer,
      onPrimaryContainer: lightOnContainer,
      secondaryContainer: lightContainer,
      onSecondaryContainer: lightOnContainer,
    },
    dark: {
      primary: darkPrimary,
      onPrimary: bestOnColor(darkPrimary, h, s),
      primaryContainer: darkContainer,
      onPrimaryContainer: darkOnContainer,
      secondaryContainer: darkContainer,
      onSecondaryContainer: darkOnContainer,
    },
  };
};

/**
 * Apply an accent to the document root. Presets rely on the CSS blocks in
 * `preferences.css`; custom colors set the derived variables inline. Stale
 * inline variables are always removed first so switching presets is clean.
 */
export const applyAccentToRoot = (
  root: HTMLElement,
  accent: AccentColor,
  accentCustom?: unknown,
): void => {
  for (const variable of ACCENT_CSS_VARIABLES) {
    root.style.removeProperty(variable);
  }

  if (accent !== "custom") {
    root.setAttribute("data-accent", accent);
    return;
  }

  const customHex = normalizeHexColor(accentCustom);
  if (!customHex) {
    root.removeAttribute("data-accent");
    return;
  }

  const palette = buildAccentPalette(customHex);
  for (const theme of THEMES) {
    for (const token of ACCENT_TOKENS) {
      root.style.setProperty(
        `--${CSS_TOKEN_NAMES[token]}-${theme}`,
        palette[theme][token],
      );
    }
  }

  root.setAttribute("data-accent", accent);
};
