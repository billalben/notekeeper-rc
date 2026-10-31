import Fuse, {
  type FuseResultMatch,
  type IFuseOptions,
  type RangeTuple,
} from "fuse.js";
import type { Note, Notebook } from "@/shared/types";
import { isActiveNote } from "@/shared/lib/notes";
import { stripMarkdown } from "@/shared/lib/text";
import {
  hasActiveFilters,
  matchesSearchFilters,
  parseSearchQuery,
} from "./query";

export interface SearchEntry {
  note: Note;
  notebookId: string;
  notebookName: string;
}

interface SearchTagMatch {
  tag: string;
  ranges: ReadonlyArray<RangeTuple>;
}

export interface SearchResult {
  note: Note;
  notebookName: string;
  titleRanges: ReadonlyArray<RangeTuple>;
  tagMatches: SearchTagMatch[];
  snippet: string;
}

export interface SearchIndex {
  entries: SearchEntry[];
  fuse: Fuse<SearchEntry>;
}

const SEARCH_LIMIT = 20;
const SNIPPET_BEFORE = 40;
const SNIPPET_AFTER = 90;

const FUSE_OPTIONS: IFuseOptions<SearchEntry> = {
  keys: [
    { name: "note.title", weight: 2 },
    { name: "note.text", weight: 1 },
    { name: "note.tags", weight: 1.5 },
  ],
  includeMatches: true,
  includeScore: true,
  ignoreLocation: true,
  threshold: 0.35,
  minMatchCharLength: 2,
  shouldSort: true,
};

/**
 * Every visible (non-trashed) note in a visible notebook, paired with its
 * notebook name so cross-notebook results can show where they come from.
 */
export const collectSearchEntries = (notebooks: Notebook[]): SearchEntry[] =>
  notebooks
    .filter((notebook) => notebook.deletedAt === null)
    .flatMap((notebook) =>
      notebook.notes.filter(isActiveNote).map((note) => ({
        note,
        notebookId: notebook.id,
        notebookName: notebook.name,
      })),
    );

export const createNoteSearchIndex = (entries: SearchEntry[]): SearchIndex => ({
  entries,
  fuse: new Fuse(entries, FUSE_OPTIONS),
});

/**
 * A short, single-line excerpt around the first body match. Falls back to the
 * start of the note when the query only matched the title, a tag, or a filter.
 */
const buildSnippet = (
  text: string,
  indices: ReadonlyArray<RangeTuple> | undefined,
): string => {
  const first = indices?.[0];
  const start = first ? Math.max(0, first[0] - SNIPPET_BEFORE) : 0;
  const end = first
    ? Math.min(text.length, first[1] + SNIPPET_AFTER)
    : Math.min(text.length, SNIPPET_BEFORE + SNIPPET_AFTER);

  const excerpt = stripMarkdown(text.slice(start, end))
    .replace(/\s+/g, " ")
    .trim();
  if (!excerpt) return "";

  return `${start > 0 ? "…" : ""}${excerpt}${end < text.length ? "…" : ""}`;
};

/** Fuse reports one match per array item, so group tag matches by tag name. */
const collectTagMatches = (
  matches: ReadonlyArray<FuseResultMatch> | undefined,
): SearchTagMatch[] => {
  if (!matches) return [];

  const byTag = new Map<string, { tag: string; ranges: RangeTuple[] }>();

  matches
    .filter((match) => match.key === "note.tags")
    .forEach((match) => {
      const tag = match.value;
      if (!tag) return;

      const key = tag.toLowerCase();
      const existing = byTag.get(key);
      if (existing) {
        existing.ranges.push(...match.indices);
        return;
      }

      byTag.set(key, { tag, ranges: [...match.indices] });
    });

  return [...byTag.values()];
};

const toResult = (
  entry: SearchEntry,
  matches?: ReadonlyArray<FuseResultMatch>,
): SearchResult => ({
  note: entry.note,
  notebookName: entry.notebookName,
  titleRanges:
    matches?.find((match) => match.key === "note.title")?.indices ?? [],
  tagMatches: collectTagMatches(matches),
  snippet: buildSnippet(
    entry.note.text,
    matches?.find((match) => match.key === "note.text")?.indices,
  ),
});

export const runSearch = (
  index: SearchIndex,
  query: string,
  limit = SEARCH_LIMIT,
): SearchResult[] => {
  const { text, filters } = parseSearchQuery(query);
  const hasFilters = hasActiveFilters(filters);

  if (!text && !hasFilters) return [];

  // Filter-only queries have no Fuse input, so order them by recency.
  if (!text) {
    return index.entries
      .filter((entry) => matchesSearchFilters(entry, filters))
      .sort((a, b) => b.note.updatedOn - a.note.updatedOn)
      .slice(0, limit)
      .map((entry) => toResult(entry));
  }

  return index.fuse
    .search(text)
    .filter((result) => matchesSearchFilters(result.item, filters))
    .slice(0, limit)
    .map((result) => toResult(result.item, result.matches));
};
