import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import { useUIStore, type MainView } from "@/shared/stores/useUIStore";
import type { Note, Notebook } from "@/shared/types";

const findNoteById = (
  notebooks: Notebook[],
  id: string | null,
): Note | null => {
  if (!id) return null;
  for (const notebook of notebooks) {
    const note = notebook.notes.find((item) => item.id === id);
    if (note) return note;
  }
  return null;
};

interface UseEditorSessionInput {
  notebooks: Notebook[];
  visibleNotebookCount: number;
  isWide: boolean;
  view: MainView;
}

/**
 * Owns note selection and the modal-vs-split presentation decision, plus the
 * unsaved-changes guard used when switching notes.
 */
export const useEditorSession = ({
  notebooks,
  visibleNotebookCount,
  isWide,
  view,
}: UseEditorSessionInput) => {
  const presentation = useSettingsStore((state) => state.editor.presentation);
  const autosave = useSettingsStore((state) => state.editor.autosave);

  const selectedNoteId = useUIStore((state) => state.selectedNoteId);
  const selectNote = useUIStore((state) => state.selectNote);
  const editorNoteId = useUIStore((state) => state.editorNoteId);
  const isCreatingNote = useUIStore((state) => state.isCreatingNote);
  const openNoteModal = useUIStore((state) => state.openNoteModal);
  const openCreateNoteModal = useUIStore((state) => state.openCreateNoteModal);
  const closeNoteModal = useUIStore((state) => state.closeNoteModal);

  const [pendingSelectNoteId, setPendingSelectNoteId] = useState<string | null>(
    null,
  );
  const editorDirtyRef = useRef(false);

  const selectedNote = useMemo(
    () => findNoteById(notebooks, selectedNoteId),
    [notebooks, selectedNoteId],
  );
  const editorNote = useMemo(
    () => findNoteById(notebooks, editorNoteId),
    [notebooks, editorNoteId],
  );

  const activeSplitNote =
    selectedNote &&
    selectedNote.deletedAt === null &&
    selectedNote.archivedAt === null
      ? selectedNote
      : null;

  const isNoteView = view !== "stats" && view !== "trash" && view !== "archive";
  const isSplitEnabled = presentation === "split" && isWide && isNoteView;
  const showSplitPane =
    isSplitEnabled && (isCreatingNote || activeSplitNote !== null);
  const showNoteModal =
    !isSplitEnabled &&
    (isCreatingNote ||
      (editorNote !== null &&
        editorNote.deletedAt === null &&
        editorNote.archivedAt === null));

  useEffect(() => {
    if (
      editorNoteId &&
      (!editorNote ||
        editorNote.deletedAt !== null ||
        editorNote.archivedAt !== null)
    ) {
      closeNoteModal();
    }
  }, [editorNoteId, editorNote, closeNoteModal]);

  const selectNone = useCallback(() => {
    closeNoteModal();
    selectNote(null);
  }, [closeNoteModal, selectNote]);

  const applySelectNote = useCallback(
    (noteId: string | null) => {
      closeNoteModal();
      selectNote(noteId);
    },
    [closeNoteModal, selectNote],
  );

  const openCreateNote = useCallback(() => {
    if (visibleNotebookCount === 0) return;
    if (isSplitEnabled) selectNote(null);
    openCreateNoteModal();
  }, [visibleNotebookCount, isSplitEnabled, selectNote, openCreateNoteModal]);

  const openEditNote = useCallback(
    (note: Note) => {
      openNoteModal(note.id);
    },
    [openNoteModal],
  );

  const handleEditorDirtyChange = useCallback((dirty: boolean) => {
    editorDirtyRef.current = dirty;
  }, []);

  const handleSelectNote = useCallback(
    (note: Note) => {
      if (!isCreatingNote && note.id === selectedNoteId) return;
      if (!autosave && editorDirtyRef.current) {
        setPendingSelectNoteId(note.id);
        return;
      }
      applySelectNote(note.id);
    },
    [isCreatingNote, selectedNoteId, autosave, applySelectNote],
  );

  const handleListOpen = useCallback(
    (note: Note) => {
      if (isSplitEnabled) {
        handleSelectNote(note);
        return;
      }
      openEditNote(note);
    },
    [isSplitEnabled, handleSelectNote, openEditNote],
  );

  const handlePendingSelect = useCallback(
    (isConfirm: boolean) => {
      if (isConfirm && pendingSelectNoteId) {
        applySelectNote(pendingSelectNoteId);
      }
      setPendingSelectNoteId(null);
    },
    [pendingSelectNoteId, applySelectNote],
  );

  return {
    selectedNote,
    editorNote,
    activeSplitNote,
    isSplitEnabled,
    showSplitPane,
    showNoteModal,
    pendingSelectNoteId,
    selectNone,
    openCreateNote,
    openEditNote,
    handleSelectNote,
    handleListOpen,
    handlePendingSelect,
    handleEditorDirtyChange,
    editorDirtyRef,
  };
};
