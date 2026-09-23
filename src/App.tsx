import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmModal } from "./components/ConfirmModal";
import { Fab } from "./components/Fab";
import { Header } from "./components/Header";
import { NoteList } from "./components/NoteList";
import { NoteEditor } from "./components/NoteEditor";
import { NoteModal, type NoteSaveInput } from "./components/NoteModal";
import { MoveNoteModal } from "./components/MoveNoteModal";
import { Sidebar } from "./components/Sidebar";
import { TagFilterBar } from "./components/TagFilterBar";
import { ToastRegion } from "./components/ToastRegion";
import { TrashView } from "./components/TrashView";
import { useActionHotkey } from "./hooks/useActionHotkey";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useSplitResize } from "./hooks/useSplitResize";
import i18n, { directionFor, loadLanguage } from "./i18n";
import { useHashRoute } from "./router/useHashRoute";
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
  collectRecentNotes,
  countTagUsageMap,
  DESKTOP_QUERY,
  filterNotesByTags,
  sortByPinned,
  trashRetentionMs,
  withMoveFlags,
  type MoveDirection,
} from "./utils";

// These are only mounted on demand (open settings, search, stats, shortcuts),
// so keep them out of the initial bundle.
const SettingsModal = lazy(() =>
  import("./components/settings/SettingsModal").then((module) => ({
    default: module.SettingsModal,
  })),
);
const SearchPalette = lazy(() =>
  import("./components/SearchPalette").then((module) => ({
    default: module.SearchPalette,
  })),
);
const StatisticsView = lazy(() =>
  import("./components/StatisticsView").then((module) => ({
    default: module.StatisticsView,
  })),
);
const ShortcutHelpOverlay = lazy(() =>
  import("./components/ShortcutHelpOverlay").then((module) => ({
    default: module.ShortcutHelpOverlay,
  })),
);

