import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { NoteSaveInput } from "@/features/notes/types";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import { useUIStore } from "@/shared/stores/useUIStore";
import { toast } from "@/shared/stores/useToastStore";
import type { Note, Notebook } from "@/shared/types";
import type { MoveDirection } from "@/shared/lib/notes";

type ConfirmState = { notebookId: string; title: string };

interface UseNoteActionsOptions {
  closeSidebar: () => void;
  selectNone: () => void;
}

/**
 * Owns every note/notebook/tag mutation plus the toast feedback and the local
 * state for the move-note and delete-notebook confirmations.
 */
export const useNoteActions = ({
  closeSidebar,
  selectNone,
}: UseNoteActionsOptions) => {
  const { t } = useTranslation();
  const notebooks = useNoteStore((state) => state.notebooks);
  const addNote = useNoteStore((state) => state.addNote);
  const updateNote = useNoteStore((state) => state.updateNote);
  const setNoteFavorite = useNoteStore((state) => state.setNoteFavorite);
  const toggleNotePin = useNoteStore((state) => state.toggleNotePin);
  const toggleNoteFavorite = useNoteStore((state) => state.toggleNoteFavorite);
  const moveNote = useNoteStore((state) => state.moveNote);
  const moveNoteToNotebookAction = useNoteStore(
    (state) => state.moveNoteToNotebook,
  );
  const deleteNoteAction = useNoteStore((state) => state.deleteNote);
  const restoreNote = useNoteStore((state) => state.restoreNote);
  const deleteNotebookAction = useNoteStore((state) => state.deleteNotebook);
  const restoreNotebook = useNoteStore((state) => state.restoreNotebook);
  const toggleNotebookPin = useNoteStore((state) => state.toggleNotebookPin);
  const deleteTagAction = useNoteStore((state) => state.deleteTag);
  const setActiveNotebook = useNoteStore((state) => state.setActiveNotebook);

  const showNotes = useUIStore((state) => state.showNotes);
  const removeTagFilter = useUIStore((state) => state.removeTagFilter);

  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [moveNoteTarget, setMoveNoteTarget] = useState<Note | null>(null);

  const persistNote = useCallback(
    (noteId: string | null, noteData: NoteSaveInput): Note | undefined => {
      if (!noteId) {
        return addNote(noteData.notebookId, {
          title: noteData.title,
          text: noteData.text,
          tags: noteData.tags,
          favorite: noteData.favorite,
        });
      }

      const current = useNoteStore
        .getState()
        .notebooks.flatMap((notebook) => notebook.notes)
        .find((note) => note.id === noteId);
      const sourceNotebookId = current?.notebookId ?? noteData.notebookId;

      updateNote(noteId, {
        title: noteData.title,
        text: noteData.text,
        tags: noteData.tags,
      });
      if (noteData.notebookId !== sourceNotebookId) {
        moveNoteToNotebookAction(sourceNotebookId, noteId, noteData.notebookId);
      }
      if (current && current.favorite !== noteData.favorite) {
        setNoteFavorite(noteId, noteData.favorite);
      }

      return current ?? undefined;
    },
    [addNote, updateNote, moveNoteToNotebookAction, setNoteFavorite],
  );

  const handleToggleNotePin = useCallback(
    (note: Note) => toggleNotePin(note.notebookId, note.id),
    [toggleNotePin],
  );

  const handleToggleNoteFavorite = useCallback(
    (note: Note) => toggleNoteFavorite(note.notebookId, note.id),
    [toggleNoteFavorite],
  );

  const handleMoveNote = useCallback(
    (note: Note, direction: MoveDirection) =>
      moveNote(note.notebookId, note.id, direction),
    [moveNote],
  );

  const handleMoveNoteToNotebook = useCallback(
    (targetNotebookId: string) => {
      if (!moveNoteTarget) return;
      const note = moveNoteTarget;
      const sourceNotebookId = note.notebookId;
      const sourceNotebook = notebooks.find(
        (notebook) => notebook.id === sourceNotebookId,
      );
      const sourceIndex =
        sourceNotebook?.notes.findIndex((item) => item.id === note.id) ?? 0;
      const target = notebooks.find(
        (notebook) => notebook.id === targetNotebookId,
      );

      moveNoteToNotebookAction(sourceNotebookId, note.id, targetNotebookId);
      setMoveNoteTarget(null);

      const targetName = target?.name ?? t("common.untitled");
      toast.success(t("toasts.noteMovedTo", { name: targetName }), {
        duration: 6000,
        actions: [
          {
            label: t("toasts.goToNotebook"),
            onClick: () => {
              setActiveNotebook(targetNotebookId);
              showNotes();
              closeSidebar();
            },
          },
          {
            label: t("common.undo"),
            onClick: () => {
              moveNoteToNotebookAction(
                targetNotebookId,
                note.id,
                sourceNotebookId,
                sourceIndex,
              );
              toast.success(t("toasts.moveUndone"));
            },
          },
        ],
      });
    },
    [
      moveNoteTarget,
      notebooks,
      moveNoteToNotebookAction,
      t,
      setActiveNotebook,
      showNotes,
      closeSidebar,
    ],
  );

  const handleDeleteNote = useCallback(
    (note: Note) => {
      deleteNoteAction(note.notebookId, note.id);
      toast.success(t("toasts.noteTrashed"), {
        description: t("toasts.trashHint"),
        duration: 6000,
        action: {
          label: t("common.undo"),
          onClick: () => {
            restoreNote(note.id);
            toast.success(t("toasts.noteRestored"));
          },
        },
      });
    },
    [deleteNoteAction, t, restoreNote],
  );

  const handleDeleteNoteById = useCallback(
    (noteId: string) => {
      const note = useNoteStore
        .getState()
        .notebooks.flatMap((notebook) => notebook.notes)
        .find((item) => item.id === noteId);
      if (note) handleDeleteNote(note);
      selectNone();
    },
    [handleDeleteNote, selectNone],
  );

  const requestDeleteNotebook = useCallback((notebook: Notebook) => {
    setConfirm({ notebookId: notebook.id, title: notebook.name });
  }, []);

  const handleToggleNotebookPin = useCallback(
    (notebook: Notebook) => toggleNotebookPin(notebook.id),
    [toggleNotebookPin],
  );

  const handleDeleteTag = useCallback(
    (tag: string) => {
      deleteTagAction(tag);
      removeTagFilter(tag);
      toast.success(t("toasts.tagDeleted", { tag }));
    },
    [deleteTagAction, removeTagFilter, t],
  );

  const handleConfirmDeleteNotebook = useCallback(
    (isConfirm: boolean) => {
      if (confirm && isConfirm) {
        const { notebookId } = confirm;
        deleteNotebookAction(notebookId);
        toast.success(t("toasts.notebookTrashed"), {
          description: t("toasts.trashHint"),
          duration: 6000,
          action: {
            label: t("common.undo"),
            onClick: () => {
              restoreNotebook(notebookId);
              toast.success(t("toasts.notebookRestored"));
            },
          },
        });
      }
      setConfirm(null);
    },
    [confirm, deleteNotebookAction, t, restoreNotebook],
  );

  return {
    persistNote,
    toggleNotePin: handleToggleNotePin,
    toggleNoteFavorite: handleToggleNoteFavorite,
    moveNote: handleMoveNote,
    moveNoteToNotebook: handleMoveNoteToNotebook,
    deleteNote: handleDeleteNote,
    deleteNoteById: handleDeleteNoteById,
    toggleNotebookPin: handleToggleNotebookPin,
    deleteTag: handleDeleteTag,
    requestDeleteNotebook,
    confirm,
    confirmDeleteNotebook: handleConfirmDeleteNotebook,
    moveNoteTarget,
    requestMoveNote: setMoveNoteTarget,
    closeMoveNote: () => setMoveNoteTarget(null),
  };
};
