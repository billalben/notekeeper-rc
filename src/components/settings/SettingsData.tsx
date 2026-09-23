import { useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useNoteStore } from "../../store/useNoteStore";
import {
  useSettingsStore,
  type ExportFormat,
} from "../../store/useSettingsStore";
import { toast } from "../../store/useToastStore";
import { TRASH_RETENTION_OPTIONS, type TrashRetentionDays } from "../../utils";
import { downloadBackupFile, downloadNotebookFile } from "../../utils/export";
import {
  ComingSoon,
  SettingsGroup,
  SettingsRow,
  SettingsSelect,
} from "./SettingsSection";
import { StorageMeter } from "./StorageMeter";

type DeleteScope = "notes" | "notebooks" | "all";

const CONFIRM_WORD = "DELETE";

type ActionLabelKey =
  | "settings.data.actionLabels.notes"
  | "settings.data.actionLabels.notebooks"
  | "settings.data.actionLabels.all";

const ACTION_LABEL_KEYS: Record<DeleteScope, ActionLabelKey> = {
  notes: "settings.data.actionLabels.notes",
  notebooks: "settings.data.actionLabels.notebooks",
  all: "settings.data.actionLabels.all",
};

type RetentionLabelKey =
  | "settings.data.retentionD7"
  | "settings.data.retentionD30"
  | "settings.data.retentionD90"
  | "settings.data.retentionForever";

const RETENTION_LABEL_KEYS: Record<string, RetentionLabelKey> = {
  "7": "settings.data.retentionD7",
  "30": "settings.data.retentionD30",
  "90": "settings.data.retentionD90",
  forever: "settings.data.retentionForever",
};

const retentionKey = (value: TrashRetentionDays): string =>
  value === null ? "forever" : String(value);

const blockEdit = (event: { preventDefault: () => void }) =>
  event.preventDefault();

export const SettingsData = () => {
  const { t } = useTranslation();
  const notebooks = useNoteStore((state) => state.notebooks);
  const tags = useNoteStore((state) => state.tags);
  const deleteAllNotes = useNoteStore((state) => state.deleteAllNotes);
  const deleteAllNotebooks = useNoteStore((state) => state.deleteAllNotebooks);
  const deleteAllData = useNoteStore((state) => state.deleteAllData);

  const retentionDays = useSettingsStore((state) => state.trash.retentionDays);
  const setTrashSettings = useSettingsStore((state) => state.setTrashSettings);
  const exportFormat = useSettingsStore((state) => state.export.defaultFormat);
  const setExportSettings = useSettingsStore(
    (state) => state.setExportSettings,
  );

  const [pending, setPending] = useState<DeleteScope | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [exportNotebookId, setExportNotebookId] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const visibleNotebooks = notebooks.filter(
    (notebook) => notebook.deletedAt === null,
  );
  const selectedExportId = visibleNotebooks.some(
    (notebook) => notebook.id === exportNotebookId,
  )
    ? exportNotebookId
    : (visibleNotebooks[0]?.id ?? "");

  const noteCount = notebooks.reduce(
    (total, notebook) => total + notebook.notes.length,
    0,
  );
  const notebookCount = notebooks.length;
  const trashedCount = notebooks.reduce(
    (total, notebook) =>
      total +
      (notebook.deletedAt !== null ? 1 : 0) +
      notebook.notes.filter((note) => note.deletedAt !== null).length,
    0,
  );
  const isActive = pending !== null;
  const canConfirm = isActive && confirmText.trim() === CONFIRM_WORD;

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

  const exportAll = () => {
    if (visibleNotebooks.length === 0) return;

    try {
      downloadBackupFile(notebooks, tags);
    } catch {
      toast.error(t("toasts.exportDataFailed"));
    }
  };

  const exportNotebook = () => {
    const notebook = visibleNotebooks.find(
      (item) => item.id === selectedExportId,
    );
    if (!notebook) return;

    try {
      downloadNotebookFile(notebook, exportFormat);
    } catch {
      toast.error(t("toasts.exportNotebookFailed"));
    }
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

  const trashKeepDescription =
    trashedCount > 0
      ? t("settings.data.trashKeepDesc", { count: trashedCount })
      : t("settings.data.trashKeepDescNone");

  return (
    <>
      <SettingsGroup title={t("settings.data.backupGroup")}>
        <SettingsRow
          title={t("settings.data.exportFormatTitle")}
          description={t("settings.data.exportFormatDesc")}
        >
          <SettingsSelect
            label={t("settings.data.exportFormatLabel")}
            value={exportFormat}
            options={[
              { value: "json", label: t("card.json") },
              { value: "md", label: t("card.markdown") },
            ]}
            onChange={(value) =>
              setExportSettings({ defaultFormat: value as ExportFormat })
            }
          />
        </SettingsRow>
        <SettingsRow
          title={t("settings.data.exportAllTitle")}
          description={t("settings.data.exportAllDesc")}
        >
          <button
            className="btn fill"
            type="button"
            disabled={visibleNotebooks.length === 0}
            onClick={exportAll}
          >
            <span className="text-label-large">
              {t("settings.data.exportAll")}
            </span>
            <div className="state-layer" />
          </button>
        </SettingsRow>
        <SettingsRow
          title={t("settings.data.exportNotebookTitle")}
          description={t("settings.data.exportNotebookDesc", {
            format: exportFormat === "md" ? t("card.markdown") : t("card.json"),
          })}
        >
          <div className="settings-export-controls">
            <SettingsSelect
              label={t("settings.data.notebookToExportLabel")}
              value={selectedExportId}
              disabled={visibleNotebooks.length === 0}
              options={visibleNotebooks.map((notebook) => ({
                value: notebook.id,
                label: notebook.name,
              }))}
              onChange={setExportNotebookId}
            />
            <button
              className="btn text"
              type="button"
              disabled={!selectedExportId}
              onClick={exportNotebook}
            >
              <span className="text-label-large">
                {t("settings.data.export")}
              </span>
              <div className="state-layer" />
            </button>
          </div>
        </SettingsRow>
        <SettingsRow
          title={t("settings.data.importTitle")}
          description={t("settings.data.importDesc")}
        >
          <ComingSoon />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title={t("settings.data.storageGroup")}>
        <StorageMeter />
      </SettingsGroup>

      <SettingsGroup title={t("settings.data.trashGroup")}>
        <SettingsRow
          title={t("settings.data.trashKeepTitle")}
          description={trashKeepDescription}
        >
          <SettingsSelect
            label={t("settings.data.trashRetentionLabel")}
            value={retentionKey(retentionDays)}
            options={TRASH_RETENTION_OPTIONS.map((option) => ({
              value: retentionKey(option),
              label: t(RETENTION_LABEL_KEYS[retentionKey(option)]),
            }))}
            onChange={(value) =>
              setTrashSettings({
                retentionDays: value === "forever" ? null : Number(value),
              })
            }
          />
        </SettingsRow>
      </SettingsGroup>

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
