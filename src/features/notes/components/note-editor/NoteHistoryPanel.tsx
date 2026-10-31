import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { NoteRevision } from "@/shared/types";
import { useRelativeTime } from "@/shared/hooks/useRelativeTime";
import { MarkdownContent } from "@/shared/markdown/MarkdownContent";
import { MaterialIcon } from "@/shared/ui/MaterialIcon";

interface NoteHistoryPanelProps {
  revisions: NoteRevision[];
  onRestore: (revision: NoteRevision) => void;
  onClose: () => void;
}

/** Versions of the open note, newest first, with a read-only preview. */
export const NoteHistoryPanel = ({
  revisions,
  onRestore,
  onClose,
}: NoteHistoryPanelProps) => {
  const { t, i18n } = useTranslation();
  const relativeTime = useRelativeTime();
  const newest = revisions[revisions.length - 1] ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(
    newest?.id ?? null,
  );
  const selected =
    revisions.find((revision) => revision.id === selectedId) ?? newest;

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <section className="note-history" aria-label={t("history.title")}>
      <div className="note-history-head">
        <div>
          <h3 className="text-title-medium">{t("history.title")}</h3>
          <p className="note-history-description text-body-small">
            {t("history.description")}
          </p>
        </div>
        <div className="note-history-head-actions">
          <span className="note-history-count text-label-large">
            {t("history.versionCount", { count: revisions.length })}
          </span>
          <button
            type="button"
            className="note-icon-btn"
            aria-label={t("history.close")}
            title={t("history.close")}
            onClick={onClose}
          >
            <MaterialIcon name="close" />
          </button>
        </div>
      </div>

      {revisions.length === 0 ? (
        <div className="note-history-empty">
          <MaterialIcon name="history" />
          <div className="text-title-medium">{t("history.empty")}</div>
          <p className="text-body-small">{t("history.emptyDescription")}</p>
        </div>
      ) : (
        <div className="note-history-layout">
          <ul
            className="note-history-list custom-scrollbar"
            aria-label={t("history.versions")}
          >
            {[...revisions].reverse().map((revision) => {
              const isSelected = revision.id === selected?.id;
              return (
                <li key={revision.id}>
                  <button
                    type="button"
                    className={`note-history-item${
                      isSelected ? " is-selected" : ""
                    }`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedId(revision.id)}
                  >
                    <span className="note-history-item-time text-label-large">
                      {dateFormatter.format(revision.createdAt)}
                    </span>
                    <span className="note-history-item-relative text-body-small">
                      {relativeTime(revision.createdAt)}
                    </span>
                    <span className="note-history-item-title text-body-medium">
                      {revision.title || t("common.untitled")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {selected && (
            <div className="note-history-preview custom-scrollbar">
              <div className="note-history-preview-head">
                <span className="text-label-large">
                  {dateFormatter.format(selected.createdAt)}
                </span>
                <button
                  type="button"
                  className="note-btn is-primary"
                  onClick={() => onRestore(selected)}
                >
                  {t("history.restore")}
                </button>
              </div>
              <h4 className="note-history-preview-title text-title-medium">
                {selected.title || t("common.untitled")}
              </h4>
              {selected.tags.length > 0 && (
                <div className="note-history-preview-tags">
                  {selected.tags.map((tag) => (
                    <span key={tag} className="tag-chip">
                      <span className="text-label-large">#{tag}</span>
                    </span>
                  ))}
                </div>
              )}
              {selected.text.trim() ? (
                <MarkdownContent
                  text={selected.text}
                  className="markdown-body"
                />
              ) : (
                <p className="note-history-preview-empty text-body-small">
                  {t("history.emptyBody")}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
