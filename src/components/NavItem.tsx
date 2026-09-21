import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../store/useSettingsStore";
import { toast } from "../store/useToastStore";
import type { Notebook } from "../types";
import type { MoveDirection, MoveFlags } from "../utils";
import { downloadNotebookFile } from "../utils/export";
import { ItemMenu } from "./ItemMenu";

interface NavItemProps {
  notebook: Notebook & MoveFlags;
  isActive: boolean;
  noteCount: number;
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
  onSelect,
  onRename,
  onTogglePin,
  onMove,
  onRequestDelete,
}: NavItemProps) => {
  const { t } = useTranslation();
  const exportFormat = useSettingsStore((state) => state.export.defaultFormat);
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
      toast.success(t("toasts.notebookRenamed"));
    }
  };

  const cancelRename = () => {
    setIsEditing(false);
  };

  const exportNotebook = () => {
    try {
      downloadNotebookFile(notebook, exportFormat);
    } catch {
      toast.error(t("toasts.exportNotebookFailed"));
    }
  };

  const isEmpty = noteCount === 0;

  return (
    <div
      className={`nav-item${isActive ? " is-selected" : ""}${
        isEmpty ? " is-empty" : ""
      }`}
      data-pinned={notebook.pinned ? "true" : undefined}
    >
      {isEditing ? (
        <div className="nav-item-main">
          <span
            className="material-symbols-rounded nav-item-icon"
            aria-hidden="true"
          >
            folder
          </span>
          <span className="nav-item-label">
            <input
              ref={inputRef}
              className="text text-label-large"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onBlur={commitRename}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitRename();
                if (event.key === "Escape") cancelRename();
              }}
            />
          </span>
          <div className="state-layer" />
        </div>
      ) : (
        <button
          type="button"
          className="nav-item-main"
          aria-current={isActive ? "page" : undefined}
          title={notebook.name}
          onClick={() => onSelect(notebook.id)}
          data-sidebar-nav-item
        >
          <span
            className="material-symbols-rounded nav-item-icon"
            aria-hidden="true"
          >
            folder
          </span>
          <span className="nav-item-label">
            <span className="text text-label-large" data-notebook-field>
              {notebook.name}
            </span>
            {notebook.pinned && (
              <span
                className="material-symbols-rounded pin-badge"
                aria-label={t("sidebar.pinnedBadge")}
                title={t("sidebar.pinnedBadge")}
              >
                push_pin
              </span>
            )}
          </span>
          {noteCount > 0 && (
            <span
              className="notebook-count text-label-small"
              aria-label={t("sidebar.noteCount", { count: noteCount })}
              title={t("sidebar.noteCount", { count: noteCount })}
            >
              {noteCount}
            </span>
          )}
          <div className="state-layer" />
        </button>
      )}

      <ItemMenu
        label={t("sidebar.notebookActions")}
        items={[
          {
            key: "rename",
            label: t("sidebar.rename"),
            icon: "edit",
            onSelect: startEditing,
          },
          {
            key: "pin",
            label: notebook.pinned
              ? t("sidebar.unpinNotebook")
              : t("sidebar.pinNotebook"),
            icon: "push_pin",
            onSelect: () => onTogglePin(notebook),
          },
          {
            key: "export",
            label: t("sidebar.exportNotebook"),
            icon: "download",
            separatorBefore: true,
            onSelect: exportNotebook,
          },
          {
            key: "up",
            label: t("sidebar.moveUp"),
            icon: "keyboard_arrow_up",
            disabled: !canMoveUp,
            onSelect: () => onMove(notebook, "up"),
          },
          {
            key: "down",
            label: t("sidebar.moveDown"),
            icon: "keyboard_arrow_down",
            disabled: !canMoveDown,
            onSelect: () => onMove(notebook, "down"),
          },
          {
            key: "delete",
            label: t("sidebar.deleteNotebook"),
            icon: "delete",
            danger: true,
            separatorBefore: true,
            onSelect: () => onRequestDelete(notebook),
          },
        ]}
      />
    </div>
  );
};
