import type { MouseEvent } from "react";
import type { Note } from "../types";
import { getRelativeTime } from "../utils";
import { IconButton } from "./IconButton";

interface NoteCardProps {
  note: Note;
  onOpen: (note: Note) => void;
  onRequestDelete: (note: Note) => void;
}

export const NoteCard = ({ note, onOpen, onRequestDelete }: NoteCardProps) => {
  const isEdited = note.updatedOn !== note.postedOn;
  const timeLabel = isEdited
    ? `Edited ${getRelativeTime(note.updatedOn)}`
    : getRelativeTime(note.postedOn);

  const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRequestDelete(note);
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
    >
      <h3 className="card-title text-title-medium">{note.title}</h3>
      <p className="card-text text-body-large">{note.text}</p>
      <div className="wrapper">
        <span className="card-time text-label-large">
          {timeLabel}
        </span>
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
