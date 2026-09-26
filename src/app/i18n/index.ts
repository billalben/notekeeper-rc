import i18n, { type ResourceLanguage } from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./resources/en";
import { DEFAULT_LANGUAGE, LANGUAGE_CODES, type Language } from "./languages";

export * from "./languages";

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
