export const LANGUAGE_CODES = ["en", "fr", "ar"] as const;

export type Language = (typeof LANGUAGE_CODES)[number];

export const DEFAULT_LANGUAGE = "en" satisfies Language;

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

export const isLanguage = (value: unknown): value is Language =>
  typeof value === "string" &&
  (LANGUAGE_CODES as readonly string[]).includes(value);

export const directionFor = (language: string): "ltr" | "rtl" =>
  language === "ar" ? "rtl" : "ltr";
