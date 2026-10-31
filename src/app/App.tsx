import { useCallback, useEffect, useMemo, useState } from "react";
import { Header } from "@/app/Header";
import { useDocumentAppearance } from "@/app/hooks/useDocumentAppearance";
import { useEditorSession } from "@/app/hooks/useEditorSession";
import { useLanguage } from "@/app/hooks/useLanguage";
import { useLaunchIntent } from "@/app/hooks/useLaunchIntent";
import { useNoteActions } from "@/app/hooks/useNoteActions";
import { usePersistentStoragePrompt } from "@/app/hooks/usePersistentStoragePrompt";
import { useStorageWarning } from "@/app/hooks/useStorageWarning";
import { useTrashPurge } from "@/app/hooks/useTrashPurge";
import { MainPanel } from "@/app/MainPanel";
import { SplitEditorPane } from "@/app/SplitEditorPane";
import { WorkspaceModals } from "@/app/WorkspaceModals";
import type { NoteListHandlers, NoteSaveInput } from "@/features/notes/types";
import { useNoteCollections } from "@/features/notes/hooks/useNoteCollections";
import { useSplitResize } from "@/features/notes/hooks/useSplitResize";
import { Sidebar } from "@/features/notebooks/components/Sidebar";
import { useActionHotkey } from "@/features/shortcuts/hooks/useActionHotkey";
import { Tour } from "@/features/tour/components/Tour";
import { useHashRoute } from "@/app/router/useHashRoute";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { DESKTOP_QUERY, trashRetentionMs } from "@/shared/lib/constants";
import { countTagUsageMap } from "@/shared/lib/notes";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import { subscribeToNoteStoreSync } from "@/shared/stores/crossTabSync";
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

  const retentionDays = useSettingsStore((state) => state.trash.retentionDays);
  const presentation = useSettingsStore((state) => state.editor.presentation);

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
  const newNoteSeed = useUIStore((state) => state.newNoteSeed);
  const openNoteModal = useUIStore((state) => state.openNoteModal);
  const openCreateNoteModal = useUIStore((state) => state.openCreateNoteModal);
  const closeNoteModal = useUIStore((state) => state.closeNoteModal);
  const activeTags = useUIStore((state) => state.activeTags);
  const toggleTag = useUIStore((state) => state.toggleTag);
  const clearTagFilter = useUIStore((state) => state.clearTagFilter);
  const isShortcutHelpOpen = useUIStore((state) => state.isShortcutHelpOpen);
  const openShortcutHelp = useUIStore((state) => state.openShortcutHelp);
  const closeShortcutHelp = useUIStore((state) => state.closeShortcutHelp);
  const isTourOpen = useUIStore((state) => state.isTourOpen);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useDocumentAppearance();
  useLanguage();
  useTrashPurge(trashRetentionMs(retentionDays));
  useStorageWarning();
  usePersistentStoragePrompt();

  useEffect(() => subscribeToNoteStoreSync(), []);

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

  const visibleNotebooks = useMemo(
    () => notebooks.filter((notebook) => notebook.deletedAt === null),
    [notebooks],
  );
  const activeNotebook = useMemo(
    () =>
      visibleNotebooks.find((notebook) => notebook.id === activeNotebookId) ??
      null,
    [visibleNotebooks, activeNotebookId],
  );

  const notebookNames = useMemo(
    () =>
      Object.fromEntries(
        visibleNotebooks.map((notebook) => [notebook.id, notebook.name]),
      ),
    [visibleNotebooks],
  );

  const isFiltering = activeTags.length > 0;
  const tagFilterLabel = activeTags.map((tag) => `#${tag}`).join(", ");
  const { activeNotes, favoriteNotes, pinnedNotes, allNotes, recentNotes } =
    useNoteCollections({ notebooks, activeNotebook, activeTags, view });

  const isWide = useMediaQuery(DESKTOP_QUERY);
  useHashRoute(isWide);
  useLaunchIntent();

  // Stable callbacks so the tour's memoized steps don't rebuild each render.
  const openTourEditor = useCallback(() => {
    if (visibleNotebooks.length === 0) return;
    if (presentation === "split" && isWide) selectNote(null);
    openCreateNoteModal();
  }, [
    visibleNotebooks.length,
    presentation,
    isWide,
    selectNote,
    openCreateNoteModal,
  ]);
  const closeTourEditor = useCallback(() => closeNoteModal(), [closeNoteModal]);

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
    closeSidebar,
    selectNone: session.selectNone,
  });
  const {
    persistNote,
    toggleNotePin,
    toggleNoteFavorite,
    toggleNoteArchive,
    moveNote,
    requestMoveNote,
    deleteNote,
  } = actions;

  const handleSelectNote = session.handleSelectNote;

  const {
    isResizing,
    startResize,
    onKeyDown: onSplitResizeKeyDown,
  } = useSplitResize();

  useEffect(() => {
    document.body.classList.toggle("split-open", showSplitPane);
    return () => document.body.classList.remove("split-open");
  }, [showSplitPane]);

  const openNoteInNotebook = useCallback(
    (note: Note) => {
      setActiveNotebook(note.notebookId);
      showNotes();
      clearTagFilter();
      openEditNote(note);
    },
    [setActiveNotebook, showNotes, clearTagFilter, openEditNote],
  );

  const openSearchNote = useCallback(
    (note: Note) => {
      if (isSplitEnabled) {
        handleSelectNote(note);
        closeSearch();
        return;
      }
      openNoteInNotebook(note);
      closeSearch();
    },
    [isSplitEnabled, handleSelectNote, closeSearch, openNoteInNotebook],
  );

  const handleNoteSave = useCallback(
    (noteData: NoteSaveInput): Note | undefined => {
      const targetId = isCreatingNote ? null : editorNoteId;
      const result = persistNote(targetId, noteData);
      if (isCreatingNote && result) {
        openNoteModal(result.id);
      }
      return result;
    },
    [isCreatingNote, editorNoteId, persistNote, openNoteModal],
  );

  const handleSplitSave = useCallback(
    (noteData: NoteSaveInput): Note | undefined => {
      const targetId = isCreatingNote ? null : selectedNoteId;
      const result = persistNote(targetId, noteData);
      if (isCreatingNote && result) {
        closeNoteModal();
        selectNote(result.id);
      }
      return result;
    },
    [isCreatingNote, selectedNoteId, persistNote, closeNoteModal, selectNote],
  );

  const tagUsage = useMemo(() => countTagUsageMap(notebooks), [notebooks]);

  const handlers: NoteListHandlers = useMemo(
    () => ({
      onOpen: handleListOpen,
      onTogglePin: toggleNotePin,
      onToggleFavorite: toggleNoteFavorite,
      onToggleArchive: toggleNoteArchive,
      onMove: moveNote,
      onRequestMove: requestMoveNote,
      onRequestDelete: deleteNote,
    }),
    [
      handleListOpen,
      toggleNotePin,
      toggleNoteFavorite,
      toggleNoteArchive,
      moveNote,
      requestMoveNote,
      deleteNote,
    ],
  );

  const handleCreateNotebook = useCallback(() => {
    startAddingNotebook();
    setSidebarOpen(true);
  }, [startAddingNotebook]);

  const hasModalNote =
    !isSplitEnabled && (isCreatingNote || editorNote !== null);
  const anyModalOpen =
    isSettingsOpen ||
    isSearchOpen ||
    hasModalNote ||
    Boolean(actions.confirm) ||
    Boolean(actions.moveNoteTarget) ||
    isShortcutHelpOpen ||
    isTourOpen;

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
        !isShortcutHelpOpen &&
        !isTourOpen,
    },
  );
  useActionHotkey("toggleTheme", toggleTheme, { enabled: !anyModalOpen });
  useActionHotkey("shortcutHelp", openShortcutHelp, { enabled: !anyModalOpen });

  return (
    <>
      <Sidebar
        open={sidebarOpen}
        onClose={closeSidebar}
        onNewNote={openCreateNote}
        onTogglePin={actions.toggleNotebookPin}
        onRequestDeleteNotebook={actions.requestDeleteNotebook}
      />

      <div
        className={`overlay${sidebarOpen ? " active" : ""}`}
        onClick={closeSidebar}
      />

      <div className="app-content">
        <main className="main">
          <Header onOpenSidebar={openSidebar} />

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
            selectionDisabled={isSplitEnabled && selectedNoteId !== null}
            handlers={handlers}
            onArchiveSelected={actions.archiveNotes}
            onUnarchiveSelected={actions.unarchiveNotes}
            onOpenRecent={openNoteInNotebook}
            onOpenStatsNote={openNoteInNotebook}
            onNewNote={openCreateNote}
            onCreateNotebook={handleCreateNotebook}
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
            newNoteTitle={newNoteSeed?.title}
            newNoteText={newNoteSeed?.text}
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
        newNoteTitle={newNoteSeed?.title}
        newNoteText={newNoteSeed?.text}
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

      <Tour
        onOpenSidebar={openSidebar}
        onCloseSidebar={closeSidebar}
        onOpenEditor={openTourEditor}
        onCloseEditor={closeTourEditor}
      />

      <ToastRegion />
    </>
  );
};

export default App;
