import i18n, { type ResourceLanguage } from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./resources/en";

const LANGUAGE_CODES = ["en", "fr", "ar"] as const;

export type Language = (typeof LANGUAGE_CODES)[number];

export const DEFAULT_LANGUAGE: Language = "en";

export interface LanguageMeta {
  code: Language;
  nativeLabel: string;
  dir: "ltr" | "rtl";
}

/** Ordered list used by the language picker in Settings. */
export const LANGUAGES: LanguageMeta[] = [
  { code: "en", nativeLabel: "English", dir: "ltr" },
  { code: "fr", nativeLabel: "Français", dir: "ltr" },
  { code: "ar", nativeLabel: "العربية", dir: "rtl" },
];

const defaultNS = "translation" as const;

// Only English ships in the initial bundle; the other locales are lazy chunks.
const resources = {
  en: { translation: en },
} as const;

type LoadableLanguage = Exclude<Language, typeof DEFAULT_LANGUAGE>;

const languageLoaders: Record<
  LoadableLanguage,
  () => Promise<{ default: ResourceLanguage }>
> = {
  fr: () => import("./resources/fr"),
  ar: () => import("./resources/ar"),
};

export const isLanguage = (value: unknown): value is Language =>
  typeof value === "string" &&
  (LANGUAGE_CODES as readonly string[]).includes(value);

export const directionFor = (language: string): "ltr" | "rtl" =>
  language === "ar" ? "rtl" : "ltr";

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: LANGUAGE_CODES,
  defaultNS,
  ns: [defaultNS],
  partialBundledLanguages: true,
  interpolation: { escapeValue: false },
  returnNull: false,
});

/**
 * Ensure the bundle for `language` is registered. English is already bundled;
 * `fr` and `ar` are fetched as separate chunks on first use.
 */
export const loadLanguage = async (language: Language): Promise<void> => {
  if (language === DEFAULT_LANGUAGE) return;
  if (i18n.hasResourceBundle(language, defaultNS)) return;

  const bundle = await languageLoaders[language]();
  i18n.addResourceBundle(language, defaultNS, bundle.default, true, true);
};

export default i18n;
