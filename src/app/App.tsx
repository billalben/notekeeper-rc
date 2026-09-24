import { useEffect, useState } from "react";
import { Header } from "@/app/Header";
import { useDocumentAppearance } from "@/app/hooks/useDocumentAppearance";
import { useEditorSession } from "@/app/hooks/useEditorSession";
import { useLanguage } from "@/app/hooks/useLanguage";
import { useNoteActions } from "@/app/hooks/useNoteActions";
import { MainPanel } from "@/app/MainPanel";
import { SplitEditorPane } from "@/app/SplitEditorPane";
import { WorkspaceModals } from "@/app/WorkspaceModals";
import type { NoteListHandlers, NoteSaveInput } from "@/features/notes/types";
import { useNoteCollections } from "@/features/notes/hooks/useNoteCollections";
import { useSplitResize } from "@/features/notes/hooks/useSplitResize";
import { Sidebar } from "@/features/notebooks/components/Sidebar";
import { useActionHotkey } from "@/features/shortcuts/hooks/useActionHotkey";
import { useHashRoute } from "@/app/router/useHashRoute";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { DESKTOP_QUERY, trashRetentionMs } from "@/shared/lib/constants";
import { countTagUsageMap } from "@/shared/lib/notes";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import { useThemeStore } from "@/shared/stores/useThemeStore";
import { useUIStore } from "@/shared/stores/useUIStore";
import { ToastRegion } from "@/shared/ui/ToastRegion";
import type { Note } from "@/shared/types";

