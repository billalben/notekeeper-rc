import { useEffect, useRef, useState } from "react";
import { useNoteStore } from "../../store/useNoteStore";
import {
  useSettingsStore,
  type ExportFormat,
} from "../../store/useSettingsStore";
import { toast } from "../../store/useToastStore";
import { TRASH_RETENTION_OPTIONS } from "../../utils";
import {
  downloadBackupFile,
  downloadNotebookFile,
} from "../../utils/export";
import {
  ComingSoon,
  SettingsGroup,
  SettingsRow,
  SettingsSelect,
} from "./SettingsSection";
import { StorageMeter } from "./StorageMeter";

type DeleteScope = "notes" | "notebooks" | "all";

const CONFIRM_WORD = "DELETE";

const blockEdit = (event: { preventDefault: () => void }) =>
  event.preventDefault();

const ACTION_LABELS: Record<DeleteScope, string> = {
  notes: "Delete all notes",
  notebooks: "Delete all notebooks",
  all: "Delete all data",
};

export const SettingsData = () => {
  const notebooks = useNoteStore((state) => state.notebooks);
  const tags = useNoteStore((state) => state.tags);
  const deleteAllNotes = useNoteStore((state) => state.deleteAllNotes);
  const deleteAllNotebooks = useNoteStore((state) => state.deleteAllNotebooks);
  const deleteAllData = useNoteStore((state) => state.deleteAllData);

  const retentionDays = useSettingsStore((state) => state.trash.retentionDays);
  const setTrashSettings = useSettingsStore(
    (state) => state.setTrashSettings,
  );
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
      toast.success("All notes deleted");
    } else if (pending === "notebooks") {
      deleteAllNotebooks();
      toast.success("All notebooks deleted");
    } else {
      deleteAllData();
      toast.success("All data deleted");
    }

    cancel();
  };

  const exportAll = () => {
    if (visibleNotebooks.length === 0) return;

    try {
      downloadBackupFile(notebooks, tags);
    } catch {
      toast.error("Couldn't export your data");
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
      toast.error("Couldn't export the notebook");
    }
  };

  const describe = (scope: DeleteScope): string => {
    const notes = `${noteCount} note${noteCount === 1 ? "" : "s"}`;
    const books = `${notebookCount} notebook${
      notebookCount === 1 ? "" : "s"
    }`;

    if (scope === "notes") {
      return `Permanently delete ${notes} from ${books}. Your notebooks will remain, but this cannot be undone.`;
    }
    if (scope === "notebooks") {
      return `Permanently delete ${books} and all ${notes} inside them. This cannot be undone.`;
    }
    return `Permanently delete ${books} and ${notes}. This cannot be undone.`;
  };

  return (
    <>
      <SettingsGroup title="Backup">
        <SettingsRow
          title="Default export format"
          description="Used when downloading a note or a notebook from the app."
        >
          <SettingsSelect
            label="Default export format"
            value={exportFormat}
            options={[
              { value: "json", label: "JSON" },
              { value: "md", label: "Markdown" },
            ]}
            onChange={(value) =>
              setExportSettings({ defaultFormat: value as ExportFormat })
            }
          />
        </SettingsRow>
        <SettingsRow
          title="Export all data"
          description="Download every notebook and note as a versioned JSON backup."
        >
          <button
            className="btn fill"
            type="button"
            disabled={visibleNotebooks.length === 0}
            onClick={exportAll}
          >
            <span className="text-label-large">Export all</span>
            <div className="state-layer" />
          </button>
        </SettingsRow>
        <SettingsRow
          title="Export a notebook"
          description={`Download a single notebook as ${
            exportFormat === "md" ? "Markdown" : "JSON"
          }.`}
        >
          <div className="settings-export-controls">
            <SettingsSelect
              label="Notebook to export"
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
              <span className="text-label-large">Export</span>
              <div className="state-layer" />
            </button>
          </div>
        </SettingsRow>
        <SettingsRow
          title="Import notes"
          description="Restore notes from a previously exported file."
        >
          <ComingSoon />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Storage">
        <StorageMeter />
      </SettingsGroup>

      <SettingsGroup title="Trash">
        <SettingsRow
          title="Keep deleted items for"
          description={
            trashedCount > 0
              ? `${trashedCount} item${
                  trashedCount === 1 ? "" : "s"
                } currently in Trash. Deleted notes and notebooks move to Trash first.`
              : "Deleted notes and notebooks move to Trash before being removed."
          }
        >
          <SettingsSelect
            label="Trash retention"
            value={retentionDays === null ? "forever" : String(retentionDays)}
            options={TRASH_RETENTION_OPTIONS.map((option) => ({
              value: option.value === null ? "forever" : String(option.value),
              label: option.label,
            }))}
            onChange={(value) =>
              setTrashSettings({
                retentionDays: value === "forever" ? null : Number(value),
              })
            }
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Danger zone">
        <SettingsRow
          title="Delete all notes"
          description="Remove every note but keep your notebooks."
        >
          <button
            className="btn fill danger"
            type="button"
            disabled={noteCount === 0}
            onClick={() => start("notes")}
          >
            <span className="text-label-large">Delete all notes</span>
            <div className="state-layer" />
          </button>
        </SettingsRow>

        <SettingsRow
          title="Delete all notebooks"
          description="Remove every notebook and all notes inside them."
        >
          <button
            className="btn fill danger"
            type="button"
            disabled={notebookCount === 0}
            onClick={() => start("notebooks")}
          >
            <span className="text-label-large">Delete all notebooks</span>
            <div className="state-layer" />
          </button>
        </SettingsRow>

        <SettingsRow
          title="Delete all data"
          description="Remove everything. This cannot be undone."
        >
          <button
            className="btn fill danger"
            type="button"
            disabled={notebookCount === 0 && noteCount === 0}
            onClick={() => start("all")}
          >
            <span className="text-label-large">Delete all data</span>
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
            {pending ? `${ACTION_LABELS[pending]}?` : "Confirm deletion"}
          </h4>
        </div>
        <p className="text-body-small">
          {pending
            ? describe(pending)
            : "Choose a delete action above, then type DELETE to confirm."}
        </p>

        <label
          className="settings-confirm-label text-body-small"
          htmlFor="danger-confirm-input"
        >
          Type <strong>{CONFIRM_WORD}</strong> to confirm
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
            <span className="text-label-large">Cancel</span>
            <div className="state-layer" />
          </button>
          <button
            className="btn fill danger"
            type="button"
            disabled={!canConfirm}
            onClick={confirm}
          >
            <span className="text-label-large">Delete</span>
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
