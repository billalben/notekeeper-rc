import { useTranslation } from "react-i18next";
import { useRelativeTime } from "@/shared/hooks/useRelativeTime";
import { formatChord } from "@/shared/lib/shortcuts";
import type { AutoSaveStatus } from "../../hooks/useAutoSave";

interface NoteEditorFooterProps {
  dirty: boolean;
  status: AutoSaveStatus;
  autosave: boolean;
  isSavable: boolean;
  wordCount: number;
  showWordCount: boolean;
  postedOn?: number;
  savedAt: number | null;
  showEdited: boolean;
  saveChord: string;
  onDiscard: () => void;
  onSave: () => void;
}

/** Save status, timestamps, and the discard/save actions. */
export const NoteEditorFooter = ({
  dirty,
  status,
  autosave,
  isSavable,
  wordCount,
  showWordCount,
  postedOn,
  savedAt,
  showEdited,
  saveChord,
  onDiscard,
  onSave,
}: NoteEditorFooterProps) => {
  const { t } = useTranslation();
  const relativeTime = useRelativeTime();

  const statusLabel = dirty
    ? autosave && status === "saving"
      ? t("editor.statusSaving")
      : t("editor.statusDirty")
    : t("editor.statusSaved");

  return (
    <div className="note-foot">
      <div className="note-meta">
        <span
          className={`note-status${dirty ? " is-dirty" : ""}`}
          role="status"
          aria-live="polite"
        >
          {statusLabel}
        </span>
        {postedOn !== undefined && (
          <span className="note-created">
            {t("editor.createdRelative", { time: relativeTime(postedOn) })}
          </span>
        )}
        {showEdited && savedAt !== null && (
          <span className="note-updated">
            {t("editor.editedRelative", { time: relativeTime(savedAt) })}
          </span>
        )}
        {showWordCount && (
          <span>{t("editor.wordCount", { count: wordCount })}</span>
        )}
      </div>

      <div className="note-foot-actions">
        {!autosave && dirty && (
          <button
            type="button"
            className="note-btn is-ghost"
            onClick={onDiscard}
          >
            {t("editor.discard")}
          </button>
        )}
        {!autosave && (
          <button
            type="button"
            className="note-btn is-primary"
            disabled={!dirty || !isSavable}
            onClick={onSave}
          >
            {t("editor.save")}
            <kbd>{formatChord(saveChord)}</kbd>
          </button>
        )}
      </div>
    </div>
  );
};
