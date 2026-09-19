import { useEffect, useRef, useState } from "react";
import { useSidebarResize } from "../hooks/useSidebarResize";
import { useNoteStore } from "../store/useNoteStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { toast } from "../store/useToastStore";
import { useUIStore } from "../store/useUIStore";
import type { Notebook } from "../types";
import { sortByPinned, withMoveFlags } from "../utils";
import { Fab } from "./Fab";
import { IconButton } from "./IconButton";
import { NavItem } from "./NavItem";
import logoLight from "../assets/logo-light.svg";
import logoDark from "../assets/logo-dark.svg";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onNewNote: () => void;
  onTogglePin: (notebook: Notebook) => void;
  onRequestDeleteNotebook: (notebook: Notebook) => void;
}

const DESKTOP_QUERY = "(min-width: 992px)";

export const Sidebar = ({
  open,
  onClose,
  onNewNote,
  onTogglePin,
  onRequestDeleteNotebook,
}: SidebarProps) => {
  const notebooks = useNoteStore((state) => state.notebooks);
  const activeNotebookId = useNoteStore((state) => state.activeNotebookId);
  const setActiveNotebook = useNoteStore((state) => state.setActiveNotebook);
  const addNotebook = useNoteStore((state) => state.addNotebook);
  const renameNotebook = useNoteStore((state) => state.renameNotebook);
  const moveNotebook = useNoteStore((state) => state.moveNotebook);

  const collapsed = useSettingsStore((state) => state.sidebar.collapsed);
  const setSidebarSettings = useSettingsStore(
    (state) => state.setSidebarSettings,
  );

  const isAdding = useUIStore((state) => state.isAddingNotebook);
  const startAddingNotebook = useUIStore((state) => state.startAddingNotebook);
  const stopAddingNotebook = useUIStore((state) => state.stopAddingNotebook);
  const view = useUIStore((state) => state.view);
  const openTrash = useUIStore((state) => state.openTrash);
  const showNotes = useUIStore((state) => state.showNotes);
  const clearTagFilter = useUIStore((state) => state.clearTagFilter);

  const { isResizing, startResize } = useSidebarResize(collapsed);

  const isDesktop =
    typeof window !== "undefined" &&
    window.matchMedia(DESKTOP_QUERY).matches;

  const visibleNotebooks = withMoveFlags(
    sortByPinned(notebooks.filter((notebook) => notebook.deletedAt === null)),
  );
  const trashedCount =
    notebooks.filter((notebook) => notebook.deletedAt !== null).length +
    visibleNotebooks.reduce(
      (total, notebook) =>
        total +
        notebook.notes.filter((note) => note.deletedAt !== null).length,
      0,
    );

  const selectNotebook = (notebookId: string) => {
    setActiveNotebook(notebookId);
    clearTagFilter();
    showNotes();
  };

  const [newName, setNewName] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);
  const hasCommittedRef = useRef(false);

  useEffect(() => {
    if (isAdding) addInputRef.current?.focus();
  }, [isAdding]);

  const startAdd = () => {
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
      toast.success("Notebook created");
    }
  };

  const cancelAdd = () => {
    hasCommittedRef.current = true;
    stopAddingNotebook();
  };

  return (
    <header
      className={`sidebar${open ? " active" : ""}${
        collapsed && isDesktop ? " collapsed" : ""
      }`}
      data-sidebar
    >
      <div className="wrapper wrapper-1">
        <div>
          <img src={logoLight} alt="NoteKeeper" className="logo-light" />
          <img src={logoDark} alt="NoteKeeper" className="logo-dark" />
        </div>

        <IconButton
          icon={collapsed ? "menu_open" : "menu"}
          tooltip={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="collapse-btn"
          onClick={() => setSidebarSettings({ collapsed: !collapsed })}
        />

        <IconButton
          icon="close"
          label="Close Menu"
          className="menu-btn"
          onClick={onClose}
        />
      </div>

      <Fab
        text="New note"
        disabled={visibleNotebooks.length === 0}
        onClick={onNewNote}
      />

      <div className="wrapper wrapper-2">
        <h2 className="text-title-small">NOTEBOOKS</h2>
        <IconButton
          icon="add"
          size="small"
          tooltip="Create new notebook"
          label="Create new notebook"
          onClick={startAdd}
        />
      </div>

      <nav className="nav custom-scrollbar" data-sidebar-list>
        {visibleNotebooks.map((notebook) => (
          <NavItem
            key={notebook.id}
            notebook={notebook}
            isActive={notebook.id === activeNotebookId && view === "notes"}
            onSelect={selectNotebook}
            onRename={renameNotebook}
            onTogglePin={onTogglePin}
            onMove={(notebook, direction) => moveNotebook(notebook.id, direction)}
            onRequestDelete={onRequestDeleteNotebook}
          />
        ))}

        {isAdding && (
          <div className="nav-item active">
            <input
              ref={addInputRef}
              className="text text-label-large"
              value={newName}
              placeholder="Untitled"
              onChange={(event) => setNewName(event.target.value)}
              onBlur={commitAdd}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitAdd();
                if (event.key === "Escape") cancelAdd();
              }}
            />
            <div className="state-layer" />
          </div>
        )}
      </nav>

      <button
        type="button"
        className={`nav-item trash-nav-item${view === "trash" ? " active" : ""}`}
        onClick={() => {
          openTrash();
          onClose();
        }}
      >
        <span className="material-symbols-rounded" aria-hidden="true">
          delete
        </span>
        <span className="text text-label-large">Trash</span>
        {trashedCount > 0 && (
          <span className="trash-badge text-label-small">{trashedCount}</span>
        )}
        <div className="state-layer" />
      </button>

      <div className="cp-info">
        <span className="text-label-large">
          Copyright{" "}
          <span className="current-yr-cp">{new Date().getFullYear()}</span>{" "}
          <strong>Billal Benz</strong>
        </span>
      </div>

      <div
        className={`sidebar-resizer${isResizing ? " resizing" : ""}`}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        onPointerDown={startResize}
      />
    </header>
  );
};
