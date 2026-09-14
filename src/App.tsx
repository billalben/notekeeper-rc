import { useEffect, useState } from "react";
import { ConfirmModal } from "./components/ConfirmModal";
import { Fab } from "./components/Fab";
import { Header } from "./components/Header";
import { NoteList } from "./components/NoteList";
import { NoteModal } from "./components/NoteModal";
import { Sidebar } from "./components/Sidebar";
import { useNoteStore } from "./store/useNoteStore";
import { useThemeStore } from "./store/useThemeStore";
import type { Note, Notebook } from "./types";
import { getRelativeTime } from "./utils";

type NoteModalState = { type: "create" } | { type: "edit"; note: Note };

type ConfirmState =
  | { kind: "note"; notebookId: string; noteId: string; title: string }
  | { kind: "notebook"; notebookId: string; title: string };

const App = () => {
  const theme = useThemeStore((state) => state.theme);

  const notebooks = useNoteStore((state) => state.notebooks);
  const activeNotebookId = useNoteStore((state) => state.activeNotebookId);
  const setActiveNotebook = useNoteStore((state) => state.setActiveNotebook);
  const addNote = useNoteStore((state) => state.addNote);
  const updateNote = useNoteStore((state) => state.updateNote);
  const deleteNote = useNoteStore((state) => state.deleteNote);
  const deleteNotebook = useNoteStore((state) => state.deleteNotebook);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [noteModal, setNoteModal] = useState<NoteModalState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (notebooks.length === 0) {
      if (activeNotebookId !== null) setActiveNotebook(null);
      return;
    }
    if (
      !activeNotebookId ||
      !notebooks.some((nb) => nb.id === activeNotebookId)
    ) {
      setActiveNotebook(notebooks[0].id);
    }
  }, [notebooks, activeNotebookId, setActiveNotebook]);

  const activeNotebook =
    notebooks.find((notebook) => notebook.id === activeNotebookId) ?? null;

  const openCreateNote = () => {
    if (notebooks.length === 0) return;
    setNoteModal({ type: "create" });
  };

  const openEditNote = (note: Note) => {
    setNoteModal({ type: "edit", note });
  };

  const handleNoteSubmit = (noteData: { title: string; text: string }) => {
    if (!noteModal) return;

    if (noteModal.type === "create") {
      if (activeNotebookId) addNote(activeNotebookId, noteData);
    } else {
      updateNote(noteModal.note.id, noteData);
    }

    setNoteModal(null);
  };

  const requestDeleteNote = (note: Note) => {
    setConfirm({
      kind: "note",
      notebookId: note.notebookId,
      noteId: note.id,
      title: note.title,
    });
  };

  const requestDeleteNotebook = (notebook: Notebook) => {
    setConfirm({
      kind: "notebook",
      notebookId: notebook.id,
      title: notebook.name,
    });
  };

  const handleConfirm = (isConfirm: boolean) => {
    if (confirm && isConfirm) {
      if (confirm.kind === "note") {
        deleteNote(confirm.notebookId, confirm.noteId);
      } else {
        deleteNotebook(confirm.notebookId);
      }
    }
    setConfirm(null);
  };

  return (
    <>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewNote={openCreateNote}
        onRequestDeleteNotebook={requestDeleteNotebook}
      />

      <div
        className={`overlay${sidebarOpen ? " active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <main className="main">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        <h2 className="title text-title-medium" data-note-panel-title>
          {activeNotebook?.name ?? ""}
        </h2>

        <NoteList
          notes={activeNotebook?.notes ?? []}
          onOpen={openEditNote}
          onRequestDelete={requestDeleteNote}
        />

        <Fab
          label="New note"
          disabled={notebooks.length === 0}
          onClick={openCreateNote}
        />
      </main>

      {noteModal && (
        <NoteModal
          title={noteModal.type === "edit" ? noteModal.note.title : undefined}
          text={noteModal.type === "edit" ? noteModal.note.text : undefined}
          time={
            noteModal.type === "edit"
              ? getRelativeTime(noteModal.note.postedOn)
              : undefined
          }
          onSubmit={handleNoteSubmit}
          onClose={() => setNoteModal(null)}
        />
      )}

      {confirm && (
        <ConfirmModal title={confirm.title} onConfirm={handleConfirm} />
      )}
    </>
  );
};

export default App;
