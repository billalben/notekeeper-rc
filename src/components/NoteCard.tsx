import { useTranslation } from "react-i18next";
import { toast } from "../store/useToastStore";
import { useSettingsStore } from "../store/useSettingsStore";
import type { Note } from "../types";
import { useRelativeTime } from "../hooks/useRelativeTime";
import type { MoveDirection } from "../utils";
import { downloadNoteFile } from "../utils/export";
import { ItemMenu } from "./ItemMenu";
import { MarkdownContent } from "./MarkdownContent";

interface NoteCardProps {
  note: Note;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canMoveToNotebook: boolean;
  notebookName?: string;
  isSelected?: boolean;
  onOpen: (note: Note) => void;
  onTogglePin: (note: Note) => void;
  onToggleFavorite: (note: Note) => void;
  onMove: (note: Note, direction: MoveDirection) => void;
  onRequestMove: (note: Note) => void;
  onRequestDelete: (note: Note) => void;
}

export const NoteCard = ({
  note,
  canMoveUp,
  canMoveDown,
  canMoveToNotebook,
  notebookName,
  isSelected = false,
  onOpen,
  onTogglePin,
  onToggleFavorite,
  onMove,
  onRequestMove,
  onRequestDelete,
}: NoteCardProps) => {
  const { t } = useTranslation();
  const relativeTime = useRelativeTime();
  const exportFormat = useSettingsStore((state) => state.export.defaultFormat);
  const isEdited = note.updatedOn !== note.postedOn;
  const timeLabel = isEdited
    ? t("card.editedRelative", { time: relativeTime(note.updatedOn) })
    : relativeTime(note.postedOn);

  const download = (format: "md" | "json") => {
    try {
      downloadNoteFile(note, notebookName ?? null, format);
    } catch {
      toast.error(t("toasts.exportNoteFailed"));
    }
  };

  return (
    <div
      className={`card${isSelected ? " is-selected" : ""}`}
      role="button"
      tabIndex={0}
      aria-current={isSelected ? "true" : undefined}
      onClick={() => onOpen(note)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onOpen(note);
      }}
      data-pinned={note.pinned ? "true" : undefined}
    >
      <div className="card-title-row">
        <h3 className="card-title text-title-medium">{note.title}</h3>
        {(note.pinned || note.favorite) && (
          <span className="card-badges">
            {note.pinned && (
              <span
                className="material-symbols-rounded pin-badge"
                aria-label={t("card.pinned")}
                title={t("card.pinned")}
              >
                push_pin
              </span>
            )}
            {note.favorite && (
              <span
                className="material-symbols-rounded card-favorite-badge"
                aria-label={t("card.favorite")}
                title={t("card.favorite")}
              >
                star
              </span>
            )}
          </span>
        )}
      </div>
      <MarkdownContent
        text={note.text}
        className="card-text markdown-body text-body-large"
      />
      {(note.tags.length > 0 || notebookName) && (
        <div className="card-tags">
          {notebookName && (
            <span className="card-notebook text-label-large">
              <span className="material-symbols-rounded" aria-hidden="true">
                folder
              </span>
              <span className="card-notebook-name">{notebookName}</span>
            </span>
          )}
          {note.tags.map((tag) => (
            <span key={tag} className="tag-chip">
              <span className="text-label-large">#{tag}</span>
            </span>
          ))}
        </div>
      )}
      <div className="wrapper">
        <span className="card-time text-label-large">{timeLabel}</span>
        <ItemMenu
          label={t("card.actions")}
          items={[
            {
              key: "pin",
              label: note.pinned ? t("card.unpin") : t("card.pin"),
              icon: "push_pin",
              onSelect: () => onTogglePin(note),
            },
            {
              key: "favorite",
              label: note.favorite
                ? t("card.favoriteRemove")
                : t("card.favoriteAdd"),
              icon: note.favorite ? "star" : "star_border",
              filled: note.favorite,
              onSelect: () => onToggleFavorite(note),
            },
            {
              key: "download",
              label: t("card.downloadAs", {
                format:
                  exportFormat === "md"
                    ? t("card.markdown")
                    : t("card.json"),
              }),
              icon: "download",
              separatorBefore: true,
              onSelect: () => download(exportFormat),
            },
            {
              key: "move",
              label: t("card.moveToNotebook"),
              icon: "drive_file_move",
              disabled: !canMoveToNotebook,
              separatorBefore: true,
              onSelect: () => onRequestMove(note),
            },
            {
              key: "up",
              label: t("card.moveUp"),
              icon: "keyboard_arrow_up",
              disabled: !canMoveUp,
              separatorBefore: true,
              onSelect: () => onMove(note, "up"),
            },
            {
              key: "down",
              label: t("card.moveDown"),
              icon: "keyboard_arrow_down",
              disabled: !canMoveDown,
              onSelect: () => onMove(note, "down"),
            },
            {
              key: "delete",
              label: t("card.delete"),
              icon: "delete",
              danger: true,
              separatorBefore: true,
              onSelect: () => onRequestDelete(note),
            },
          ]}
        />
      </div>
      <div className="state-layer" />
    </div>
  );
};
