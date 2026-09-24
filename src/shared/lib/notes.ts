import type { Note, Notebook } from "@/shared/types";
import { hasTag } from "./tags";

export const sortByPinned = <T extends { pinned: boolean }>(items: T[]): T[] =>
  [...items].sort((a, b) => Number(b.pinned) - Number(a.pinned));

/**
 * Usage count per tag, keyed by lowercased tag name, across all notes
 * (including trashed ones).
 */
export const countTagUsageMap = (
  notebooks: Notebook[],
): Record<string, number> => {
  const counts: Record<string, number> = {};

  notebooks.forEach((notebook) =>
    notebook.notes.forEach((note) =>
      note.tags.forEach((tag) => {
        const key = tag.toLowerCase();
        counts[key] = (counts[key] ?? 0) + 1;
      }),
    ),
  );

  return counts;
};

const noteHasTag = (note: Note, tag: string): boolean => hasTag(note.tags, tag);

/**
 * Every visible note (across visible notebooks) that carries **all** of the
 * given tags, case-insensitively. An empty tag list matches nothing.
 */
export const filterNotesByTags = (
  notebooks: Notebook[],
  tags: string[],
): Note[] => {
  if (tags.length === 0) return [];

  return notebooks
    .filter((notebook) => notebook.deletedAt === null)
    .flatMap((notebook) =>
      notebook.notes.filter(
        (note) =>
          note.deletedAt === null && tags.every((tag) => noteHasTag(note, tag)),
      ),
    );
};

/**
 * Every visible (non-trashed) favorite note across visible notebooks, most
 * recently updated first.
 */
export const collectFavoriteNotes = (notebooks: Notebook[]): Note[] =>
  notebooks
    .filter((notebook) => notebook.deletedAt === null)
    .flatMap((notebook) =>
      notebook.notes.filter((note) => note.deletedAt === null && note.favorite),
    )
    .sort((a, b) => b.updatedOn - a.updatedOn);

/**
 * Every visible (non-trashed) pinned note across visible notebooks, most
 * recently updated first.
 */
export const collectPinnedNotes = (notebooks: Notebook[]): Note[] =>
  notebooks
    .filter((notebook) => notebook.deletedAt === null)
    .flatMap((notebook) =>
      notebook.notes.filter((note) => note.deletedAt === null && note.pinned),
    )
    .sort((a, b) => b.updatedOn - a.updatedOn);

/**
 * Every visible (non-trashed) note across visible notebooks, pinned first, then
 * most recently updated first.
 */
export const collectAllNotes = (notebooks: Notebook[]): Note[] =>
  notebooks
    .filter((notebook) => notebook.deletedAt === null)
    .flatMap((notebook) =>
      notebook.notes.filter((note) => note.deletedAt === null),
    )
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) || b.updatedOn - a.updatedOn,
    );

/** Maximum number of notes surfaced in the Recent view. */
const RECENT_NOTES_LIMIT = 20;

/**
 * The most recently updated visible (non-trashed) notes across visible
 * notebooks, newest first, capped at `limit`. Recency wins over pinned order.
 */
export const collectRecentNotes = (
  notebooks: Notebook[],
  limit = RECENT_NOTES_LIMIT,
): Note[] =>
  notebooks
    .filter((notebook) => notebook.deletedAt === null)
    .flatMap((notebook) =>
      notebook.notes.filter((note) => note.deletedAt === null),
    )
    .sort((a, b) => b.updatedOn - a.updatedOn)
    .slice(0, limit);

export type MoveDirection = "up" | "down";

interface Movable {
  id: string;
  pinned: boolean;
  deletedAt: number | null;
}

/**
 * Swap an item with its nearest visible (non-trashed) neighbour in the given
 * direction. Movement is confined to the item's own pinned group so pinned
 * items always stay above unpinned ones. Returns a new array, or the original
 * array unchanged when no valid move exists.
 */
export const moveWithinGroup = <T extends Movable>(
  items: T[],
  id: string,
  direction: MoveDirection,
): T[] => {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return items;

  const target = items[index];
  const isVisible = (item: Movable) => item.deletedAt === null;
  const isSameGroup = (item: Movable) => item.pinned === target.pinned;

  const step = direction === "up" ? -1 : 1;
  let neighbourIndex = -1;
  for (let i = index + step; i >= 0 && i < items.length; i += step) {
    const candidate = items[i];
    if (isVisible(candidate) && isSameGroup(candidate)) {
      neighbourIndex = i;
      break;
    }
    if (isVisible(candidate) && !isSameGroup(candidate)) break;
  }

  if (neighbourIndex === -1) return items;

  const next = [...items];
  next[index] = next[neighbourIndex];
  next[neighbourIndex] = target;
  return next;
};

export interface MoveFlags {
  canMoveUp: boolean;
  canMoveDown: boolean;
}

/**
 * Compute per-item move availability from a list already ordered for display
 * (pinned first). Only same-pinned-state, visible neighbours count.
 */
export const withMoveFlags = <T extends Movable>(
  items: T[],
): (T & MoveFlags)[] =>
  items.map((item, index) => {
    const prev = items[index - 1];
    const next = items[index + 1];
    const sameGroup = (other: Movable | undefined) =>
      other !== undefined &&
      other.deletedAt === null &&
      other.pinned === item.pinned;

    return {
      ...item,
      canMoveUp: sameGroup(prev),
      canMoveDown: sameGroup(next),
    };
  });
