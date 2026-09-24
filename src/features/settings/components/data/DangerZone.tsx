import { useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ACTION_LABEL_KEYS,
  CONFIRM_WORD,
  blockEdit,
  type DeleteScope,
} from "@/features/settings/lib/dataLabels";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import { toast } from "@/shared/stores/useToastStore";
import { SettingsGroup, SettingsRow } from "../SettingsSection";

export const DangerZone = () => {
  const { t } = useTranslation();
  const notebooks = useNoteStore((state) => state.notebooks);
  const deleteAllNotes = useNoteStore((state) => state.deleteAllNotes);
  const deleteAllNotebooks = useNoteStore((state) => state.deleteAllNotebooks);
  const deleteAllData = useNoteStore((state) => state.deleteAllData);

  const [pending, setPending] = useState<DeleteScope | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const noteCount = notebooks.reduce(
    (total, notebook) => total + notebook.notes.length,
    0,
  );
  const notebookCount = notebooks.length;
  const canConfirm = pending !== null && confirmText.trim() === CONFIRM_WORD;

  useEffect(() => {
    if (pending) inputRef.current?.focus();
  }, [pending]);

  const start = (scope: DeleteScope) => {
    setConfirmText("");
    setPending(scope);
  };

  const cancel = () => {
    setPending(null);
    setConfirmText("");
  };

  const confirm = () => {
    if (!pending || !canConfirm) return;

    if (pending === "notes") {
      deleteAllNotes();
      toast.success(t("toasts.allNotesDeleted"));
    } else if (pending === "notebooks") {
      deleteAllNotebooks();
      toast.success(t("toasts.allNotebooksDeleted"));
    } else {
      deleteAllData();
      toast.success(t("toasts.allDataDeleted"));
    }

    cancel();
  };

  const describe = (scope: DeleteScope): string => {
    const notes = t("settings.data.noteCount", { count: noteCount });
    const books = t("settings.data.notebookCount", {
      count: notebookCount,
    });

    if (scope === "notes") {
      return t("settings.data.describeNotes", { notes, books });
    }
    if (scope === "notebooks") {
      return t("settings.data.describeNotebooks", { notes, books });
    }
    return t("settings.data.describeAll", { notes, books });
  };

  return (
    <>
      <SettingsGroup title={t("settings.data.dangerGroup")}>
        <SettingsRow
          title={t("settings.data.deleteNotesTitle")}
          description={t("settings.data.deleteNotesDesc")}
        >
          <button
            className="btn fill danger"
            type="button"
            disabled={noteCount === 0}
            onClick={() => start("notes")}
          >
            <span className="text-label-large">
              {t("settings.data.deleteNotesAction")}
            </span>
            <div className="state-layer" />
          </button>
        </SettingsRow>

        <SettingsRow
          title={t("settings.data.deleteNotebooksTitle")}
          description={t("settings.data.deleteNotebooksDesc")}
        >
          <button
            className="btn fill danger"
            type="button"
            disabled={notebookCount === 0}
            onClick={() => start("notebooks")}
          >
            <span className="text-label-large">
              {t("settings.data.deleteNotebooksAction")}
            </span>
            <div className="state-layer" />
          </button>
        </SettingsRow>

        <SettingsRow
          title={t("settings.data.deleteDataTitle")}
          description={t("settings.data.deleteDataDesc")}
        >
          <button
            className="btn fill danger"
            type="button"
            disabled={notebookCount === 0 && noteCount === 0}
            onClick={() => start("all")}
          >
            <span className="text-label-large">
              {t("settings.data.deleteDataAction")}
            </span>
            <div className="state-layer" />
          </button>
        </SettingsRow>
      </SettingsGroup>

      <div
        className="settings-danger-confirm"
        role="group"
        aria-labelledby="danger-confirm-title"
        onKeyDown={(event) => {
          if (pending && event.key === "Escape") {
            event.stopPropagation();
            cancel();
          }
        }}
      >
        <div className="settings-confirm-header">
          <span
            className="material-symbols-rounded settings-confirm-icon"
            aria-hidden="true"
          >
            warning
          </span>
          <h4 id="danger-confirm-title" className="text-title-small">
            {pending
              ? `${t(ACTION_LABEL_KEYS[pending])}?`
              : t("settings.data.confirmDeletion")}
          </h4>
        </div>
        <p className="text-body-small">
          {pending ? describe(pending) : t("settings.data.chooseAction")}
        </p>

        <label
          className="settings-confirm-label text-body-small"
          htmlFor="danger-confirm-input"
        >
          <Trans
            i18nKey="settings.data.typeToConfirm"
            components={{ strong: <strong /> }}
          />
        </label>
        <input
          ref={inputRef}
          id="danger-confirm-input"
          className="settings-confirm-input"
          value={confirmText}
          disabled={!pending}
          spellCheck={false}
          autoComplete="off"
          placeholder={CONFIRM_WORD}
          onCopy={blockEdit}
          onCut={blockEdit}
          onPaste={blockEdit}
          onDrop={blockEdit}
          onContextMenu={blockEdit}
          onChange={(event) => setConfirmText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") confirm();
          }}
        />

        <div className="settings-confirm-actions">
          <button
            className="btn text"
            type="button"
            disabled={!pending}
            onClick={cancel}
          >
            <span className="text-label-large">{t("common.cancel")}</span>
            <div className="state-layer" />
          </button>
          <button
            className="btn fill danger"
            type="button"
            disabled={!canConfirm}
            onClick={confirm}
          >
            <span className="text-label-large">{t("common.delete")}</span>
            <div className="state-layer" />
          </button>
        </div>

        {!pending && (
          <div className="settings-confirm-lock" aria-hidden="true">
            <span className="material-symbols-rounded settings-confirm-lock-icon">
              lock
            </span>
          </div>
        )}
      </div>
    </>
  );
};
