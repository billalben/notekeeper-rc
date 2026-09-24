import type { Notebook } from "@/shared/types";

const TAG_MAX_LENGTH = 50;

/**
 * Normalize a raw tag string: trim, drop a single leading `#`, and collapse
 * internal whitespace to single spaces.
 */
export const normalizeTag = (raw: string): string =>
  raw
    .trim()
    .replace(/^#/, "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, TAG_MAX_LENGTH);

export const hasTag = (tags: string[], tag: string): boolean =>
  tags.some((item) => item.toLowerCase() === tag.toLowerCase());

/**
 * Add a tag if it is non-empty and not already present (case-insensitive).
 * Returns a new array, or the original array when nothing changed.
 */
export const addTag = (tags: string[], raw: string): string[] => {
  const tag = normalizeTag(raw);
  if (!tag || hasTag(tags, tag)) return tags;
  return [...tags, tag];
};

export const removeTag = (tags: string[], tag: string): string[] =>
  tags.filter((item) => item.toLowerCase() !== tag.toLowerCase());

export const sortTags = (tags: string[]): string[] =>
  [...tags].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );

/** Add each incoming tag (deduped case-insensitively) to the existing list. */
export const mergeTags = (existing: string[], incoming: string[]): string[] =>
  incoming.reduce((acc, tag) => addTag(acc, tag), existing);

/**
 * Collect every tag used by notes across all notebooks (including trashed
 * ones), deduplicated case-insensitively and sorted. Used to seed the tag
 * registry during migration.
 */
export const collectTags = (notebooks: Notebook[]): string[] => {
  const seen = new Map<string, string>();

  notebooks.forEach((notebook) => {
    notebook.notes.forEach((note) => {
      note.tags.forEach((tag) => {
        const key = tag.toLowerCase();
        if (!seen.has(key)) seen.set(key, tag);
      });
    });
  });

  return sortTags([...seen.values()]);
};
