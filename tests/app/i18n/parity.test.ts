import { describe, expect, it } from "vitest";
import en from "@/app/i18n/resources/en";
import fr from "@/app/i18n/resources/fr";
import ar from "@/app/i18n/resources/ar";

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

const flatten = (
  tree: unknown,
  prefix = "",
  out: Record<string, string> = {},
): Record<string, string> => {
  if (tree === null || typeof tree !== "object") return out;
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[path] = value;
    else flatten(value, path, out);
  }
  return out;
};

const isPlural = (key: string): boolean => PLURAL_SUFFIX.test(key);
const baseKey = (key: string): string => key.replace(PLURAL_SUFFIX, "");

const placeholders = (value: string): string[] =>
  [...value.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort();

/** Locales expose different CLDR plural categories, so compare base keys. */
const baseKeys = (entries: Record<string, string>): string[] =>
  [...new Set(Object.keys(entries).map(baseKey))].sort();

/** Use the `_other` form as the canonical placeholder source for plurals. */
const placeholderMap = (
  entries: Record<string, string>,
): Record<string, string[]> => {
  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (isPlural(key)) {
      if (key.endsWith("_other")) out[baseKey(key)] = placeholders(value);
    } else {
      out[key] = placeholders(value);
    }
  }
  return out;
};

const locales = { en, fr, ar } as const;
const flat = {
  en: flatten(locales.en),
  fr: flatten(locales.fr),
  ar: flatten(locales.ar),
} as const;
const referenceKeys = baseKeys(flat.en);
const referencePlaceholders = placeholderMap(flat.en);

describe("i18n locale parity", () => {
  it("has the same keys in every locale", () => {
    expect(baseKeys(flat.fr)).toEqual(referenceKeys);
    expect(baseKeys(flat.ar)).toEqual(referenceKeys);
  });

  it("provides a plural `_other` fallback for every plural base", () => {
    for (const [locale, entries] of Object.entries(flat)) {
      const pluralBases = new Set(
        Object.keys(entries).filter(isPlural).map(baseKey),
      );
      for (const base of pluralBases) {
        expect(entries, `${locale} ${base}`).toHaveProperty(`${base}_other`);
      }
    }
  });

  it("has no empty translations", () => {
    for (const [locale, entries] of Object.entries(flat)) {
      for (const [key, value] of Object.entries(entries)) {
        expect(value, `${locale} ${key}`).not.toBe("");
      }
    }
  });

  it("uses the same interpolation placeholders per key", () => {
    expect(placeholderMap(flat.fr)).toEqual(referencePlaceholders);
    expect(placeholderMap(flat.ar)).toEqual(referencePlaceholders);
  });
});
