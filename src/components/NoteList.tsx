import type { Note } from "../types";
import { NoteCard } from "./NoteCard";

interface NoteListProps {
  notes: Note[];
  onOpen: (note: Note) => void;
  onTogglePin: (note: Note) => void;
  onRequestDelete: (note: Note) => void;
}

export const NoteList = ({
  notes,
  onOpen,
  onTogglePin,
  onRequestDelete,
}: NoteListProps) => {
  return (
    <div className="note-list" data-note-panel>
      {notes.length > 0 ? (
        notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onOpen={onOpen}
            onTogglePin={onTogglePin}
            onRequestDelete={onRequestDelete}
          />
        ))
      ) : (
        <div className="empty-notes">
          <span className="material-symbols-rounded" aria-hidden="true">
            note_stack
          </span>
          <div className="text-headline-small">No notes</div>
        </div>
      )}
    </div>
  );
};
