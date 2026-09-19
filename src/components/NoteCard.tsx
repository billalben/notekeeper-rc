import type { MouseEvent } from "react";
import type { Note } from "../types";
import { getRelativeTime } from "../utils";
import { IconButton } from "./IconButton";
import { MarkdownContent } from "./MarkdownContent";

interface NoteCardProps {
  note: Note;
  onOpen: (note: Note) => void;
  onTogglePin: (note: Note) => void;
  onRequestDelete: (note: Note) => void;
}

export const NoteCard = ({
  note,
  onOpen,
  onTogglePin,
  onRequestDelete,
}: NoteCardProps) => {
  const isEdited = note.updatedOn !== note.postedOn;
  const timeLabel = isEdited
    ? `Edited ${getRelativeTime(note.updatedOn)}`
    : getRelativeTime(note.postedOn);

  const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRequestDelete(note);
  };

  const handleTogglePin = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onTogglePin(note);
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
        <IconButton
          icon="push_pin"
          tooltip={note.pinned ? "Unpin Note" : "Pin Note"}
          label={note.pinned ? "Unpin Note" : "Pin Note"}
          onClick={handleTogglePin}
        />
        <IconButton
          icon="delete"
          tooltip="Delete Note"
          label="Delete Note"
          onClick={handleDelete}
        />
      </div>
      <div className="state-layer" />
    </div>
  );
};
