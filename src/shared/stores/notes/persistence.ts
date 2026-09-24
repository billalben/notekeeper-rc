import type { Notebook } from "@/shared/types";
import { collectTags } from "@/shared/lib/tags";

export const STORAGE_KEY = "noteKeeperDB";
export const STORAGE_VERSION = 7;

/**
 * Backfill fields added after a note/notebook was first created:
 * `updatedOn` (v2), `deletedAt` (v3), `pinned` (v4), `tags` (v5), and
 * `favorite` (v7). The store-level tag registry added in v6 is seeded
 * separately in `migrate`.
 */
export const withDefaults = (notebooks: Notebook[]): Notebook[] =>
  notebooks.map((notebook) => ({
    ...notebook,
    deletedAt: notebook.deletedAt ?? null,
    pinned: notebook.pinned ?? false,
    notes: notebook.notes.map((note) => ({
      ...note,
      updatedOn: note.updatedOn ?? note.postedOn,
      deletedAt: note.deletedAt ?? null,
      pinned: note.pinned ?? false,
      favorite: note.favorite ?? false,
      tags: Array.isArray(note.tags) ? note.tags : [],
    })),
  }));

interface TrashState {
  notebooks: Notebook[];
  activeNotebookId: string | null;
}

/**
 * Remove trashed items. With a `cutoff` timestamp, only items deleted at or
 * before it are removed; with `null`, everything in the trash is removed.
 */
export const removeExpired = (
  state: TrashState,
  cutoff: number | null,
): TrashState => {
  const isExpired = (deletedAt: number | null) =>
    deletedAt !== null && (cutoff === null || deletedAt <= cutoff);

  const notebooks = state.notebooks
    .filter((notebook) => !isExpired(notebook.deletedAt))
    .map((notebook) => ({
      ...notebook,
      notes: notebook.notes.filter((note) => !isExpired(note.deletedAt)),
    }));

  const activeNotebookId = notebooks.some(
    (notebook) => notebook.id === state.activeNotebookId,
  )
    ? state.activeNotebookId
    : (notebooks[0]?.id ?? null);

  return { notebooks, activeNotebookId };
};

/**
 * The legacy app stored `{ notebooks: [...] }` directly under `noteKeeperDB`.
 * Zustand's persist middleware expects `{ state, version }`, so convert the
 * old shape once on startup to keep existing notes.
 */
export const migrateLegacyStorage = (): void => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.notebooks) && !("state" in parsed)) {
      const notebooks = withDefaults(parsed.notebooks as Notebook[]);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          state: {
            notebooks,
            tags: collectTags(notebooks),
            activeNotebookId: notebooks[0]?.id ?? null,
          },
          version: STORAGE_VERSION,
        }),
      );
    }
  } catch {
    /* ignore malformed storage */
  }
};
