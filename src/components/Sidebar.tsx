import { useEffect, useRef, useState } from "react";
import { useNoteStore } from "../store/useNoteStore";
import { useUIStore } from "../store/useUIStore";
import type { Notebook } from "../types";
import { Fab } from "./Fab";
import { IconButton } from "./IconButton";
import { NavItem } from "./NavItem";
import logoLight from "../assets/logo-light.svg";
import logoDark from "../assets/logo-dark.svg";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onNewNote: () => void;
  onRequestDeleteNotebook: (notebook: Notebook) => void;
}

export const Sidebar = ({
  open,
  onClose,
  onNewNote,
  onRequestDeleteNotebook,
}: SidebarProps) => {
  const notebooks = useNoteStore((state) => state.notebooks);
  const activeNotebookId = useNoteStore((state) => state.activeNotebookId);
  const setActiveNotebook = useNoteStore((state) => state.setActiveNotebook);
  const addNotebook = useNoteStore((state) => state.addNotebook);
  const renameNotebook = useNoteStore((state) => state.renameNotebook);

  const isAdding = useUIStore((state) => state.isAddingNotebook);
  const startAddingNotebook = useUIStore((state) => state.startAddingNotebook);
  const stopAddingNotebook = useUIStore((state) => state.stopAddingNotebook);

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
    if (name) addNotebook(name);
  };

  const cancelAdd = () => {
    hasCommittedRef.current = true;
    stopAddingNotebook();
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
          label="Close Menu"
          className="menu-btn"
          onClick={onClose}
        />
      </div>

      <Fab
        text="New note"
        disabled={notebooks.length === 0}
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
        {notebooks.map((notebook) => (
          <NavItem
            key={notebook.id}
            notebook={notebook}
            isActive={notebook.id === activeNotebookId}
            onSelect={setActiveNotebook}
            onRename={renameNotebook}
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

      <div className="cp-info">
        <span className="text-label-large">
          Copyright{" "}
          <span className="current-yr-cp">{new Date().getFullYear()}</span>{" "}
          <strong>Billal Benz</strong>
        </span>
      </div>
    </header>
  );
};
