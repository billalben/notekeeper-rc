import { useMemo } from "react";
import type { Notebook } from "@/shared/types";
import {
  collectAllNotes,
  collectFavoriteNotes,
  collectPinnedNotes,
  collectRecentNotes,
  filterNotesByTags,
  isActiveNote,
  sortByPinned,
  withMoveFlags,
  withoutMoveFlags,
} from "@/shared/lib/notes";
import type { MainView } from "@/shared/stores/useUIStore";
import type { NoteWithMoveFlags } from "../types";

interface UseNoteCollectionsInput {
  notebooks: Notebook[];
  activeNotebook: Notebook | null;
  activeTags: string[];
  view: MainView;
}

const EMPTY: NoteWithMoveFlags[] = [];

/**
 * The note lists backing every main view (active notebook or tag filter, plus
 * Favorites/Pinned/All/Recent), each sorted and annotated with move flags.
 * Only the collection behind the visible view is computed, so editing a note
 * in the sidebar does not re-sort every other view.
 */
export const useNoteCollections = ({
  notebooks,
  activeNotebook,
  activeTags,
  view,
}: UseNoteCollectionsInput) => {
  const isFiltering = activeTags.length > 0;

  return useMemo(() => {
    const isNotebookView =
      view !== "all" &&
      view !== "recent" &&
      view !== "pinned" &&
      view !== "favorites" &&
      view !== "trash" &&
      view !== "archive" &&
      view !== "stats";

    const activeNotes = isNotebookView
      ? isFiltering
        ? withoutMoveFlags(
            sortByPinned(filterNotesByTags(notebooks, activeTags)),
          )
        : withMoveFlags(
            sortByPinned(activeNotebook?.notes.filter(isActiveNote) ?? []),
          )
      : EMPTY;

    return {
      isFiltering,
      activeNotes,
      favoriteNotes:
        view === "favorites"
          ? withoutMoveFlags(collectFavoriteNotes(notebooks))
          : EMPTY,
      pinnedNotes:
        view === "pinned"
          ? withoutMoveFlags(collectPinnedNotes(notebooks))
          : EMPTY,
      allNotes:
        view === "all" ? withoutMoveFlags(collectAllNotes(notebooks)) : EMPTY,
      recentNotes:
        view === "recent"
          ? withoutMoveFlags(collectRecentNotes(notebooks))
          : EMPTY,
    };
  }, [notebooks, activeNotebook, activeTags, isFiltering, view]);
};
