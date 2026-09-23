import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNoteStore } from "../store/useNoteStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { toast } from "../store/useToastStore";
import { useRelativeTime } from "../hooks/useRelativeTime";
import { trashRetentionMs } from "../utils";
import { ConfirmModal } from "./ConfirmModal";
import { IconButton } from "./IconButton";

type TrashEntry =
  | {
      kind: "notebook";
      id: string;
      name: string;
      noteCount: number;
      deletedAt: number;
    }
  | {
      kind: "note";
      id: string;
      notebookId: string;
      title: string;
      deletedAt: number;
    };

type PendingAction =
  | { kind: "notebook"; id: string; title: string }
  | { kind: "note"; notebookId: string; id: string; title: string }
  | { kind: "empty" };

export const TrashView = () => {
  const { t } = useTranslation();
  const relativeTime = useRelativeTime();
  const notebooks = useNoteStore((state) => state.notebooks);
  const restoreNote = useNoteStore((state) => state.restoreNote);
  const permanentlyDeleteNote = useNoteStore(
    (state) => state.permanentlyDeleteNote,
  );
  const restoreNotebook = useNoteStore((state) => state.restoreNotebook);
  const permanentlyDeleteNotebook = useNoteStore(
    (state) => state.permanentlyDeleteNotebook,
  );
  const emptyTrash = useNoteStore((state) => state.emptyTrash);
  const purgeExpiredTrash = useNoteStore((state) => state.purgeExpiredTrash);

  const retentionDays = useSettingsStore((state) => state.trash.retentionDays);

  const [pending, setPending] = useState<PendingAction | null>(null);

  useEffect(() => {
    purgeExpiredTrash(trashRetentionMs(retentionDays));
  }, [retentionDays, purgeExpiredTrash]);

  const entries = useMemo<TrashEntry[]>(() => {
    const trashedNotebooks: TrashEntry[] = notebooks
      .filter((notebook) => notebook.deletedAt !== null)
      .map((notebook) => ({
        kind: "notebook" as const,
        id: notebook.id,
        name: notebook.name,
        noteCount: notebook.notes.length,
        deletedAt: notebook.deletedAt as number,
      }));

    const trashedNotes: TrashEntry[] = notebooks
      .filter((notebook) => notebook.deletedAt === null)
      .flatMap((notebook) =>
        notebook.notes
          .filter((note) => note.deletedAt !== null)
          .map((note) => ({
            kind: "note" as const,
            id: note.id,
            notebookId: notebook.id,
            title: note.title,
            deletedAt: note.deletedAt as number,
          })),
      );

    return [...trashedNotebooks, ...trashedNotes].sort(
      (a, b) => b.deletedAt - a.deletedAt,
    );
  }, [notebooks]);

  const retentionLabel =
    retentionDays === null
      ? t("trash.retentionNever")
      : t("trash.retentionDays", { days: retentionDays });

  const confirmTitle = (() => {
    if (!pending) return "";
    if (pending.kind === "empty") return t("trash.everything");
    return pending.title || t("common.untitled");
  })();

  const handleConfirm = (isConfirm: boolean) => {
    if (!pending || !isConfirm) {
      setPending(null);
      return;
    }

    if (pending.kind === "notebook") {
      permanentlyDeleteNotebook(pending.id);
      toast.success(t("toasts.notebookPermanentlyDeleted"));
    } else if (pending.kind === "note") {
      permanentlyDeleteNote(pending.notebookId, pending.id);
      toast.success(t("toasts.notePermanentlyDeleted"));
    } else {
      emptyTrash();
      toast.success(t("toasts.trashEmptied"));
    }

    setPending(null);
  };

  return (
    <div className="trash-view" data-note-panel>
      <div className="trash-header">
        <div>
          <h2 className="title text-title-medium">{t("trash.title")}</h2>
          <p className="trash-retention text-body-small">{retentionLabel}</p>
        </div>
        <button
          className="btn text"
          type="button"
          disabled={entries.length === 0}
          onClick={() => setPending({ kind: "empty" })}
        >
          <span className="text-label-large">{t("trash.emptyTrash")}</span>
          <div className="state-layer" />
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="empty-notes">
          <span className="material-symbols-rounded" aria-hidden="true">
            delete
          </span>
          <div className="text-headline-small">{t("trash.empty")}</div>
        </div>
      ) : (
        <ul className="trash-list">
          {entries.map((entry) => {
            const isNotebook = entry.kind === "notebook";
            const title = isNotebook
              ? entry.name
              : entry.title || t("common.untitled");
            const meta = isNotebook
              ? `${t("sidebar.noteCount", {
                  count: entry.noteCount,
                })} · ${t("trash.deleted", {
                  time: relativeTime(entry.deletedAt),
                })}`
              : t("trash.deleted", {
                  time: relativeTime(entry.deletedAt),
                });

            return (
              <li key={`${entry.kind}-${entry.id}`} className="trash-item">
                <span
                  className="material-symbols-rounded trash-item-icon"
                  aria-hidden="true"
                >
                  {isNotebook ? "folder" : "description"}
                </span>

                <div className="trash-item-text">
                  <span className="text-body-medium">{title}</span>
                  <span className="trash-item-meta text-body-small">
                    {meta}
                  </span>
                </div>

                <div className="trash-item-actions">
                  <IconButton
                    icon="settings_backup_restore"
                    size="small"
                    tooltip={t("trash.restore")}
                    label={t("trash.restoreTitle", { title })}
                    onClick={() => {
                      if (entry.kind === "notebook") {
                        restoreNotebook(entry.id);
                      } else {
                        restoreNote(entry.id);
                      }
                      toast.success(
                        isNotebook
                          ? t("toasts.notebookRestored")
                          : t("toasts.noteRestored"),
                      );
                    }}
                  />
                  <IconButton
                    icon="delete_forever"
                    size="small"
                    tooltip={t("trash.deletePermanently")}
                    label={t("trash.deleteTitle", { title })}
                    onClick={() =>
                      setPending(
                        entry.kind === "notebook"
                          ? { kind: "notebook", id: entry.id, title }
                          : {
                              kind: "note",
                              notebookId: entry.notebookId,
                              id: entry.id,
                              title,
                            },
                      )
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pending && (
        <ConfirmModal title={confirmTitle} onConfirm={handleConfirm} />
      )}
    </div>
  );
};
