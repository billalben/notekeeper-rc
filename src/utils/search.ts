import Fuse, { type IFuseOptions, type RangeTuple } from "fuse.js";
import type { Note, Notebook } from "../types";
import { stripMarkdown } from "./text";

export interface SearchEntry {
  note: Note;
  notebookName: string;
}

export interface SearchResult {
  note: Note;
  notebookName: string;
  titleRanges: ReadonlyArray<RangeTuple>;
  snippet: string;
}

const SEARCH_LIMIT = 20;
const SNIPPET_BEFORE = 40;
const SNIPPET_AFTER = 90;

const FUSE_OPTIONS: IFuseOptions<SearchEntry> = {
  keys: ["note.title", "note.text"],
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
      notebook.notes
        .filter((note) => note.deletedAt === null)
        .map((note) => ({ note, notebookName: notebook.name })),
    );

export const createNoteSearchIndex = (
  entries: SearchEntry[],
): Fuse<SearchEntry> => new Fuse(entries, FUSE_OPTIONS);

/**
 * A short, single-line excerpt around the first body match. Falls back to the
 * start of the note when the query only matched the title or a match range is
 * unavailable.
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

export const runSearch = (
  fuse: Fuse<SearchEntry>,
  query: string,
  limit = SEARCH_LIMIT,
): SearchResult[] => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  return fuse.search(trimmed, { limit }).map((result) => ({
    note: result.item.note,
    notebookName: result.item.notebookName,
    titleRanges:
      result.matches?.find((match) => match.key === "note.title")?.indices ??
      [],
    snippet: buildSnippet(
      result.item.note.text,
      result.matches?.find((match) => match.key === "note.text")?.indices,
    ),
  }));
};
