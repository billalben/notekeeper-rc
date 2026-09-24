import { useTranslation } from "react-i18next";
import type { Note } from "@/shared/types";
import type { MoveDirection } from "@/shared/lib/notes";
import { NoteCard } from "@/features/notes/components/NoteCard";

interface NoteCardWithFlags extends Note {
  canMoveUp: boolean;
  canMoveDown: boolean;
}

interface NoteListProps {
  notes: NoteCardWithFlags[];
  canMoveToNotebook: boolean;
  notebookNames?: Record<string, string>;
  emptyMessage?: string;
  emptyIcon?: string;
  selectedNoteId?: string | null;
  onOpen: (note: Note) => void;
  onTogglePin: (note: Note) => void;
  onToggleFavorite: (note: Note) => void;
  onMove: (note: Note, direction: MoveDirection) => void;
  onRequestMove: (note: Note) => void;
  onRequestDelete: (note: Note) => void;
}

export const NoteList = ({
  notes,
  canMoveToNotebook,
  notebookNames,
  emptyMessage,
  emptyIcon = "note_stack",
  selectedNoteId,
  onOpen,
  onTogglePin,
  onToggleFavorite,
  onMove,
  onRequestMove,
  onRequestDelete,
}: NoteListProps) => {
  const { t } = useTranslation();

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
            notebookName={notebookNames?.[note.notebookId]}
            isSelected={note.id === selectedNoteId}
            onOpen={onOpen}
            onTogglePin={onTogglePin}
            onToggleFavorite={onToggleFavorite}
            onMove={onMove}
            onRequestMove={onRequestMove}
            onRequestDelete={onRequestDelete}
          />
        ))
      ) : (
        <div className="empty-notes">
          <span className="material-symbols-rounded" aria-hidden="true">
            {emptyIcon}
          </span>
          <div className="text-headline-small">
            {emptyMessage ?? t("notes.noNotes")}
          </div>
        </div>
      )}
    </div>
  );
};
