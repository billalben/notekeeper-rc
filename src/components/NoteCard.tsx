import type { Note } from "../types";
import { getRelativeTime, type MoveDirection } from "../utils";
import { ItemMenu } from "./ItemMenu";
import { MarkdownContent } from "./MarkdownContent";

interface NoteCardProps {
  note: Note;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canMoveToNotebook: boolean;
  onOpen: (note: Note) => void;
  onTogglePin: (note: Note) => void;
  onMove: (note: Note, direction: MoveDirection) => void;
  onRequestMove: (note: Note) => void;
  onRequestDelete: (note: Note) => void;
}

export const NoteCard = ({
  note,
  canMoveUp,
  canMoveDown,
  canMoveToNotebook,
  onOpen,
  onTogglePin,
  onMove,
  onRequestMove,
  onRequestDelete,
}: NoteCardProps) => {
  const isEdited = note.updatedOn !== note.postedOn;
  const timeLabel = isEdited
    ? `Edited ${getRelativeTime(note.updatedOn)}`
    : getRelativeTime(note.postedOn);

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
        {note.pinned && (
          <span
            className="material-symbols-rounded pin-badge"
            aria-label="Pinned"
            title="Pinned"
          >
            push_pin
          </span>
        )}
      </div>
      <MarkdownContent
        text={note.text}
        className="card-text markdown-body text-body-large"
      />
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
