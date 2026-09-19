import { useEffect, useRef, useState, type MouseEvent } from "react";
import { toast } from "../store/useToastStore";
import type { Notebook } from "../types";
import { IconButton } from "./IconButton";

interface NavItemProps {
  notebook: Notebook;
  isActive: boolean;
  onSelect: (notebookId: string) => void;
  onRename: (notebookId: string, name: string) => void;
  onRequestDelete: (notebook: Notebook) => void;
}

export const NavItem = ({
  notebook,
  isActive,
  onSelect,
  onRename,
  onRequestDelete,
}: NavItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const startEditing = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setDraftName(notebook.name);
    setIsEditing(true);
  };

  const commitRename = () => {
    const nextName = draftName.trim() || notebook.name;
    setIsEditing(false);
    if (nextName !== notebook.name) {
      onRename(notebook.id, nextName);
      toast.success("Notebook renamed");
    }
  };

  const cancelRename = () => {
    setIsEditing(false);
  };

  const requestDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRequestDelete(notebook);
  };

  return (
    <div
      className={`nav-item${isActive ? " active" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(notebook.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onSelect(notebook.id);
      }}
    >
      <span
        className="material-symbols-rounded nav-item-icon"
        aria-hidden="true"
      >
        folder
      </span>
      <span className="nav-item-label">
        {isEditing ? (
          <input
            ref={inputRef}
            className="text text-label-large"
            value={draftName}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => setDraftName(event.target.value)}
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitRename();
              if (event.key === "Escape") cancelRename();
            }}
          />
        ) : (
          <span className="text text-label-large" data-notebook-field>
            {notebook.name}
          </span>
        )}
      </span>
      <IconButton
        icon="edit"
        size="small"
        tooltip="Edit notebook"
        label="Edit notebook"
        onClick={startEditing}
      />
      <IconButton
        icon="delete"
        size="small"
        tooltip="Delete notebook"
        label="Delete notebook"
        onClick={requestDelete}
      />
      <div className="state-layer" />
    </div>
  );
};
