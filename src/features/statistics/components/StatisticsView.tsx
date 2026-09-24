import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import type { Note } from "@/shared/types";
import { MaterialIcon } from "@/shared/ui/MaterialIcon";
import { formatAverage, formatNumber } from "../lib/format";
import { computeLibraryStats } from "../lib/stats";
import { NotebookBars } from "./NotebookBars";
import { PinnedFavoritesCard } from "./PinnedFavoritesCard";
import { RecentCard } from "./RecentCard";
import { StatCard } from "./StatCard";
import { StorageCard } from "./StorageCard";
import { WeekChart } from "./WeekChart";

interface StatisticsViewProps {
  onOpenNote: (note: Note) => void;
  onNewNote: () => void;
}

export const StatisticsView = ({
  onOpenNote,
  onNewNote,
}: StatisticsViewProps) => {
  const { t, i18n } = useTranslation();
  const notebooks = useNoteStore((state) => state.notebooks);
  const activeNotebookId = useNoteStore((state) => state.activeNotebookId);

  const locale = i18n.language;

  const stats = useMemo(
    () => computeLibraryStats({ notebooks, activeNotebookId }),
    [notebooks, activeNotebookId],
  );

  const notebookNames = useMemo(() => {
    const names: Record<string, string> = {};
    notebooks
      .filter((notebook) => notebook.deletedAt === null)
      .forEach((notebook) => {
        names[notebook.id] = notebook.name;
      });
    return names;
  }, [notebooks]);

  if (stats.noteCount === 0) {
    return (
      <div className="stats-view" data-note-panel>
        <h2 className="title text-title-medium">{t("stats.title")}</h2>
        <div className="empty-notes">
          <MaterialIcon name="insights" />
          <div className="text-headline-small">{t("stats.noNotesYet")}</div>
          <p className="text-body-small">{t("stats.noNotesHint")}</p>
          <button
            className="btn fill"
            type="button"
            disabled={stats.notebookCount === 0}
            onClick={onNewNote}
          >
            <span className="text-label-large">{t("stats.newNote")}</span>
            <div className="state-layer" />
          </button>
        </div>
      </div>
    );
  }

  const recent = [
    {
      tag: t("stats.lastEdited"),
      note: stats.lastUpdated,
      time: stats.lastUpdated?.updatedOn,
    },
    {
      tag: t("stats.lastCreated"),
      note: stats.lastCreated,
      time: stats.lastCreated?.postedOn,
    },
  ];

  return (
    <div className="stats-view" data-note-panel>
      <h2 className="title text-title-medium">{t("stats.title")}</h2>

      <div className="stats-layout">
        <WeekChart
          activity={stats.weekActivity}
          created={stats.weekCreated}
          edited={stats.weekEdited}
        />

        <StatCard span={4} emphasized title={t("stats.totalWriting")}>
          <span className="stats-big-number text-display-small">
            {formatNumber(stats.totalWords, locale)}
          </span>
          <span className="stats-big-caption text-body-medium">
            {t("stats.words")}
          </span>
          <dl className="stats-rows">
            <div className="stats-row">
              <dt className="text-body-small">{t("stats.characters")}</dt>
              <dd className="text-body-medium">
                {formatNumber(stats.totalChars, locale)}
              </dd>
            </div>
            <div className="stats-row">
              <dt className="text-body-small">{t("stats.avgWordsPerNote")}</dt>
              <dd className="text-body-medium">
                {formatAverage(stats.wordsPerNote, locale)}
              </dd>
            </div>
          </dl>
        </StatCard>

        <NotebookBars
          notebookStats={stats.notebookStats}
          activeNotebookId={activeNotebookId}
          noteCount={stats.noteCount}
          emptyNotebooks={stats.emptyNotebooks}
        />

        <PinnedFavoritesCard
          pinnedCount={stats.pinnedCount}
          favoriteCount={stats.favoriteCount}
        />

        <RecentCard
          recent={recent}
          notebookNames={notebookNames}
          onOpenNote={onOpenNote}
        />

        <StorageCard />
      </div>
    </div>
  );
};
