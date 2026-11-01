import { useTranslation } from "react-i18next";
import type { Note } from "@/shared/types";
import type { MoveDirection } from "@/shared/lib/notes";
import { useVirtualNoteGrid } from "@/features/notes/hooks/useVirtualNoteGrid";
import {
  DEFAULT_NOTE_ROW_HEIGHT,
  VIRTUALIZATION_THRESHOLD,
} from "@/features/notes/lib/virtualGrid";
import type { NoteWithMoveFlags } from "@/features/notes/types";
import { NoteCard } from "@/features/notes/components/NoteCard";

/** Matches the `.note-list.is-selecting` bottom padding in archive.css. */
const NOTE_SELECTION_BAR_SPACE = 88;

interface NoteListProps {
  notes: NoteWithMoveFlags[];
  canMoveToNotebook: boolean;
  notebookNames?: Record<string, string>;
  emptyMessage?: string;
  emptyIcon?: string;
  selectedNoteId?: string | null;
  isSelecting?: boolean;
  selectedIds?: ReadonlySet<string>;
  onToggleSelected?: (note: Note) => void;
  onOpen: (note: Note) => void;
  onTogglePin: (note: Note) => void;
  onToggleFavorite: (note: Note) => void;
  onToggleArchive: (note: Note) => void;
  onMove: (note: Note, direction: MoveDirection) => void;
  onRequestMove: (note: Note) => void;
  onRequestDelete: (note: Note) => void;
}

const renderNoteCard = (note: NoteWithMoveFlags, props: NoteListProps) => {
  const {
    canMoveToNotebook,
    notebookNames,
    selectedNoteId,
    isSelecting = false,
    selectedIds,
    onToggleSelected,
    onOpen,
    onTogglePin,
    onToggleFavorite,
    onToggleArchive,
    onMove,
    onRequestMove,
    onRequestDelete,
  } = props;

  return (
    <NoteCard
      key={note.id}
      note={note}
      canMoveUp={note.canMoveUp}
      canMoveDown={note.canMoveDown}
      canMoveToNotebook={canMoveToNotebook}
      notebookName={notebookNames?.[note.notebookId]}
      isSelected={note.id === selectedNoteId}
      isSelecting={isSelecting}
      isChecked={selectedIds?.has(note.id) ?? false}
      onToggleChecked={onToggleSelected}
      onOpen={onOpen}
      onTogglePin={onTogglePin}
      onToggleFavorite={onToggleFavorite}
      onToggleArchive={onToggleArchive}
      onMove={onMove}
      onRequestMove={onRequestMove}
      onRequestDelete={onRequestDelete}
    />
  );
};

const StaticNoteList = (props: NoteListProps) => {
  const { notes, isSelecting = false } = props;

  return (
    <div
      className={`note-list${isSelecting ? " is-selecting" : ""}`}
      data-note-panel
    >
      {notes.map((note) => renderNoteCard(note, props))}
    </div>
  );
};

const VirtualNoteList = (props: NoteListProps) => {
  const { notes, isSelecting = false } = props;
  const { containerRef, columns, visibleRows, totalHeight, measureRow } =
    useVirtualNoteGrid(notes, DEFAULT_NOTE_ROW_HEIGHT);

  return (
    <div
      ref={containerRef}
      className={`note-list is-virtualized${
        isSelecting ? " is-selecting" : ""
      }`}
      data-note-panel
      style={{
        height: totalHeight + (isSelecting ? NOTE_SELECTION_BAR_SPACE : 0),
      }}
    >
      {visibleRows.map(({ index, items, start }) => (
        <div
          key={items.map((note) => note.id).join("|")}
          ref={measureRow}
          className="note-list-row"
          data-index={String(index)}
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            transform: `translateY(${start}px)`,
          }}
        >
          {items.map((note) => renderNoteCard(note, props))}
        </div>
      ))}
    </div>
  );
};

export const NoteList = (props: NoteListProps) => {
  const { t } = useTranslation();
  const {
    notes,
    emptyMessage,
    emptyIcon = "note_stack",
    isSelecting = false,
  } = props;

  if (notes.length === 0) {
    return (
      <div
        className={`note-list${isSelecting ? " is-selecting" : ""}`}
        data-note-panel
      >
        <div className="empty-notes">
          <span className="material-symbols-rounded" aria-hidden="true">
            {emptyIcon}
          </span>
          <div className="text-headline-small">
            {emptyMessage ?? t("notes.noNotes")}
          </div>
        </div>
      </div>
    );
  }

  if (notes.length <= VIRTUALIZATION_THRESHOLD) {
    return <StaticNoteList {...props} />;
  }

  return <VirtualNoteList {...props} />;
};
