import { useTranslation } from "react-i18next";
import { formatNumber } from "../lib/format";
import type { NotebookStat } from "../lib/stats";
import { StatCard } from "./StatCard";

interface NotebookBarsProps {
  notebookStats: NotebookStat[];
  activeNotebookId: string | null;
  noteCount: number;
  emptyNotebooks: string[];
}

export const NotebookBars = ({
  notebookStats,
  activeNotebookId,
  noteCount,
  emptyNotebooks,
}: NotebookBarsProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const maxNotebook = Math.max(
    1,
    ...notebookStats.map((notebook) => notebook.count),
  );

  const formatEmptyNotebooks = (names: string[]): string => {
    const shown = names.slice(0, 3);
    const remaining = names.length - shown.length;
    const list =
      remaining > 0
        ? t("stats.emptyMore", { list: shown.join(", "), count: remaining })
        : shown.join(", ");
    return names.length === 1
      ? t("stats.emptyOne", { list })
      : t("stats.emptyOther", { count: names.length, list });
  };

  return (
    <StatCard span={7} title={t("stats.whereNotesLive")}>
      <p className="stats-card-subtitle text-body-small">
        {t("stats.notesAcross", {
          notes: formatNumber(noteCount, locale),
          notebooks: formatNumber(notebookStats.length, locale),
        })}
      </p>

      <ul className="notebook-bars">
        {notebookStats.map((notebook) => (
          <li key={notebook.id} className="notebook-bar">
            <span className="notebook-bar-name">
              <span className="notebook-bar-label text-body-medium">
                {notebook.name}
              </span>
              {notebook.id === activeNotebookId && (
                <span className="notebook-current text-label-small">
                  {t("stats.current")}
                </span>
              )}
            </span>
            <span className="notebook-bar-track" aria-hidden="true">
              <span
                className="notebook-bar-fill"
                style={{
                  width: `${Math.round((notebook.count / maxNotebook) * 100)}%`,
                }}
              />
            </span>
            <span className="notebook-bar-count text-body-medium">
              {notebook.count}
            </span>
          </li>
        ))}
      </ul>

      {emptyNotebooks.length > 0 && (
        <p className="stats-card-footnote text-body-small">
          {formatEmptyNotebooks(emptyNotebooks)}
        </p>
      )}
    </StatCard>
  );
};