type ConfirmState = { notebookId: string; title: string };

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
  const toggleNoteFavorite = useNoteStore((state) => state.toggleNoteFavorite);
  const setNoteFavorite = useNoteStore((state) => state.setNoteFavorite);
  const moveNote = useNoteStore((state) => state.moveNote);
  const moveNoteToNotebook = useNoteStore((state) => state.moveNoteToNotebook);
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
  const presentation = useSettingsStore((state) => state.editor.presentation);
  const autosave = useSettingsStore((state) => state.editor.autosave);

  const startAddingNotebook = useUIStore((state) => state.startAddingNotebook);
  const isSettingsOpen = useUIStore((state) => state.isSettingsOpen);
  const closeSettings = useUIStore((state) => state.closeSettings);
  const isSearchOpen = useUIStore((state) => state.isSearchOpen);
  const openSearch = useUIStore((state) => state.openSearch);
  const closeSearch = useUIStore((state) => state.closeSearch);
  const view = useUIStore((state) => state.view);
  const showNotes = useUIStore((state) => state.showNotes);
  const selectedNoteId = useUIStore((state) => state.selectedNoteId);
  const selectNote = useUIStore((state) => state.selectNote);
  const editorNoteId = useUIStore((state) => state.editorNoteId);
  const isCreatingNote = useUIStore((state) => state.isCreatingNote);
  const openNoteModal = useUIStore((state) => state.openNoteModal);
  const openCreateNoteModal = useUIStore((state) => state.openCreateNoteModal);
  const closeNoteModal = useUIStore((state) => state.closeNoteModal);
  const activeTags = useUIStore((state) => state.activeTags);
  const toggleTag = useUIStore((state) => state.toggleTag);
  const removeTagFilter = useUIStore((state) => state.removeTagFilter);
  const clearTagFilter = useUIStore((state) => state.clearTagFilter);
  const isShortcutHelpOpen = useUIStore((state) => state.isShortcutHelpOpen);
  const openShortcutHelp = useUIStore((state) => state.openShortcutHelp);
  const closeShortcutHelp = useUIStore((state) => state.closeShortcutHelp);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [moveNoteTarget, setMoveNoteTarget] = useState<Note | null>(null);
  const [pendingSelectNoteId, setPendingSelectNoteId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    const applyLanguage = async () => {
      await loadLanguage(language);
      if (cancelled) return;
      if (i18n.language !== language) await i18n.changeLanguage(language);
      if (cancelled) return;
      document.documentElement.lang = language;
      document.documentElement.dir = directionFor(language);
      document.title = i18n.t("common.appTitle");
    };

    void applyLanguage();
    return () => {
      cancelled = true;
    };
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

  const recentNotes = collectRecentNotes(notebooks).map((note) => ({
    ...note,
    canMoveUp: false,
    canMoveDown: false,
  }));

  const isWide = useMediaQuery(DESKTOP_QUERY);
  const isNoteView = view !== "stats" && view !== "trash";

  useHashRoute(isWide);

  const selectedNote = useMemo(
    () => findNoteById(notebooks, selectedNoteId),
    [notebooks, selectedNoteId],
  );
  const editorNote = useMemo(
    () => findNoteById(notebooks, editorNoteId),
    [notebooks, editorNoteId],
  );

  const activeSplitNote =
    selectedNote && selectedNote.deletedAt === null ? selectedNote : null;

  const isSplitEnabled = presentation === "split" && isWide && isNoteView;
  const showSplitPane =
    isSplitEnabled && (isCreatingNote || activeSplitNote !== null);
  const showNoteModal =
    !isSplitEnabled &&
    (isCreatingNote || (editorNote !== null && editorNote.deletedAt === null));

  useEffect(() => {
    if (editorNoteId && (!editorNote || editorNote.deletedAt !== null)) {
      closeNoteModal();
    }
  }, [editorNoteId, editorNote, closeNoteModal]);

  const editorDirtyRef = useRef(false);
  const {
    isResizing,
    startResize,
    onKeyDown: onSplitResizeKeyDown,
  } = useSplitResize();

  useEffect(() => {
    document.body.classList.toggle("split-open", showSplitPane);
    return () => document.body.classList.remove("split-open");
  }, [showSplitPane]);

  const openCreateNote = () => {
    if (visibleNotebooks.length === 0) return;
    if (isSplitEnabled) selectNote(null);
    openCreateNoteModal();
  };

  const openEditNote = (note: Note) => {
    openNoteModal(note.id);
  };

  const handleEditorDirtyChange = (dirty: boolean) => {
    editorDirtyRef.current = dirty;
  };

  const applySelectNote = (noteId: string | null) => {
    closeNoteModal();
    selectNote(noteId);
  };

  const handleSelectNote = (note: Note) => {
    if (!isCreatingNote && note.id === selectedNoteId) return;
    if (!autosave && editorDirtyRef.current) {
      setPendingSelectNoteId(note.id);
      return;
    }
    applySelectNote(note.id);
  };

  const handleDeselectNote = () => {
    applySelectNote(null);
  };

  const handleListOpen = (note: Note) => {
    if (isSplitEnabled) {
      handleSelectNote(note);
      return;
    }
    openEditNote(note);
  };

  const handlePendingSelect = (isConfirm: boolean) => {
    if (isConfirm && pendingSelectNoteId) {
      applySelectNote(pendingSelectNoteId);
    }
    setPendingSelectNoteId(null);
  };

  const openSearchNote = (note: Note) => {
    if (isSplitEnabled) {
      handleSelectNote(note);
      closeSearch();
      return;
    }
    setActiveNotebook(note.notebookId);
    showNotes();
    clearTagFilter();
    openEditNote(note);
    closeSearch();
  };

  const openStatsNote = (note: Note) => {
    setActiveNotebook(note.notebookId);
    showNotes();
    clearTagFilter();
    openEditNote(note);
  };

  const openRecentNote = (note: Note) => {
    setActiveNotebook(note.notebookId);
    showNotes();
    clearTagFilter();
    openEditNote(note);
  };

  const persistNote = (
    noteId: string | null,
    noteData: NoteSaveInput,
  ): Note | undefined => {
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
      moveNoteToNotebook(sourceNotebookId, noteId, noteData.notebookId);
    }
    if (current && current.favorite !== noteData.favorite) {
      setNoteFavorite(noteId, noteData.favorite);
    }

    return current ?? undefined;
  };

  const handleNoteSave = (noteData: NoteSaveInput): Note | undefined => {
    const targetId = isCreatingNote ? null : editorNoteId;
    const result = persistNote(targetId, noteData);
    if (isCreatingNote && result) {
      openNoteModal(result.id);
    }
    return result;
  };

  const handleSplitSave = (noteData: NoteSaveInput): Note | undefined => {
    const targetId = isCreatingNote ? null : selectedNoteId;
    const result = persistNote(targetId, noteData);
    if (isCreatingNote && result) {
      closeNoteModal();
      selectNote(result.id);
    }
    return result;
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
    applySelectNote(null);
  };

  const hasModalNote =
    !isSplitEnabled && (isCreatingNote || editorNote !== null);
  const anyModalOpen =
    isSettingsOpen ||
    isSearchOpen ||
    hasModalNote ||
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
        !hasModalNote &&
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

      <div className="app-content">
        <main className="main">
          <Header onOpenSidebar={() => setSidebarOpen(true)} />

          {view === "stats" ? (
            <Suspense fallback={null}>
              <StatisticsView
                onOpenNote={openStatsNote}
                onNewNote={openCreateNote}
              />
            </Suspense>
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
                selectedNoteId={isSplitEnabled ? selectedNoteId : undefined}
                onOpen={handleListOpen}
                onTogglePin={handleToggleNotePin}
                onToggleFavorite={handleToggleNoteFavorite}
                onMove={handleMoveNote}
                onRequestMove={setMoveNoteTarget}
                onRequestDelete={handleDeleteNote}
              />
            </>
          ) : view === "recent" ? (
            <>
              <h2 className="title text-title-medium" data-note-panel-title>
                {t("notes.recent")}
              </h2>

              <NoteList
                notes={recentNotes}
                canMoveToNotebook={visibleNotebooks.length > 1}
                notebookNames={notebookNames}
                emptyMessage={t("notes.noRecent")}
                emptyIcon="history"
                selectedNoteId={isSplitEnabled ? selectedNoteId : undefined}
                onOpen={isSplitEnabled ? handleSelectNote : openRecentNote}
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
                selectedNoteId={isSplitEnabled ? selectedNoteId : undefined}
                onOpen={handleListOpen}
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
                selectedNoteId={isSplitEnabled ? selectedNoteId : undefined}
                onOpen={handleListOpen}
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
                    <span
                      className="material-symbols-rounded"
                      aria-hidden="true"
                    >
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
                  selectedNoteId={isSplitEnabled ? selectedNoteId : undefined}
                  onOpen={handleListOpen}
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

        {showSplitPane && (
          <aside className="split-editor" data-split-editor>
            <div
              className={`split-resizer${isResizing ? " resizing" : ""}`}
              role="separator"
              aria-orientation="vertical"
              aria-label={t("editor.resizePane")}
              tabIndex={0}
              onPointerDown={startResize}
              onKeyDown={onSplitResizeKeyDown}
            />
            <NoteEditor
              key={isCreatingNote ? "new" : activeSplitNote?.id}
              variant="split"
              noteId={isCreatingNote ? undefined : activeSplitNote?.id}
              title={isCreatingNote ? undefined : activeSplitNote?.title}
              text={isCreatingNote ? undefined : activeSplitNote?.text}
              tags={isCreatingNote ? undefined : activeSplitNote?.tags}
              favorite={isCreatingNote ? undefined : activeSplitNote?.favorite}
              notebookId={
                isCreatingNote
                  ? (activeNotebookId ?? "")
                  : (activeSplitNote?.notebookId ?? activeNotebookId ?? "")
              }
              notebooks={visibleNotebooks}
              tagSuggestions={allTags}
              tagUsage={tagUsage}
              isNew={isCreatingNote}
              postedOn={isCreatingNote ? undefined : activeSplitNote?.postedOn}
              updatedOn={
                isCreatingNote ? undefined : activeSplitNote?.updatedOn
              }
              onSave={handleSplitSave}
              onCreateTag={createTag}
              onDeleteTag={handleDeleteTag}
              onDelete={handleDeleteNoteById}
              onDirtyChange={handleEditorDirtyChange}
              onClose={handleDeselectNote}
            />
          </aside>
        )}
      </div>

      {showNoteModal && (
        <NoteModal
          noteId={editorNote?.id}
          title={editorNote?.title}
          text={editorNote?.text}
          tags={editorNote?.tags}
          favorite={editorNote?.favorite}
          notebookId={editorNote?.notebookId ?? activeNotebookId ?? ""}
          notebooks={visibleNotebooks}
          tagSuggestions={allTags}
          tagUsage={tagUsage}
          isNew={isCreatingNote}
          postedOn={editorNote?.postedOn}
          updatedOn={editorNote?.updatedOn}
          onSave={handleNoteSave}
          onCreateTag={createTag}
          onDeleteTag={handleDeleteTag}
          onDelete={handleDeleteNoteById}
          onClose={closeNoteModal}
        />
      )}

      {confirm && (
        <ConfirmModal title={confirm.title} onConfirm={handleConfirm} />
      )}

      {pendingSelectNoteId && (
        <ConfirmModal
          heading={t("editor.unsavedTitle")}
          description={t("editor.unsavedSwitchDescription")}
          confirmLabel={t("editor.discard")}
          stacked
          onConfirm={handlePendingSelect}
        />
      )}

      {moveNoteTarget && (
        <MoveNoteModal
          note={moveNoteTarget}
          notebooks={visibleNotebooks}
          onMove={handleMoveNoteToNotebook}
          onClose={() => setMoveNoteTarget(null)}
        />
      )}

      {isSettingsOpen && (
        <Suspense fallback={null}>
          <SettingsModal onClose={closeSettings} />
        </Suspense>
      )}

      {isSearchOpen && (
        <Suspense fallback={null}>
          <SearchPalette onOpenNote={openSearchNote} onClose={closeSearch} />
        </Suspense>
      )}

      {isShortcutHelpOpen && (
        <Suspense fallback={null}>
          <ShortcutHelpOverlay onClose={closeShortcutHelp} />
        </Suspense>
      )}

      <ToastRegion />
    </>
  );
};

export default App;
