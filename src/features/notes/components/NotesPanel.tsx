import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Note } from "@/shared/types";
import { IconButton } from "@/shared/ui/IconButton";
import { useNoteSelection } from "../hooks/useNoteSelection";
import type { NoteListHandlers, NoteWithMoveFlags } from "../types";
import { NoteList } from "./NoteList";
import { NoteSelectionBar } from "./NoteSelectionBar";

interface NotesPanelProps extends NoteListHandlers {
  title: string;
  notes: NoteWithMoveFlags[];
  onArchiveSelected?: (notes: Note[]) => void;
  selectionDisabled?: boolean;
  canMoveToNotebook: boolean;
  notebookNames?: Record<string, string>;
  emptyMessage?: string;
  emptyIcon?: string;
  selectedNoteId?: string | null;
  children?: ReactNode;
}

/**
 * Panel heading plus the note list, shared by the All/Pinned/Favorites/Recent
 * views and the active notebook. Owns multi-select so any list can archive
 * several notes at once.
 */
export const NotesPanel = ({
  title,
  notes,
  onArchiveSelected,
  selectionDisabled = false,
  children,
  ...listProps
}: NotesPanelProps) => {
  const { t } = useTranslation();
  const selection = useNoteSelection(notes);
  const isSelecting = selection.isSelecting && !selectionDisabled;

  const archiveSelected = () => {
    if (!onArchiveSelected || selection.selectedNotes.length === 0) return;
    onArchiveSelected(selection.selectedNotes);
    selection.cancelSelection();
  };

  return (
    <>
      <div className="notes-panel-header">
        <h2 className="title text-title-medium" data-note-panel-title>
          {title}
        </h2>
        {notes.length > 0 && onArchiveSelected && !isSelecting && (
          <IconButton
            icon="checklist"
            size="small"
            tooltip={t("selection.start")}
            label={t("selection.start")}
            disabled={selectionDisabled}
            onClick={selection.startSelecting}
          />
        )}
      </div>

      {children}

      {isSelecting && (
        <NoteSelectionBar
          selectedCount={selection.selectedNotes.length}
          allSelected={selection.allSelected}
          actionLabel={t("selection.archive")}
          actionIcon="archive"
          onAction={archiveSelected}
          onToggleAll={
            selection.allSelected
              ? selection.clearSelection
              : selection.selectAll
          }
          onClose={selection.cancelSelection}
        />
      )}

      <NoteList
        {...listProps}
        notes={notes}
        isSelecting={isSelecting}
        selectedIds={selection.selectedIds}
        onToggleSelected={selection.toggleSelected}
      />
    </>
  );
};
