import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./resources/ar";
import en from "./resources/en";
import fr from "./resources/fr";

export const LANGUAGE_CODES = ["en", "fr", "ar"] as const;

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

export const defaultNS = "translation" as const;

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar },
} as const;

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
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
