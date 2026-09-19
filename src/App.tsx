import { useEffect, useState } from "react";
import { ConfirmModal } from "./components/ConfirmModal";
import { Fab } from "./components/Fab";
import { Header } from "./components/Header";
import { NoteList } from "./components/NoteList";
import { NoteModal } from "./components/NoteModal";
import { MoveNoteModal } from "./components/MoveNoteModal";
import { SettingsModal } from "./components/settings/SettingsModal";
import { Sidebar } from "./components/Sidebar";
import { TagFilterBar } from "./components/TagFilterBar";
import { ToastRegion } from "./components/ToastRegion";
import { TrashView } from "./components/TrashView";
import { useNoteStore } from "./store/useNoteStore";
import { useSettingsStore } from "./store/useSettingsStore";
import { useThemeStore } from "./store/useThemeStore";
import { useUIStore } from "./store/useUIStore";
import { toast } from "./store/useToastStore";
import type { Note, Notebook } from "./types";
import {
  collectFavoriteNotes,
  countTagUsageMap,
  filterNotesByTags,
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
  const allTags = useNoteStore((state) => state.tags);
  const createTag = useNoteStore((state) => state.createTag);
  const deleteTag = useNoteStore((state) => state.deleteTag);
  const activeNotebookId = useNoteStore((state) => state.activeNotebookId);
  const setActiveNotebook = useNoteStore((state) => state.setActiveNotebook);
  const addNote = useNoteStore((state) => state.addNote);
  const updateNote = useNoteStore((state) => state.updateNote);
  const toggleNotePin = useNoteStore((state) => state.toggleNotePin);
  const toggleNoteFavorite = useNoteStore(
    (state) => state.toggleNoteFavorite,
  );
  const moveNote = useNoteStore((state) => state.moveNote);
  const moveNoteToNotebook = useNoteStore(
    (state) => state.moveNoteToNotebook,
  );
  const deleteNote = useNoteStore((state) => state.deleteNote);
  const restoreNote = useNoteStore((state) => state.restoreNote);
  const deleteNotebook = useNoteStore((state) => state.deleteNotebook);
  const toggleNotebookPin = useNoteStore((state) => state.toggleNotebookPin);
  const restoreNotebook = useNoteStore((state) => state.restoreNotebook);
  const purgeExpiredTrash = useNoteStore((state) => state.purgeExpiredTrash);

  const retentionDays = useSettingsStore((state) => state.trash.retentionDays);
  const motion = useSettingsStore((state) => state.motion);
  const appearance = useSettingsStore((state) => state.appearance);

  const startAddingNotebook = useUIStore((state) => state.startAddingNotebook);
  const isSettingsOpen = useUIStore((state) => state.isSettingsOpen);
  const closeSettings = useUIStore((state) => state.closeSettings);
  const view = useUIStore((state) => state.view);
  const showNotes = useUIStore((state) => state.showNotes);
  const activeTags = useUIStore((state) => state.activeTags);
  const toggleTag = useUIStore((state) => state.toggleTag);
  const removeTagFilter = useUIStore((state) => state.removeTagFilter);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [noteModal, setNoteModal] = useState<NoteModalState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [moveNoteTarget, setMoveNoteTarget] = useState<Note | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (motion === "system") root.removeAttribute("data-motion");
    else root.setAttribute("data-motion", motion);
  }, [motion]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-accent", appearance.accent);
    root.setAttribute("data-font", appearance.fontScale);
    root.setAttribute("data-density", appearance.density);
    root.setAttribute("data-radius", appearance.radius);
    root.setAttribute(
      "data-contrast",
      appearance.highContrast ? "high" : "default",
    );
  }, [appearance]);

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

  const notebookNames = Object.fromEntries(
    visibleNotebooks.map((notebook) => [notebook.id, notebook.name]),
  );

  const isFiltering = activeTags.length > 0;
  const tagFilterLabel = activeTags.map((tag) => `#${tag}`).join(", ");
  const activeNotes = isFiltering
    ? sortByPinned(filterNotesByTags(notebooks, activeTags)).map((note) => ({
        ...note,
        canMoveUp: false,
        canMoveDown: false,
      }))
    : withMoveFlags(
        sortByPinned(
          activeNotebook?.notes.filter((note) => note.deletedAt === null) ?? [],
        ),
      );

  const favoriteNotes = collectFavoriteNotes(notebooks).map((note) => ({
    ...note,
    canMoveUp: false,
    canMoveDown: false,
  }));

  const openCreateNote = () => {
    if (visibleNotebooks.length === 0) return;
    setNoteModal({ type: "create" });
  };

  const openEditNote = (note: Note) => {
    setNoteModal({ type: "edit", note });
  };

  const handleNoteSubmit = (noteData: {
    title: string;
    text: string;
    tags: string[];
  }) => {
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

  const handleToggleNoteFavorite = (note: Note) => {
    toggleNoteFavorite(note.notebookId, note.id);
  };

  const handleMoveNote = (note: Note, direction: MoveDirection) => {
    moveNote(note.notebookId, note.id, direction);
  };

  const handleMoveNoteToNotebook = (targetNotebookId: string) => {
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

    moveNoteToNotebook(sourceNotebookId, note.id, targetNotebookId);
    setMoveNoteTarget(null);

    const targetName = target?.name ?? "notebook";
    toast.success(`Note moved to "${targetName}"`, {
      duration: 6000,
      actions: [
        {
          label: "Go to notebook",
          onClick: () => {
            setActiveNotebook(targetNotebookId);
            showNotes();
            setSidebarOpen(false);
          },
        },
        {
          label: "Undo",
          onClick: () => {
            moveNoteToNotebook(
              targetNotebookId,
              note.id,
              sourceNotebookId,
              sourceIndex,
            );
            toast.success("Move undone");
          },
        },
      ],
    });
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

  const handleDeleteTag = (tag: string) => {
    deleteTag(tag);
    removeTagFilter(tag);
    toast.success(`Tag #${tag} deleted`);
  };

  const tagUsage = countTagUsageMap(notebooks);

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
        ) : view === "favorites" ? (
          <>
            <h2 className="title text-title-medium" data-note-panel-title>
              Favorites
            </h2>

            <NoteList
              notes={favoriteNotes}
              canMoveToNotebook={visibleNotebooks.length > 1}
              notebookNames={notebookNames}
              emptyMessage="No favorites yet"
              emptyIcon="star"
              onOpen={openEditNote}
              onTogglePin={handleToggleNotePin}
              onToggleFavorite={handleToggleNoteFavorite}
              onMove={handleMoveNote}
              onRequestMove={setMoveNoteTarget}
              onRequestDelete={handleDeleteNote}
            />
          </>
        ) : (
          <>
            <h2 className="title text-title-medium" data-note-panel-title>
              {isFiltering
                ? `Notes tagged ${tagFilterLabel}`
                : (activeNotebook?.name ?? "")}
            </h2>

            <TagFilterBar
              tags={allTags}
              activeTags={activeTags}
              onToggle={toggleTag}
            />

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
                canMoveToNotebook={visibleNotebooks.length > 1}
                notebookNames={isFiltering ? notebookNames : undefined}
                emptyMessage={
                  isFiltering
                    ? `No notes tagged ${tagFilterLabel}`
                    : "No notes"
                }
                onOpen={openEditNote}
                onTogglePin={handleToggleNotePin}
                onToggleFavorite={handleToggleNoteFavorite}
                onMove={handleMoveNote}
                onRequestMove={setMoveNoteTarget}
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
          tags={noteModal.type === "edit" ? noteModal.note.tags : undefined}
          tagSuggestions={allTags}
          tagUsage={tagUsage}
          onCreateTag={createTag}
          onDeleteTag={handleDeleteTag}
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

      {moveNoteTarget && (
        <MoveNoteModal
          note={moveNoteTarget}
          notebooks={visibleNotebooks}
          onMove={handleMoveNoteToNotebook}
          onClose={() => setMoveNoteTarget(null)}
        />
      )}

      {isSettingsOpen && <SettingsModal onClose={closeSettings} />}

      <ToastRegion />
    </>
  );
};

export default App;
