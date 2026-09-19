import { useEffect, useRef, useState } from "react";
import { toast } from "../store/useToastStore";
import type { Notebook } from "../types";
import type { MoveDirection, MoveFlags } from "../utils";
import { ItemMenu } from "./ItemMenu";

interface NavItemProps {
  notebook: Notebook & MoveFlags;
  isActive: boolean;
  noteCount: number;
  showCounts: boolean;
  onSelect: (notebookId: string) => void;
  onRename: (notebookId: string, name: string) => void;
  onTogglePin: (notebook: Notebook) => void;
  onMove: (notebook: Notebook, direction: MoveDirection) => void;
  onRequestDelete: (notebook: Notebook) => void;
}

export const NavItem = ({
  notebook,
  isActive,
  noteCount,
  showCounts,
  onSelect,
  onRename,
  onTogglePin,
  onMove,
  onRequestDelete,
}: NavItemProps) => {
  const { canMoveUp, canMoveDown } = notebook;
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const startEditing = () => {
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

  return (
    <div
      className={`nav-item${isActive ? " active" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(notebook.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onSelect(notebook.id);
      }}
      data-pinned={notebook.pinned ? "true" : undefined}
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
        {notebook.pinned && (
          <span
            className="material-symbols-rounded pin-badge"
            aria-label="Pinned"
            title="Pinned"
          >
            push_pin
          </span>
        )}
      </span>
      {showCounts && noteCount > 0 && (
        <span
          className="notebook-count text-label-small"
          aria-label={`${noteCount} notes`}
          title={`${noteCount} notes`}
        >
          {noteCount}
        </span>
      )}
      <ItemMenu
        label="Notebook actions"
        items={[
          {
            key: "rename",
            label: "Rename",
            icon: "edit",
            onSelect: startEditing,
          },
          {
            key: "pin",
            label: notebook.pinned ? "Unpin notebook" : "Pin notebook",
            icon: "push_pin",
            onSelect: () => onTogglePin(notebook),
          },
          {
            key: "up",
            label: "Move up",
            icon: "keyboard_arrow_up",
            disabled: !canMoveUp,
            separatorBefore: true,
            onSelect: () => onMove(notebook, "up"),
          },
          {
            key: "down",
            label: "Move down",
            icon: "keyboard_arrow_down",
            disabled: !canMoveDown,
            onSelect: () => onMove(notebook, "down"),
          },
          {
            key: "delete",
            label: "Delete notebook",
            icon: "delete",
            danger: true,
            separatorBefore: true,
            onSelect: () => onRequestDelete(notebook),
          },
        ]}
      />
      <div className="state-layer" />
    </div>
  );
};
