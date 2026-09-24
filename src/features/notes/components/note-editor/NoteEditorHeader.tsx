import { useTranslation } from "react-i18next";
import type { Notebook } from "@/shared/types";
import { MaterialIcon } from "@/shared/ui/MaterialIcon";

interface NoteEditorHeaderProps {
  notebooks: Notebook[];
  notebookValue: string;
  onNotebookChange: (notebookId: string) => void;
  favorite: boolean;
  onToggleFavorite: () => void;
  isModal: boolean;
  isFullscreen: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onClose: () => void;
}

/** Notebook picker and the editor's action buttons. */
export const NoteEditorHeader = ({
  notebooks,
  notebookValue,
  onNotebookChange,
  favorite,
  onToggleFavorite,
  isModal,
  isFullscreen,
  isExpanded,
  onToggleExpanded,
  copied,
  onCopy,
  onDownload,
  onClose,
}: NoteEditorHeaderProps) => {
  const { t } = useTranslation();

  return (
    <div className="note-top">
      <label className="note-notebook" title={t("editor.moveToNotebookTitle")}>
        <MaterialIcon name="folder" />
        <select
          aria-label={t("editor.notebookLabel")}
          value={notebookValue}
          onChange={(event) => onNotebookChange(event.target.value)}
        >
          {notebooks.map((notebook) => (
            <option key={notebook.id} value={notebook.id}>
              {notebook.name}
            </option>
          ))}
        </select>
        <MaterialIcon name="expand_more" className="note-chevron" />
      </label>

      <div className="note-actions">
        <button
          type="button"
          className="note-icon-btn"
          aria-pressed={favorite}
          aria-label={
            favorite ? t("editor.favoriteRemove") : t("editor.favoriteAdd")
          }
          title={
            favorite ? t("editor.favoriteRemove") : t("editor.favoriteAdd")
          }
          onClick={onToggleFavorite}
        >
          <svg className="note-fav" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
          </svg>
        </button>
        {isModal && !isFullscreen && (
          <button
            type="button"
            className="note-icon-btn note-expand"
            aria-label={isExpanded ? t("editor.collapse") : t("editor.expand")}
            title={
              isExpanded ? t("editor.collapseShort") : t("editor.expandShort")
            }
            onClick={onToggleExpanded}
          >
            <MaterialIcon
              name={isExpanded ? "close_fullscreen" : "open_in_full"}
            />
          </button>
        )}
        <button
          type="button"
          className={`note-icon-btn${copied ? " is-copied" : ""}`}
          aria-label={copied ? t("editor.copied") : t("editor.copyNote")}
          title={copied ? t("editor.copied") : t("editor.copyNote")}
          onClick={onCopy}
        >
          <MaterialIcon name={copied ? "check" : "content_copy"} />
        </button>
        <button
          type="button"
          className="note-icon-btn"
          aria-label={t("editor.downloadMarkdown")}
          title={t("editor.downloadMarkdown")}
          onClick={onDownload}
        >
          <MaterialIcon name="download" />
        </button>
        <span className="note-sep" aria-hidden="true" />
        <button
          type="button"
          className="note-icon-btn"
          aria-label={isModal ? t("common.close") : t("editor.closePane")}
          title={isModal ? t("editor.closeTitle") : t("editor.closePane")}
          onClick={onClose}
        >
          <MaterialIcon name="close" />
        </button>
      </div>
    </div>
  );
};