const App = () => {
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const notebooks = useNoteStore((state) => state.notebooks);
  const allTags = useNoteStore((state) => state.tags);
  const createTag = useNoteStore((state) => state.createTag);
  const activeNotebookId = useNoteStore((state) => state.activeNotebookId);
  const setActiveNotebook = useNoteStore((state) => state.setActiveNotebook);
  const purgeExpiredTrash = useNoteStore((state) => state.purgeExpiredTrash);

  const retentionDays = useSettingsStore((state) => state.trash.retentionDays);

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
  const closeNoteModal = useUIStore((state) => state.closeNoteModal);
  const activeTags = useUIStore((state) => state.activeTags);
  const toggleTag = useUIStore((state) => state.toggleTag);
  const clearTagFilter = useUIStore((state) => state.clearTagFilter);
  const isShortcutHelpOpen = useUIStore((state) => state.isShortcutHelpOpen);
  const openShortcutHelp = useUIStore((state) => state.openShortcutHelp);
  const closeShortcutHelp = useUIStore((state) => state.closeShortcutHelp);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useDocumentAppearance();
  useLanguage();

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
  const { activeNotes, favoriteNotes, pinnedNotes, allNotes, recentNotes } =
    useNoteCollections({ notebooks, activeNotebook, activeTags });

  const isWide = useMediaQuery(DESKTOP_QUERY);
  useHashRoute(isWide);

  const session = useEditorSession({
    notebooks,
    visibleNotebookCount: visibleNotebooks.length,
    isWide,
    view,
  });
  const {
    editorNote,
    activeSplitNote,
    isSplitEnabled,
    showSplitPane,
    showNoteModal,
    openCreateNote,
    openEditNote,
    handleListOpen,
    handleEditorDirtyChange,
  } = session;

  const actions = useNoteActions({
    closeSidebar: () => setSidebarOpen(false),
    selectNone: session.selectNone,
  });

  const {
    isResizing,
    startResize,
    onKeyDown: onSplitResizeKeyDown,
  } = useSplitResize();

  useEffect(() => {
    document.body.classList.toggle("split-open", showSplitPane);
    return () => document.body.classList.remove("split-open");
  }, [showSplitPane]);

  const openNoteInNotebook = (note: Note) => {
    setActiveNotebook(note.notebookId);
    showNotes();
    clearTagFilter();
    openEditNote(note);
  };

  const openSearchNote = (note: Note) => {
    if (isSplitEnabled) {
      session.handleSelectNote(note);
      closeSearch();
      return;
    }
    openNoteInNotebook(note);
    closeSearch();
  };

  const handleNoteSave = (noteData: NoteSaveInput): Note | undefined => {
    const targetId = isCreatingNote ? null : editorNoteId;
    const result = actions.persistNote(targetId, noteData);
    if (isCreatingNote && result) {
      openNoteModal(result.id);
    }
    return result;
  };

  const handleSplitSave = (noteData: NoteSaveInput): Note | undefined => {
    const targetId = isCreatingNote ? null : selectedNoteId;
    const result = actions.persistNote(targetId, noteData);
    if (isCreatingNote && result) {
      closeNoteModal();
      selectNote(result.id);
    }
    return result;
  };

  const tagUsage = countTagUsageMap(notebooks);

  const handlers: NoteListHandlers = {
    onOpen: handleListOpen,
    onTogglePin: actions.toggleNotePin,
    onToggleFavorite: actions.toggleNoteFavorite,
    onMove: actions.moveNote,
    onRequestMove: actions.requestMoveNote,
    onRequestDelete: actions.deleteNote,
  };

  const hasModalNote =
    !isSplitEnabled && (isCreatingNote || editorNote !== null);
  const anyModalOpen =
    isSettingsOpen ||
    isSearchOpen ||
    hasModalNote ||
    Boolean(actions.confirm) ||
    Boolean(actions.moveNoteTarget) ||
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
        !actions.confirm &&
        !actions.moveNoteTarget &&
        !isShortcutHelpOpen,
    },
  );
  useActionHotkey("toggleTheme", toggleTheme, { enabled: !anyModalOpen });
  useActionHotkey("shortcutHelp", openShortcutHelp, { enabled: !anyModalOpen });

  return (
    <>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewNote={openCreateNote}
        onTogglePin={actions.toggleNotebookPin}
        onRequestDeleteNotebook={actions.requestDeleteNotebook}
      />

      <div
        className={`overlay${sidebarOpen ? " active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="app-content">
        <main className="main">
          <Header onOpenSidebar={() => setSidebarOpen(true)} />

          <MainPanel
            view={view}
            isFiltering={isFiltering}
            tagFilterLabel={tagFilterLabel}
            activeNotebookName={activeNotebook?.name ?? ""}
            allTags={allTags}
            activeTags={activeTags}
            onToggleTag={toggleTag}
            allNotes={allNotes}
            recentNotes={recentNotes}
            pinnedNotes={pinnedNotes}
            favoriteNotes={favoriteNotes}
            activeNotes={activeNotes}
            canMoveToNotebook={visibleNotebooks.length > 1}
            notebookNames={notebookNames}
            hasVisibleNotebooks={visibleNotebooks.length > 0}
            isSplitEnabled={isSplitEnabled}
            selectedNoteId={selectedNoteId}
            handlers={handlers}
            onOpenRecent={openNoteInNotebook}
            onOpenStatsNote={openNoteInNotebook}
            onNewNote={openCreateNote}
            onCreateNotebook={() => {
              startAddingNotebook();
              setSidebarOpen(true);
            }}
          />
        </main>

        {showSplitPane && (
          <SplitEditorPane
            isCreatingNote={isCreatingNote}
            note={activeSplitNote}
            activeNotebookId={activeNotebookId}
            notebooks={visibleNotebooks}
            tagSuggestions={allTags}
            tagUsage={tagUsage}
            isResizing={isResizing}
            onResizeStart={startResize}
            onResizeKeyDown={onSplitResizeKeyDown}
            onSave={handleSplitSave}
            onCreateTag={createTag}
            onDeleteTag={actions.deleteTag}
            onDelete={actions.deleteNoteById}
            onDirtyChange={handleEditorDirtyChange}
            onClose={session.selectNone}
          />
        )}
      </div>

      <WorkspaceModals
        isSettingsOpen={isSettingsOpen}
        onCloseSettings={closeSettings}
        isSearchOpen={isSearchOpen}
        onOpenSearchNote={openSearchNote}
        onCloseSearch={closeSearch}
        isShortcutHelpOpen={isShortcutHelpOpen}
        onCloseShortcutHelp={closeShortcutHelp}
        showNoteModal={showNoteModal}
        editorNote={editorNote}
        activeNotebookId={activeNotebookId}
        visibleNotebooks={visibleNotebooks}
        allTags={allTags}
        tagUsage={tagUsage}
        isCreatingNote={isCreatingNote}
        onNoteSave={handleNoteSave}
        onCreateTag={createTag}
        onDeleteTag={actions.deleteTag}
        onDeleteNoteById={actions.deleteNoteById}
        onCloseNoteModal={closeNoteModal}
        confirm={actions.confirm}
        onConfirmDeleteNotebook={actions.confirmDeleteNotebook}
        pendingSelectNoteId={session.pendingSelectNoteId}
        onConfirmPendingSelect={session.handlePendingSelect}
        moveNoteTarget={actions.moveNoteTarget}
        onMoveNoteToNotebook={actions.moveNoteToNotebook}
        onCloseMoveNote={actions.closeMoveNote}
      />

      <ToastRegion />
    </>
  );
};

export default App;
