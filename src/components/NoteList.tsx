import type { Note } from "../types";
import type { MoveDirection } from "../utils";
import { NoteCard } from "./NoteCard";

interface NoteCardWithFlags extends Note {
  canMoveUp: boolean;
  canMoveDown: boolean;
}

interface NoteListProps {
  notes: NoteCardWithFlags[];
  canMoveToNotebook: boolean;
  onOpen: (note: Note) => void;
  onTogglePin: (note: Note) => void;
  onMove: (note: Note, direction: MoveDirection) => void;
  onRequestMove: (note: Note) => void;
  onRequestDelete: (note: Note) => void;
}

export const NoteList = ({
  notes,
  canMoveToNotebook,
  onOpen,
  onTogglePin,
  onMove,
  onRequestMove,
  onRequestDelete,
}: NoteListProps) => {
  return (
    <div className="note-list" data-note-panel>
      {notes.length > 0 ? (
        notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            canMoveUp={note.canMoveUp}
            canMoveDown={note.canMoveDown}
            canMoveToNotebook={canMoveToNotebook}
            onOpen={onOpen}
            onTogglePin={onTogglePin}
            onMove={onMove}
            onRequestMove={onRequestMove}
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
