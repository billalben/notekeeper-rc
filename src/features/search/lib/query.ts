import { hasTag } from "@/shared/lib/tags";
import type { Note } from "@/shared/types";

export interface SearchFilters {
  tags: string[];
  notebooks: string[];
  pinned: boolean;
  favorite: boolean;
  /** Exclusive local start-of-day timestamp. */
  before: number | null;
  /** Inclusive local start-of-day timestamp. */
  after: number | null;
}

export interface ParsedSearchQuery {
  text: string;
  filters: SearchFilters;
}

export interface FilterableSearchEntry {
  note: Note;
  notebookId: string;
  notebookName: string;
}

const OPERATOR_PATTERN =
  /(^|\s)(tag|notebook|is|before|after):(?:"([^"]*)"|(\S+))/gi;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const createEmptyFilters = (): SearchFilters => ({
  tags: [],
  notebooks: [],
  pinned: false,
  favorite: false,
  before: null,
  after: null,
});

const addUnique = (values: string[], value: string): void => {
  const normalized = value.trim();
  if (!normalized) return;

  const key = normalized.toLowerCase();
  if (values.some((item) => item.toLowerCase() === key)) return;
  values.push(normalized);
};

/** Parse a `YYYY-MM-DD` value into a local start-of-day timestamp. */
const parseDateBoundary = (value: string): number | null => {
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  // Reject rollovers such as 2026-02-31.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date.getTime();
};

/**
 * Split a search query into free text and supported operators. Unknown or
 * invalid operators stay in the free-text portion so they can still be
 * searched literally.
 */
export const parseSearchQuery = (raw: string): ParsedSearchQuery => {
  const filters = createEmptyFilters();

  const text = raw
    .replace(
      OPERATOR_PATTERN,
      (match, _leading, rawKey: string, quoted, bare) => {
        const key = rawKey.toLowerCase();
        const value = (quoted ?? bare ?? "").trim();
        if (!value) return match;

        switch (key) {
          case "tag":
            addUnique(filters.tags, value);
            return "";
          case "notebook":
            addUnique(filters.notebooks, value);
            return "";
          case "is": {
            const flag = value.toLowerCase();
            if (flag === "pinned") {
              filters.pinned = true;
              return "";
            }
            if (flag === "favorite") {
              filters.favorite = true;
              return "";
            }
            return match;
          }
          case "before": {
            const timestamp = parseDateBoundary(value);
            if (timestamp === null) return match;
            filters.before = timestamp;
            return "";
          }
          case "after": {
            const timestamp = parseDateBoundary(value);
            if (timestamp === null) return match;
            filters.after = timestamp;
            return "";
          }
          default:
            return match;
        }
      },
    )
    .replace(/\s+/g, " ")
    .trim();

  return { text, filters };
};

export const hasActiveFilters = (filters: SearchFilters): boolean =>
  filters.tags.length > 0 ||
  filters.notebooks.length > 0 ||
  filters.pinned ||
  filters.favorite ||
  filters.before !== null ||
  filters.after !== null;

const matchesNotebook = (
  entry: FilterableSearchEntry,
  notebooks: string[],
): boolean => {
  if (notebooks.length === 0) return true;

  return notebooks.some((notebook) => {
    const value = notebook.toLowerCase();
    return (
      entry.notebookId.toLowerCase() === value ||
      entry.notebookName.toLowerCase().includes(value)
    );
  });
};

export const matchesSearchFilters = (
  entry: FilterableSearchEntry,
  filters: SearchFilters,
): boolean =>
  filters.tags.every((tag) => hasTag(entry.note.tags, tag)) &&
  matchesNotebook(entry, filters.notebooks) &&
  (!filters.pinned || entry.note.pinned) &&
  (!filters.favorite || entry.note.favorite) &&
  (filters.before === null || entry.note.updatedOn < filters.before) &&
  (filters.after === null || entry.note.updatedOn >= filters.after);
