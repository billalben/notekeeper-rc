import { SEARCH_HISTORY_STORAGE_KEY } from "@/shared/stores/storageKeys";

export const MAX_RECENT_SEARCHES = 8;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

/** Trim, drop blanks, dedupe case-insensitively, and cap the list. */
const normalizeHistory = (queries: string[]): string[] => {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const raw of queries) {
    const query = raw.trim();
    if (!query) continue;

    const key = query.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    normalized.push(query);
    if (normalized.length === MAX_RECENT_SEARCHES) break;
  }

  return normalized;
};

export const readSearchHistory = (): string[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return isStringArray(parsed) ? normalizeHistory(parsed) : [];
  } catch {
    return [];
  }
};

export const writeSearchHistory = (queries: string[]): void => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      SEARCH_HISTORY_STORAGE_KEY,
      JSON.stringify(normalizeHistory(queries)),
    );
  } catch {
    /* ignore unavailable or full storage */
  }
};

export const addSearchHistoryEntry = (
  history: string[],
  query: string,
): string[] => normalizeHistory([query, ...history]);

export const removeSearchHistoryEntry = (
  history: string[],
  query: string,
): string[] => {
  const key = query.trim().toLowerCase();
  return history.filter((item) => item.toLowerCase() !== key);
};
