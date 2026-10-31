import { useCallback, useMemo, useState } from "react";
import type { Note } from "@/shared/types";

/**
 * Multi-select state for a note list. Stored ids are intersected with the
 * current list, and selection is cleared after a bulk action or when the user
 * leaves selection mode.
 */
export const useNoteSelection = (notes: Note[]) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const startSelecting = useCallback(() => setIsSelecting(true), []);

  const cancelSelection = useCallback(() => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelected = useCallback((note: Note) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(note.id)) next.delete(note.id);
      else next.add(note.id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(notes.map((note) => note.id)));
  }, [notes]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const selectedNotes = useMemo(
    () => notes.filter((note) => selectedIds.has(note.id)),
    [notes, selectedIds],
  );

  const allSelected = notes.length > 0 && selectedNotes.length === notes.length;

  return {
    isSelecting,
    selectedIds,
    selectedNotes,
    allSelected,
    startSelecting,
    cancelSelection,
    toggleSelected,
    selectAll,
    clearSelection,
  };
};
