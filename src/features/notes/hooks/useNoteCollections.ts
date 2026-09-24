import { useMemo } from "react";
import type { Note, Notebook } from "@/shared/types";
import {
  collectAllNotes,
  collectFavoriteNotes,
  collectPinnedNotes,
  collectRecentNotes,
  filterNotesByTags,
  sortByPinned,
  withMoveFlags,
} from "@/shared/lib/notes";
import type { NoteWithMoveFlags } from "../types";

const withoutMoveFlags = (notes: Note[]): NoteWithMoveFlags[] =>
  notes.map((note) => ({ ...note, canMoveUp: false, canMoveDown: false }));

interface UseNoteCollectionsInput {
  notebooks: Notebook[];
  activeNotebook: Notebook | null;
  activeTags: string[];
}

/**
 * The note lists backing every main view (active notebook or tag filter, plus
 * Favorites/Pinned/All/Recent), each sorted and annotated with move flags.
 */
export const useNoteCollections = ({
  notebooks,
  activeNotebook,
  activeTags,
}: UseNoteCollectionsInput) => {
  const isFiltering = activeTags.length > 0;

  return useMemo(() => {
    const activeNotes = isFiltering
      ? withoutMoveFlags(sortByPinned(filterNotesByTags(notebooks, activeTags)))
      : withMoveFlags(
          sortByPinned(
            activeNotebook?.notes.filter((note) => note.deletedAt === null) ??
              [],
          ),
        );

    return {
      isFiltering,
      activeNotes,
      favoriteNotes: withoutMoveFlags(collectFavoriteNotes(notebooks)),
      pinnedNotes: withoutMoveFlags(collectPinnedNotes(notebooks)),
      allNotes: withoutMoveFlags(collectAllNotes(notebooks)),
      recentNotes: withoutMoveFlags(collectRecentNotes(notebooks)),
    };
  }, [notebooks, activeNotebook, activeTags, isFiltering]);
};
