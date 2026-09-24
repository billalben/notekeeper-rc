import type { Notebook } from "@/shared/types";
import {
  collectRecentNotes,
  sortByPinned,
  withMoveFlags,
} from "@/shared/lib/notes";

/** Counts and ordering the sidebar derives from the notebook tree. */
export const computeSidebarCounts = (notebooks: Notebook[]) => {
  const visibleNotebooks = withMoveFlags(
    sortByPinned(notebooks.filter((notebook) => notebook.deletedAt === null)),
  );

  const totalNotes = visibleNotebooks.reduce(
    (total, notebook) =>
      total + notebook.notes.filter((note) => note.deletedAt === null).length,
    0,
  );
  const trashedCount =
    notebooks.filter((notebook) => notebook.deletedAt !== null).length +
    visibleNotebooks.reduce(
      (total, notebook) =>
        total + notebook.notes.filter((note) => note.deletedAt !== null).length,
      0,
    );
  const favoriteCount = visibleNotebooks.reduce(
    (total, notebook) =>
      total +
      notebook.notes.filter((note) => note.deletedAt === null && note.favorite)
        .length,
    0,
  );
  const pinnedCount = visibleNotebooks.reduce(
    (total, notebook) =>
      total +
      notebook.notes.filter((note) => note.deletedAt === null && note.pinned)
        .length,
    0,
  );
  const recentCount = collectRecentNotes(notebooks).length;

  return {
    visibleNotebooks,
    totalNotes,
    trashedCount,
    favoriteCount,
    pinnedCount,
    recentCount,
  };
};
