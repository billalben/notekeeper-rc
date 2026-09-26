import { directionFor, isLanguage } from "@/app/i18n/languages";
import {
  ACCENT_COLORS,
  DENSITIES,
  FONT_SCALES,
  RADIUS_STYLES,
} from "@/shared/stores/settings/defaults";
import {
  PERSIST_STATE_KEY,
  SETTINGS_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from "@/shared/stores/storageKeys";

interface PersistedAppearance {
  accent?: unknown;
  fontScale?: unknown;
  density?: unknown;
  radius?: unknown;
  highContrast?: unknown;
}

interface PersistedState {
  language?: unknown;
  motion?: unknown;
  appearance?: PersistedAppearance;
}

export interface ThemeBootstrapEnv {
  doc: Document;
  storage: Pick<Storage, "getItem">;
  prefersDark: boolean;
}

const isOneOf = <T extends string>(
  allowed: readonly T[],
  value: unknown,
): value is T =>
  typeof value === "string" && (allowed as readonly string[]).includes(value);

const readState = (raw: string | null): PersistedState | null => {
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const state = (parsed as Record<string, unknown>)[PERSIST_STATE_KEY];
  return typeof state === "object" && state !== null
    ? (state as PersistedState)
    : null;
};

const systemPrefersDark = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

/**
 * Set theme, language, motion, and appearance attributes on the document root
 * before first paint, so persisted preferences do not flash. Runs as a
 * render-blocking inline script; `useDocumentAppearance`/`useLanguage` keep the
 * same attributes in sync once React has hydrated.
 */
export const applyThemeBootstrap = (env?: Partial<ThemeBootstrapEnv>): void => {
  try {
    const doc = env?.doc ?? document;
    const storage = env?.storage ?? window.localStorage;
    const prefersDark = env?.prefersDark ?? systemPrefersDark();

    const root = doc.documentElement;

    const storedTheme = storage.getItem(THEME_STORAGE_KEY);
    const theme =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : prefersDark
          ? "dark"
          : "light";
    root.setAttribute("data-theme", theme);

    const state = readState(storage.getItem(SETTINGS_STORAGE_KEY));
    if (!state) return;

    if (isLanguage(state.language)) {
      root.setAttribute("lang", state.language);
      root.setAttribute("dir", directionFor(state.language));
    }

    if (state.motion === "reduce" || state.motion === "full") {
      root.setAttribute("data-motion", state.motion);
    }

    const appearance = state.appearance;
    if (!appearance) return;

    if (isOneOf(ACCENT_COLORS, appearance.accent)) {
      root.setAttribute("data-accent", appearance.accent);
    }

    if (isOneOf(FONT_SCALES, appearance.fontScale)) {
      root.setAttribute("data-font", appearance.fontScale);
    }

    if (isOneOf(DENSITIES, appearance.density)) {
      root.setAttribute("data-density", appearance.density);
    }

    if (isOneOf(RADIUS_STYLES, appearance.radius)) {
      root.setAttribute("data-radius", appearance.radius);
    }

    if (appearance.highContrast === true) {
      root.setAttribute("data-contrast", "high");
    }
  } catch (error) {
    console.error("theme error: ", error);
  }
};
