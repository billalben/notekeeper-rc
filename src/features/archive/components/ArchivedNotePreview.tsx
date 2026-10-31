import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useActionHotkey } from "@/features/shortcuts/hooks/useActionHotkey";
import { useFocusTrap } from "@/shared/hooks/useFocusTrap";
import { useRelativeTime } from "@/shared/hooks/useRelativeTime";
import type { Note } from "@/shared/types";
import { MarkdownContent } from "@/shared/markdown/MarkdownContent";
import { IconButton } from "@/shared/ui/IconButton";

interface ArchivedNotePreviewProps {
  note: Note;
  notebookName?: string;
  onClose: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
  onDownload: () => void;
}

const isEdited = (note: Note): boolean => note.updatedOn !== note.postedOn;

/** Read-only presentation for an archived note. */
export const ArchivedNotePreview = ({
  note,
  notebookName,
  onClose,
  onUnarchive,
  onDelete,
  onDownload,
}: ArchivedNotePreviewProps) => {
  const { t } = useTranslation();
  const relativeTime = useRelativeTime();
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef);
  useActionHotkey("closeModal", onClose);

  return (
    <div
      className="archive-preview-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="archive-preview"
        role="dialog"
        aria-modal="true"
        aria-label={note.title || t("common.untitledNote")}
      >
        <div className="archive-preview-header">
          <span
            className="material-symbols-rounded archive-preview-icon"
            aria-hidden="true"
          >
            archive
          </span>
          <div className="archive-preview-heading">
            <h2 className="text-title-large">
              {note.title || t("common.untitledNote")}
            </h2>
            <p className="archive-preview-meta text-body-small">
              {[
                notebookName,
                note.archivedAt !== null
                  ? t("archive.archived", {
                      time: relativeTime(note.archivedAt),
                    })
                  : null,
                isEdited(note)
                  ? t("card.editedRelative", {
                      time: relativeTime(note.updatedOn),
                    })
                  : t("editor.createdRelative", {
                      time: relativeTime(note.postedOn),
                    }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <IconButton
            icon="close"
            label={t("common.close")}
            autoFocus
            onClick={onClose}
          />
        </div>

        {note.tags.length > 0 && (
          <div className="archive-preview-tags">
            {note.tags.map((tag) => (
              <span key={tag} className="tag-chip">
                <span className="text-label-large">#{tag}</span>
              </span>
            ))}
          </div>
        )}

        <div className="archive-preview-body custom-scrollbar">
          {note.text.trim() ? (
            <MarkdownContent
              text={note.text}
              className="markdown-body text-body-large"
            />
          ) : (
            <p className="archive-preview-empty text-body-medium">
              {t("archive.noContent")}
            </p>
          )}
        </div>

        <p className="archive-preview-hint text-body-small">
          {t("archive.readOnlyHint")}
        </p>

        <div className="archive-preview-actions">
          <button type="button" className="btn fill" onClick={onUnarchive}>
            <span className="material-symbols-rounded" aria-hidden="true">
              unarchive
            </span>
            <span className="text-label-large">{t("archive.unarchive")}</span>
            <div className="state-layer" />
          </button>
          <button type="button" className="btn text" onClick={onDownload}>
            <span className="material-symbols-rounded" aria-hidden="true">
              download
            </span>
            <span className="text-label-large">{t("archive.download")}</span>
            <div className="state-layer" />
          </button>
          <button type="button" className="btn text danger" onClick={onDelete}>
            <span className="material-symbols-rounded" aria-hidden="true">
              delete
            </span>
            <span className="text-label-large">{t("archive.delete")}</span>
            <div className="state-layer" />
          </button>
        </div>
      </div>
    </div>
  );
};
