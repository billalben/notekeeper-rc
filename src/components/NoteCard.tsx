import { toast } from "../store/useToastStore";
import { useSettingsStore } from "../store/useSettingsStore";
import type { Note } from "../types";
import { getRelativeTime, type MoveDirection } from "../utils";
import { downloadNoteFile } from "../utils/export";
import { ItemMenu } from "./ItemMenu";
import { MarkdownContent } from "./MarkdownContent";

interface NoteCardProps {
  note: Note;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canMoveToNotebook: boolean;
  notebookName?: string;
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
  onOpen,
  onTogglePin,
  onToggleFavorite,
  onMove,
  onRequestMove,
  onRequestDelete,
}: NoteCardProps) => {
  const exportFormat = useSettingsStore((state) => state.export.defaultFormat);
  const isEdited = note.updatedOn !== note.postedOn;
  const timeLabel = isEdited
    ? `Edited ${getRelativeTime(note.updatedOn)}`
    : getRelativeTime(note.postedOn);

  const download = (format: "md" | "json") => {
    try {
      downloadNoteFile(note, notebookName ?? null, format);
    } catch {
      toast.error("Couldn't export the note");
    }
  };

  return (
    <div
      className="card"
      role="button"
      tabIndex={0}
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
                aria-label="Pinned"
                title="Pinned"
              >
                push_pin
              </span>
            )}
            {note.favorite && (
              <span
                className="material-symbols-rounded card-favorite-badge"
                aria-label="Favorite"
                title="Favorite"
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
              {notebookName}
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
          label="Note actions"
          items={[
            {
              key: "pin",
              label: note.pinned ? "Unpin note" : "Pin note",
              icon: "push_pin",
              onSelect: () => onTogglePin(note),
            },
            {
              key: "favorite",
              label: note.favorite ? "Unfavorite note" : "Favorite note",
              icon: note.favorite ? "star" : "star_border",
              filled: note.favorite,
              onSelect: () => onToggleFavorite(note),
            },
            {
              key: "download",
              label: `Download as ${
                exportFormat === "md" ? "Markdown" : "JSON"
              }`,
              icon: "download",
              separatorBefore: true,
              onSelect: () => download(exportFormat),
            },
            {
              key: "move",
              label: "Move to notebook",
              icon: "drive_file_move",
              disabled: !canMoveToNotebook,
              separatorBefore: true,
              onSelect: () => onRequestMove(note),
            },
            {
              key: "up",
              label: "Move up",
              icon: "keyboard_arrow_up",
              disabled: !canMoveUp,
              separatorBefore: true,
              onSelect: () => onMove(note, "up"),
            },
            {
              key: "down",
              label: "Move down",
              icon: "keyboard_arrow_down",
              disabled: !canMoveDown,
              onSelect: () => onMove(note, "down"),
            },
            {
              key: "delete",
              label: "Delete note",
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
