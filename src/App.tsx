import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmModal } from "./components/ConfirmModal";
import { Fab } from "./components/Fab";
import { Header } from "./components/Header";
import { NoteList } from "./components/NoteList";
import { NoteModal, type NoteSaveInput } from "./components/NoteModal";
import { MoveNoteModal } from "./components/MoveNoteModal";
import { SearchPalette } from "./components/SearchPalette";
import { ShortcutHelpOverlay } from "./components/ShortcutHelpOverlay";
import { SettingsModal } from "./components/settings/SettingsModal";
import { Sidebar } from "./components/Sidebar";
import { StatisticsView } from "./components/StatisticsView";
import { TagFilterBar } from "./components/TagFilterBar";
import { ToastRegion } from "./components/ToastRegion";
import { TrashView } from "./components/TrashView";
import { useActionHotkey } from "./hooks/useActionHotkey";
import i18n, { directionFor } from "./i18n";
import { useNoteStore } from "./store/useNoteStore";
import { useSettingsStore } from "./store/useSettingsStore";
import { useThemeStore } from "./store/useThemeStore";
import { useUIStore } from "./store/useUIStore";
import { toast } from "./store/useToastStore";
import type { Note, Notebook } from "./types";
import {
  collectAllNotes,
  collectFavoriteNotes,
  collectPinnedNotes,
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
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

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
  const setNoteFavorite = useNoteStore((state) => state.setNoteFavorite);
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
  const language = useSettingsStore((state) => state.language);
  const appearance = useSettingsStore((state) => state.appearance);

  const startAddingNotebook = useUIStore((state) => state.startAddingNotebook);
  const isSettingsOpen = useUIStore((state) => state.isSettingsOpen);
  const closeSettings = useUIStore((state) => state.closeSettings);
  const isSearchOpen = useUIStore((state) => state.isSearchOpen);
  const openSearch = useUIStore((state) => state.openSearch);
  const closeSearch = useUIStore((state) => state.closeSearch);
  const view = useUIStore((state) => state.view);
  const showNotes = useUIStore((state) => state.showNotes);
  const activeTags = useUIStore((state) => state.activeTags);
  const toggleTag = useUIStore((state) => state.toggleTag);
  const removeTagFilter = useUIStore((state) => state.removeTagFilter);
  const clearTagFilter = useUIStore((state) => state.clearTagFilter);
  const isShortcutHelpOpen = useUIStore((state) => state.isShortcutHelpOpen);
  const openShortcutHelp = useUIStore((state) => state.openShortcutHelp);
  const closeShortcutHelp = useUIStore((state) => state.closeShortcutHelp);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [noteModal, setNoteModal] = useState<NoteModalState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [moveNoteTarget, setMoveNoteTarget] = useState<Note | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (i18n.language !== language) i18n.changeLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir = directionFor(language);
    document.title = i18n.t("common.appTitle");
  }, [language]);

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

  const pinnedNotes = collectPinnedNotes(notebooks).map((note) => ({
    ...note,
    canMoveUp: false,
    canMoveDown: false,
  }));

  const allNotes = collectAllNotes(notebooks).map((note) => ({
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

  const openSearchNote = (note: Note) => {
    setActiveNotebook(note.notebookId);
    showNotes();
    clearTagFilter();
    setNoteModal({ type: "edit", note });
    closeSearch();
  };

  const openStatsNote = (note: Note) => {
    setActiveNotebook(note.notebookId);
    showNotes();
    clearTagFilter();
    setNoteModal({ type: "edit", note });
  };

  const handleNoteSave = (noteData: NoteSaveInput): Note | undefined => {
    if (!noteModal) return;

    if (noteModal.type === "create") {
      const note = addNote(noteData.notebookId, {
        title: noteData.title,
        text: noteData.text,
        tags: noteData.tags,
        favorite: noteData.favorite,
      });
      if (note) setNoteModal({ type: "edit", note });
      return note;
    }

    const noteId = noteModal.note.id;
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
      moveNoteToNotebook(sourceNotebookId, noteId, noteData.notebookId);
    }
    if (current && current.favorite !== noteData.favorite) {
      setNoteFavorite(noteId, noteData.favorite);
    }

    return current ?? noteModal.note;
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

    const targetName = target?.name ?? t("common.untitled");
    toast.success(t("toasts.noteMovedTo", { name: targetName }), {
      duration: 6000,
      actions: [
        {
          label: t("toasts.goToNotebook"),
          onClick: () => {
            setActiveNotebook(targetNotebookId);
            showNotes();
            setSidebarOpen(false);
          },
        },
        {
          label: t("common.undo"),
          onClick: () => {
            moveNoteToNotebook(
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
  };

  const handleDeleteNote = (note: Note) => {
    deleteNote(note.notebookId, note.id);
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

  const handleDeleteTag = (tag: string) => {
    deleteTag(tag);
    removeTagFilter(tag);
    toast.success(t("toasts.tagDeleted", { tag }));
  };

  const handleDeleteNoteById = (noteId: string) => {
    const note = useNoteStore
      .getState()
      .notebooks.flatMap((notebook) => notebook.notes)
      .find((item) => item.id === noteId);
    if (note) handleDeleteNote(note);
    setNoteModal(null);
  };

  const anyModalOpen =
    isSettingsOpen ||
    isSearchOpen ||
    Boolean(noteModal) ||
    Boolean(confirm) ||
    Boolean(moveNoteTarget) ||
    isShortcutHelpOpen;

  useActionHotkey("newNote", openCreateNote, { enabled: !anyModalOpen });
  useActionHotkey(
    "openSearch",
    () => {
      if (isSearchOpen) closeSearch();
      else openSearch();
    },
    {
      enabled:
        !isSearchOpen &&
        !isSettingsOpen &&
        !noteModal &&
        !confirm &&
        !moveNoteTarget &&
        !isShortcutHelpOpen,
    },
  );
  useActionHotkey("toggleTheme", toggleTheme, { enabled: !anyModalOpen });
  useActionHotkey("shortcutHelp", openShortcutHelp, { enabled: !anyModalOpen });

  const tagUsage = countTagUsageMap(notebooks);

  const handleConfirm = (isConfirm: boolean) => {
    if (confirm && isConfirm) {
      const { notebookId } = confirm;
      deleteNotebook(notebookId);
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

        {view === "stats" ? (
          <StatisticsView onOpenNote={openStatsNote} onNewNote={openCreateNote} />
        ) : view === "trash" ? (
          <TrashView />
        ) : view === "all" ? (
          <>
            <h2 className="title text-title-medium" data-note-panel-title>
              {t("notes.allNotes")}
            </h2>

            <NoteList
              notes={allNotes}
              canMoveToNotebook={visibleNotebooks.length > 1}
              notebookNames={notebookNames}
              emptyMessage={t("notes.noNotesYet")}
              emptyIcon="note_stack"
              onOpen={openEditNote}
              onTogglePin={handleToggleNotePin}
              onToggleFavorite={handleToggleNoteFavorite}
              onMove={handleMoveNote}
              onRequestMove={setMoveNoteTarget}
              onRequestDelete={handleDeleteNote}
            />
          </>
        ) : view === "pinned" ? (
          <>
            <h2 className="title text-title-medium" data-note-panel-title>
              {t("notes.pinned")}
            </h2>

            <NoteList
              notes={pinnedNotes}
              canMoveToNotebook={visibleNotebooks.length > 1}
              notebookNames={notebookNames}
              emptyMessage={t("notes.noPinned")}
              emptyIcon="push_pin"
              onOpen={openEditNote}
              onTogglePin={handleToggleNotePin}
              onToggleFavorite={handleToggleNoteFavorite}
              onMove={handleMoveNote}
              onRequestMove={setMoveNoteTarget}
              onRequestDelete={handleDeleteNote}
            />
          </>
        ) : view === "favorites" ? (
          <>
            <h2 className="title text-title-medium" data-note-panel-title>
              {t("notes.favorites")}
            </h2>

            <NoteList
              notes={favoriteNotes}
              canMoveToNotebook={visibleNotebooks.length > 1}
              notebookNames={notebookNames}
              emptyMessage={t("notes.noFavorites")}
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
                ? t("notes.notesTagged", { tags: tagFilterLabel })
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
                  <div className="text-headline-small">
                    {t("notes.noNotebooks")}
                  </div>
                  <button
                    className="btn fill"
                    type="button"
                    onClick={() => {
                      startAddingNotebook();
                      setSidebarOpen(true);
                    }}
                  >
                    <span className="text-label-large">
                      {t("notes.createNotebook")}
                    </span>
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
                    ? t("notes.noNotesTagged", { tags: tagFilterLabel })
                    : t("notes.noNotes")
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
              label={t("notes.newNote")}
              disabled={visibleNotebooks.length === 0}
              onClick={openCreateNote}
            />
          </>
        )}
      </main>

      {noteModal && (
        <NoteModal
          noteId={noteModal.type === "edit" ? noteModal.note.id : undefined}
          title={noteModal.type === "edit" ? noteModal.note.title : undefined}
          text={noteModal.type === "edit" ? noteModal.note.text : undefined}
          tags={noteModal.type === "edit" ? noteModal.note.tags : undefined}
          favorite={
            noteModal.type === "edit" ? noteModal.note.favorite : undefined
          }
          notebookId={
            noteModal.type === "edit"
              ? noteModal.note.notebookId
              : (activeNotebookId ?? "")
          }
          notebooks={visibleNotebooks}
          tagSuggestions={allTags}
          tagUsage={tagUsage}
          isNew={noteModal.type === "create"}
          postedOn={
            noteModal.type === "edit" ? noteModal.note.postedOn : undefined
          }
          updatedOn={
            noteModal.type === "edit" ? noteModal.note.updatedOn : undefined
          }
          onSave={handleNoteSave}
          onCreateTag={createTag}
          onDeleteTag={handleDeleteTag}
          onDelete={handleDeleteNoteById}
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

      {isSearchOpen && (
        <SearchPalette onOpenNote={openSearchNote} onClose={closeSearch} />
      )}

      {isShortcutHelpOpen && (
        <ShortcutHelpOverlay onClose={closeShortcutHelp} />
      )}

      <ToastRegion />
    </>
  );
};

export default App;
