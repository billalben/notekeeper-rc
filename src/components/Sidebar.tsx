import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { useSidebarResize } from "../hooks/useSidebarResize";
import { useNoteStore } from "../store/useNoteStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { toast } from "../store/useToastStore";
import { useUIStore } from "../store/useUIStore";
import type { Notebook } from "../types";
import { collectRecentNotes, sortByPinned, withMoveFlags } from "../utils";
import { formatChord } from "../utils/shortcuts";
import { IconButton } from "./IconButton";
import { NavItem } from "./NavItem";
import { SidebarRow } from "./sidebar/SidebarRow";
import { SidebarSection } from "./sidebar/SidebarSection";
import logoLight from "../assets/logo-light.svg";
import logoDark from "../assets/logo-dark.svg";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onNewNote: () => void;
  onTogglePin: (notebook: Notebook) => void;
  onRequestDeleteNotebook: (notebook: Notebook) => void;
}

export const Sidebar = ({
  open,
  onClose,
  onNewNote,
  onTogglePin,
  onRequestDeleteNotebook,
}: SidebarProps) => {
  const { t } = useTranslation();
  const notebooks = useNoteStore((state) => state.notebooks);
  const activeNotebookId = useNoteStore((state) => state.activeNotebookId);
  const setActiveNotebook = useNoteStore((state) => state.setActiveNotebook);
  const addNotebook = useNoteStore((state) => state.addNotebook);
  const renameNotebook = useNoteStore((state) => state.renameNotebook);
  const moveNotebook = useNoteStore((state) => state.moveNotebook);

  const newNoteChord = useSettingsStore((state) => state.shortcuts.newNote);
  const notebooksCollapsed = useSettingsStore(
    (state) => state.sidebar.notebooksCollapsed,
  );
  const moreCollapsed = useSettingsStore(
    (state) => state.sidebar.moreCollapsed,
  );
  const setSidebarSettings = useSettingsStore(
    (state) => state.setSidebarSettings,
  );

  const isAdding = useUIStore((state) => state.isAddingNotebook);
  const startAddingNotebook = useUIStore((state) => state.startAddingNotebook);
  const stopAddingNotebook = useUIStore((state) => state.stopAddingNotebook);
  const view = useUIStore((state) => state.view);
  const openAllNotes = useUIStore((state) => state.openAllNotes);
  const openRecent = useUIStore((state) => state.openRecent);
  const openTrash = useUIStore((state) => state.openTrash);
  const openFavorites = useUIStore((state) => state.openFavorites);
  const openPinned = useUIStore((state) => state.openPinned);
  const openStats = useUIStore((state) => state.openStats);
  const showNotes = useUIStore((state) => state.showNotes);
  const clearTagFilter = useUIStore((state) => state.clearTagFilter);

  const { isResizing, startResize } = useSidebarResize();

  const visibleNotebooks = withMoveFlags(
    sortByPinned(notebooks.filter((notebook) => notebook.deletedAt === null)),
  );
  const totalNotes = visibleNotebooks.reduce(
    (total, notebook) =>
      total + notebook.notes.filter((note) => note.deletedAt === null).length,
    0,
  );
  const trashedCount =
    notebooks.filter((notebook) => notebook.deletedAt !== null).length +
    visibleNotebooks.reduce(
      (total, notebook) =>
        total + notebook.notes.filter((note) => note.deletedAt !== null).length,
      0,
    );
  const favoriteCount = visibleNotebooks.reduce(
    (total, notebook) =>
      total +
      notebook.notes.filter((note) => note.deletedAt === null && note.favorite)
        .length,
    0,
  );
  const pinnedCount = visibleNotebooks.reduce(
    (total, notebook) =>
      total +
      notebook.notes.filter((note) => note.deletedAt === null && note.pinned)
        .length,
    0,
  );
  const recentCount = collectRecentNotes(notebooks).length;

  const selectNotebook = (notebookId: string) => {
    setActiveNotebook(notebookId);
    clearTagFilter();
    showNotes();
    onClose();
  };

  const navRef = useRef<HTMLElement>(null);

  const handleNavKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (
      !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) ||
      (event.target as HTMLElement).closest("input, textarea")
    ) {
      return;
    }

    const nav = navRef.current;
    if (!nav) return;

    const items = Array.from(
      nav.querySelectorAll<HTMLElement>("[data-sidebar-nav-item]"),
    );
    const current = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-sidebar-nav-item]",
    );
    const index = current ? items.indexOf(current) : -1;
    if (index === -1) return;

    event.preventDefault();

    const next =
      event.key === "ArrowDown"
        ? Math.min(items.length - 1, index + 1)
        : event.key === "ArrowUp"
          ? Math.max(0, index - 1)
          : event.key === "Home"
            ? 0
            : items.length - 1;

    items[next]?.focus();
  };

  const [newName, setNewName] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);
  const hasCommittedRef = useRef(false);

  useEffect(() => {
    if (isAdding) addInputRef.current?.focus();
  }, [isAdding]);

  const startAdd = () => {
    if (notebooksCollapsed) setSidebarSettings({ notebooksCollapsed: false });
    hasCommittedRef.current = false;
    setNewName("");
    startAddingNotebook();
  };

  const commitAdd = () => {
    if (hasCommittedRef.current) return;
    hasCommittedRef.current = true;

    const name = newName.trim();
    stopAddingNotebook();
    if (name) {
      addNotebook(name);
      toast.success(t("toasts.notebookCreated"));
    }
  };

  const cancelAdd = () => {
    hasCommittedRef.current = true;
    stopAddingNotebook();
  };

  const moreIndicators = (
    <>
      <span
        className={`material-symbols-rounded sidebar-indicator${
          view === "stats" ? " is-selected" : ""
        }`}
        title={t("sidebar.statistics")}
        aria-hidden="true"
      >
        insights
      </span>
      <span
        className={`material-symbols-rounded sidebar-indicator${
          view === "trash" ? " is-selected" : ""
        }`}
        title={t("sidebar.trash")}
        aria-hidden="true"
      >
        delete
      </span>
    </>
  );

  return (
    <header className={`sidebar${open ? " active" : ""}`} data-sidebar>
      <div className="wrapper wrapper-1">
        <div>
          <img src={logoLight} alt="NoteKeeper" className="logo-light" />
          <img src={logoDark} alt="NoteKeeper" className="logo-dark" />
        </div>

        <IconButton
          icon="close"
          label={t("sidebar.closeMenu")}
          className="menu-btn"
          onClick={onClose}
        />
      </div>

      <button
        type="button"
        className="sidebar-new-note"
        disabled={visibleNotebooks.length === 0}
        onClick={onNewNote}
      >
        <span className="material-symbols-rounded" aria-hidden="true">
          add
        </span>
        <span className="text text-label-large">{t("sidebar.newNote")}</span>
        {newNoteChord && (
          <kbd className="sidebar-new-note-kbd">{formatChord(newNoteChord)}</kbd>
        )}
        <div className="state-layer" />
      </button>

      <nav
        ref={navRef}
        className="sidebar-nav"
        aria-label={t("sidebar.aria")}
        onKeyDown={handleNavKeyDown}
      >
        <div className="sidebar-quick">
          <SidebarRow
            icon="note_stack"
            label={t("sidebar.allNotes")}
            count={totalNotes}
            selected={view === "all"}
            onClick={() => {
              openAllNotes();
              onClose();
            }}
          />
          <SidebarRow
            icon="push_pin"
            label={t("sidebar.pinned")}
            count={pinnedCount}
            selected={view === "pinned"}
            onClick={() => {
              openPinned();
              onClose();
            }}
          />
          <SidebarRow
            icon="star"
            label={t("sidebar.favorites")}
            count={favoriteCount}
            selected={view === "favorites"}
            onClick={() => {
              openFavorites();
              onClose();
            }}
          />
          <SidebarRow
            icon="history"
            label={t("sidebar.recent")}
            count={recentCount}
            selected={view === "recent"}
            onClick={() => {
              openRecent();
              onClose();
            }}
          />
        </div>

        <SidebarSection
          id="sidebar-notebooks"
          title={t("sidebar.notebooks")}
          count={visibleNotebooks.length}
          collapsed={notebooksCollapsed}
          onToggle={() =>
            setSidebarSettings({ notebooksCollapsed: !notebooksCollapsed })
          }
          className="sidebar-notebooks"
          action={
            <IconButton
              icon="add"
              size="small"
              tooltip={t("sidebar.createNotebook")}
              label={t("sidebar.createNotebook")}
              onClick={startAdd}
            />
          }
        >
          {visibleNotebooks.map((notebook) => (
            <NavItem
              key={notebook.id}
              notebook={notebook}
              isActive={
                notebook.id === activeNotebookId && view === "notes"
              }
              noteCount={
                notebook.notes.filter((note) => note.deletedAt === null).length
              }
              onSelect={selectNotebook}
              onRename={renameNotebook}
              onTogglePin={onTogglePin}
              onMove={(notebook, direction) =>
                moveNotebook(notebook.id, direction)
              }
              onRequestDelete={onRequestDeleteNotebook}
            />
          ))}

          {isAdding && (
            <div className="nav-item is-selected">
              <div className="nav-item-main">
                <span
                  className="material-symbols-rounded nav-item-icon"
                  aria-hidden="true"
                >
                  folder
                </span>
                <span className="nav-item-label">
                  <input
                    ref={addInputRef}
                    className="text text-label-large"
                    value={newName}
                    placeholder={t("sidebar.untitled")}
                    onChange={(event) => setNewName(event.target.value)}
                    onBlur={commitAdd}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") commitAdd();
                      if (event.key === "Escape") cancelAdd();
                    }}
                  />
                </span>
                <div className="state-layer" />
              </div>
            </div>
          )}
        </SidebarSection>

        <SidebarSection
          id="sidebar-more"
          title={t("sidebar.more")}
          collapsed={moreCollapsed}
          onToggle={() =>
            setSidebarSettings({ moreCollapsed: !moreCollapsed })
          }
          className="sidebar-more"
          collapsedIndicators={moreIndicators}
        >
          <SidebarRow
            icon="insights"
            label={t("sidebar.statistics")}
            selected={view === "stats"}
            onClick={() => {
              openStats();
              onClose();
            }}
          />
          <SidebarRow
            icon="delete"
            label={t("sidebar.trash")}
            count={trashedCount}
            selected={view === "trash"}
            onClick={() => {
              openTrash();
              onClose();
            }}
          />
        </SidebarSection>
      </nav>

      <div
        className={`sidebar-resizer${isResizing ? " resizing" : ""}`}
        role="separator"
        aria-orientation="vertical"
        aria-label={t("sidebar.resize")}
        onPointerDown={startResize}
      />
    </header>
  );
};
