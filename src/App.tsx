import { useEffect, useState } from "react";
import { ConfirmModal } from "./components/ConfirmModal";
import { Fab } from "./components/Fab";
import { Header } from "./components/Header";
import { NoteList } from "./components/NoteList";
import { NoteModal } from "./components/NoteModal";
import { SettingsModal } from "./components/settings/SettingsModal";
import { Sidebar } from "./components/Sidebar";
import { ToastRegion } from "./components/ToastRegion";
import { TrashView } from "./components/TrashView";
import { useNoteStore } from "./store/useNoteStore";
import { useSettingsStore } from "./store/useSettingsStore";
import { useThemeStore } from "./store/useThemeStore";
import { useUIStore } from "./store/useUIStore";
import { toast } from "./store/useToastStore";
import type { Note, Notebook } from "./types";
import {
  sortByPinned,
  trashRetentionMs,
  withMoveFlags,
  type MoveDirection,
} from "./utils";

type NoteModalState = { type: "create" } | { type: "edit"; note: Note };

type ConfirmState = { notebookId: string; title: string };

const App = () => {
  const theme = useThemeStore((state) => state.theme);

  const notebooks = useNoteStore((state) => state.notebooks);
  const activeNotebookId = useNoteStore((state) => state.activeNotebookId);
  const setActiveNotebook = useNoteStore((state) => state.setActiveNotebook);
  const addNote = useNoteStore((state) => state.addNote);
  const updateNote = useNoteStore((state) => state.updateNote);
  const toggleNotePin = useNoteStore((state) => state.toggleNotePin);
  const moveNote = useNoteStore((state) => state.moveNote);
  const deleteNote = useNoteStore((state) => state.deleteNote);
  const restoreNote = useNoteStore((state) => state.restoreNote);
  const deleteNotebook = useNoteStore((state) => state.deleteNotebook);
  const toggleNotebookPin = useNoteStore((state) => state.toggleNotebookPin);
  const restoreNotebook = useNoteStore((state) => state.restoreNotebook);
  const purgeExpiredTrash = useNoteStore((state) => state.purgeExpiredTrash);

  const retentionDays = useSettingsStore((state) => state.trash.retentionDays);

  const startAddingNotebook = useUIStore((state) => state.startAddingNotebook);
  const isSettingsOpen = useUIStore((state) => state.isSettingsOpen);
  const closeSettings = useUIStore((state) => state.closeSettings);
  const view = useUIStore((state) => state.view);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [noteModal, setNoteModal] = useState<NoteModalState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    purgeExpiredTrash(trashRetentionMs(retentionDays));
  }, [retentionDays, purgeExpiredTrash]);

  useEffect(() => {
    const visible = notebooks.filter((notebook) => notebook.deletedAt === null);
    if (visible.length === 0) {
      if (activeNotebookId !== null) setActiveNotebook(null);
      return;
    }
    if (
      !activeNotebookId ||
      !visible.some((notebook) => notebook.id === activeNotebookId)
    ) {
      setActiveNotebook(visible[0].id);
    }
  }, [notebooks, activeNotebookId, setActiveNotebook]);

  const visibleNotebooks = notebooks.filter(
    (notebook) => notebook.deletedAt === null,
  );
  const activeNotebook =
    visibleNotebooks.find((notebook) => notebook.id === activeNotebookId) ??
    null;
  const activeNotes = withMoveFlags(
    sortByPinned(
      activeNotebook?.notes.filter((note) => note.deletedAt === null) ?? [],
    ),
  );

  const openCreateNote = () => {
    if (visibleNotebooks.length === 0) return;
    setNoteModal({ type: "create" });
  };

  const openEditNote = (note: Note) => {
    setNoteModal({ type: "edit", note });
  };

  const handleNoteSubmit = (noteData: { title: string; text: string }) => {
    if (!noteModal) return;

    if (noteModal.type === "create") {
      if (activeNotebookId) {
        addNote(activeNotebookId, noteData);
        toast.success("Note created");
      }
    } else {
      updateNote(noteModal.note.id, noteData);
      toast.success("Note saved");
    }

    setNoteModal(null);
  };

  const handleToggleNotePin = (note: Note) => {
    toggleNotePin(note.notebookId, note.id);
  };

  const handleMoveNote = (note: Note, direction: MoveDirection) => {
    moveNote(note.notebookId, note.id, direction);
  };

  const handleDeleteNote = (note: Note) => {
    deleteNote(note.notebookId, note.id);
    toast.success("Note moved to Trash", {
      description: "You can restore it from the Trash view.",
      duration: 6000,
      action: {
        label: "Undo",
        onClick: () => {
          restoreNote(note.id);
          toast.success("Note restored");
        },
      },
    });
  };

  const requestDeleteNotebook = (notebook: Notebook) => {
    setConfirm({
      notebookId: notebook.id,
      title: notebook.name,
    });
  };

  const handleToggleNotebookPin = (notebook: Notebook) => {
    toggleNotebookPin(notebook.id);
  };

  const handleConfirm = (isConfirm: boolean) => {
    if (confirm && isConfirm) {
      const { notebookId } = confirm;
      deleteNotebook(notebookId);
      toast.success("Notebook moved to Trash", {
        description: "You can restore it from the Trash view.",
        duration: 6000,
        action: {
          label: "Undo",
          onClick: () => {
            restoreNotebook(notebookId);
            toast.success("Notebook restored");
          },
        },
      });
    }
    setConfirm(null);
  };

  return (
    <>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewNote={openCreateNote}
        onTogglePin={handleToggleNotebookPin}
        onRequestDeleteNotebook={requestDeleteNotebook}
      />

      <div
        className={`overlay${sidebarOpen ? " active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <main className="main">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        {view === "trash" ? (
          <TrashView />
        ) : (
          <>
            <h2 className="title text-title-medium" data-note-panel-title>
              {activeNotebook?.name ?? ""}
            </h2>

            {visibleNotebooks.length === 0 ? (
              <div className="note-list" data-note-panel>
                <div className="empty-notes">
                  <span className="material-symbols-rounded" aria-hidden="true">
                    note_stack
                  </span>
                  <div className="text-headline-small">No notebooks yet</div>
                  <button
                    className="btn fill"
                    type="button"
                    onClick={() => {
                      startAddingNotebook();
                      setSidebarOpen(true);
                    }}
                  >
                    <span className="text-label-large">Create notebook</span>
                    <div className="state-layer" />
                  </button>
                </div>
              </div>
            ) : (
              <NoteList
                notes={activeNotes}
                onOpen={openEditNote}
                onTogglePin={handleToggleNotePin}
                onMove={handleMoveNote}
                onRequestDelete={handleDeleteNote}
              />
            )}

            <Fab
              label="New note"
              disabled={visibleNotebooks.length === 0}
              onClick={openCreateNote}
            />
          </>
        )}
      </main>

      {noteModal && (
        <NoteModal
          title={noteModal.type === "edit" ? noteModal.note.title : undefined}
          text={noteModal.type === "edit" ? noteModal.note.text : undefined}
          postedOn={
            noteModal.type === "edit" ? noteModal.note.postedOn : undefined
          }
          updatedOn={
            noteModal.type === "edit" ? noteModal.note.updatedOn : undefined
          }
          onSubmit={handleNoteSubmit}
          onClose={() => setNoteModal(null)}
        />
      )}

      {confirm && (
        <ConfirmModal title={confirm.title} onConfirm={handleConfirm} />
      )}

      {isSettingsOpen && <SettingsModal onClose={closeSettings} />}

      <ToastRegion />
    </>
  );
};

export default App;
