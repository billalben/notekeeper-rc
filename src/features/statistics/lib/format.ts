import { stripMarkdown } from "@/shared/lib/text";
import type { Note } from "@/shared/types";

export const formatNumber = (value: number, locale: string): string =>
  value.toLocaleString(locale);

export const formatAverage = (value: number, locale: string): string =>
  Number.isInteger(value)
    ? value.toLocaleString(locale)
    : value.toLocaleString(locale, { maximumFractionDigits: 1 });

export const notePreview = (note: Note): string => {
  const text = stripMarkdown(note.text).replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > 140 ? `${text.slice(0, 140).trimEnd()}…` : text;
};
