import { useRef, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import logoLight from "@/assets/logo-light.svg";
import logoDark from "@/assets/logo-dark.svg";
import { useSidebarResize } from "@/features/notebooks/hooks/useSidebarResize";
import { computeSidebarCounts } from "@/features/notebooks/lib/sidebarCounts";
import { formatChord } from "@/shared/lib/shortcuts";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import type { Notebook } from "@/shared/types";
import { useUIStore } from "@/shared/stores/useUIStore";
import { IconButton } from "@/shared/ui/IconButton";
import { NavItem } from "./NavItem";
import { AddNotebookRow } from "./sidebar/AddNotebookRow";
import { MoreSection } from "./sidebar/MoreSection";
import { QuickLinks } from "./sidebar/QuickLinks";
import { SidebarSection } from "./sidebar/SidebarSection";

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
  const renameNotebook = useNoteStore((state) => state.renameNotebook);
  const moveNotebook = useNoteStore((state) => state.moveNotebook);

  const newNoteChord = useSettingsStore((state) => state.shortcuts.newNote);
  const notebooksCollapsed = useSettingsStore(
    (state) => state.sidebar.notebooksCollapsed,
  );
  const setSidebarSettings = useSettingsStore(
    (state) => state.setSidebarSettings,
  );

  const isAdding = useUIStore((state) => state.isAddingNotebook);
  const startAddingNotebook = useUIStore((state) => state.startAddingNotebook);
  const view = useUIStore((state) => state.view);
  const showNotes = useUIStore((state) => state.showNotes);
  const clearTagFilter = useUIStore((state) => state.clearTagFilter);

  const { isResizing, startResize } = useSidebarResize();

  const {
    visibleNotebooks,
    totalNotes,
    trashedCount,
    favoriteCount,
    pinnedCount,
    recentCount,
  } = computeSidebarCounts(notebooks);

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

  const startAdd = () => {
    if (notebooksCollapsed) setSidebarSettings({ notebooksCollapsed: false });
    startAddingNotebook();
  };

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
          <kbd className="sidebar-new-note-kbd">
            {formatChord(newNoteChord)}
          </kbd>
        )}
        <div className="state-layer" />
      </button>

      <nav
        ref={navRef}
        className="sidebar-nav"
        aria-label={t("sidebar.aria")}
        onKeyDown={handleNavKeyDown}
      >
        <QuickLinks
          view={view}
          totalNotes={totalNotes}
          pinnedCount={pinnedCount}
          favoriteCount={favoriteCount}
          recentCount={recentCount}
          onNavigate={onClose}
        />

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
              isActive={notebook.id === activeNotebookId && view === "notes"}
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

          {isAdding && <AddNotebookRow />}
        </SidebarSection>

        <MoreSection
          view={view}
          trashedCount={trashedCount}
          onNavigate={onClose}
        />
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
