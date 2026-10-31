import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNoteSelection } from "@/features/notes/hooks/useNoteSelection";
import { NoteList } from "@/features/notes/components/NoteList";
import { NoteSelectionBar } from "@/features/notes/components/NoteSelectionBar";
import type { NoteListHandlers } from "@/features/notes/types";
import { downloadNoteFile } from "@/shared/lib/export";
import { collectArchivedNotes, withoutMoveFlags } from "@/shared/lib/notes";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import { toast } from "@/shared/stores/useToastStore";
import type { Note } from "@/shared/types";
import { IconButton } from "@/shared/ui/IconButton";
import { MaterialIcon } from "@/shared/ui/MaterialIcon";
import { ArchivedNotePreview } from "./ArchivedNotePreview";

interface ArchiveViewProps {
  handlers: NoteListHandlers;
  onUnarchiveSelected: (notes: Note[]) => void;
}

/** Read-only list of archived notes plus bulk unarchive. */
export const ArchiveView = ({
  handlers,
  onUnarchiveSelected,
}: ArchiveViewProps) => {
  const { t } = useTranslation();
  const notebooks = useNoteStore((state) => state.notebooks);
  const exportFormat = useSettingsStore((state) => state.export.defaultFormat);

  const archivedNotes = useMemo(
    () => collectArchivedNotes(notebooks),
    [notebooks],
  );
  const archivedNoteList = useMemo(
    () => withoutMoveFlags(archivedNotes),
    [archivedNotes],
  );
  const notebookNames = useMemo(
    () =>
      Object.fromEntries(
        notebooks
          .filter((notebook) => notebook.deletedAt === null)
          .map((notebook) => [notebook.id, notebook.name]),
      ),
    [notebooks],
  );

  const selection = useNoteSelection(archivedNotes);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);

  const unarchiveSelected = () => {
    if (selection.selectedNotes.length === 0) return;
    onUnarchiveSelected(selection.selectedNotes);
    selection.cancelSelection();
  };

  const closePreview = () => setPreviewNote(null);

  const unarchivePreview = () => {
    if (!previewNote) return;
    handlers.onToggleArchive(previewNote);
    closePreview();
  };

  const deletePreview = () => {
    if (!previewNote) return;
    handlers.onRequestDelete(previewNote);
    closePreview();
  };

  const downloadPreview = () => {
    if (!previewNote) return;
    try {
      downloadNoteFile(
        previewNote,
        notebookNames[previewNote.notebookId] ?? null,
        exportFormat,
      );
    } catch {
      toast.error(t("toasts.exportNoteFailed"));
    }
  };

  return (
    <div className="archive-view" data-note-panel>
      <div className="archive-header">
        <div>
          <h2 className="title text-title-medium">{t("archive.title")}</h2>
          <p className="archive-description text-body-small">
            {t("archive.description")}
          </p>
        </div>
        {archivedNotes.length > 0 && !selection.isSelecting && (
          <IconButton
            icon="checklist"
            size="small"
            tooltip={t("selection.start")}
            label={t("selection.start")}
            onClick={selection.startSelecting}
          />
        )}
      </div>

      {selection.isSelecting && (
        <NoteSelectionBar
          selectedCount={selection.selectedNotes.length}
          allSelected={selection.allSelected}
          actionLabel={t("selection.unarchive")}
          actionIcon="unarchive"
          onAction={unarchiveSelected}
          onToggleAll={
            selection.allSelected
              ? selection.clearSelection
              : selection.selectAll
          }
          onClose={selection.cancelSelection}
        />
      )}

      {archivedNotes.length === 0 ? (
        <div className="empty-notes">
          <MaterialIcon name="archive" />
          <div className="text-headline-small">{t("archive.empty")}</div>
        </div>
      ) : (
        <NoteList
          notes={archivedNoteList}
          canMoveToNotebook={false}
          notebookNames={notebookNames}
          isSelecting={selection.isSelecting}
          selectedIds={selection.selectedIds}
          onToggleSelected={selection.toggleSelected}
          onOpen={setPreviewNote}
          onTogglePin={handlers.onTogglePin}
          onToggleFavorite={handlers.onToggleFavorite}
          onToggleArchive={handlers.onToggleArchive}
          onMove={handlers.onMove}
          onRequestMove={handlers.onRequestMove}
          onRequestDelete={handlers.onRequestDelete}
        />
      )}

      {previewNote && (
        <ArchivedNotePreview
          note={previewNote}
          notebookName={notebookNames[previewNote.notebookId]}
          onClose={closePreview}
          onUnarchive={unarchivePreview}
          onDelete={deletePreview}
          onDownload={downloadPreview}
        />
      )}
    </div>
  );
};
