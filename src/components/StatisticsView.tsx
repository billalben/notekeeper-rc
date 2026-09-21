import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNoteStore } from "../store/useNoteStore";
import { useUIStore } from "../store/useUIStore";
import type { Note } from "../types";
import { useRelativeTime } from "../hooks/useRelativeTime";
import { stripMarkdown } from "../utils/search";
import { computeLibraryStats, type DayActivity } from "../utils/stats";
import { formatBytes } from "../utils/storage";
import { useStorageUsage } from "../hooks/useStorageUsage";

interface StatisticsViewProps {
  onOpenNote: (note: Note) => void;
  onNewNote: () => void;
}

const formatNumber = (value: number, locale: string): string =>
  value.toLocaleString(locale);

const formatAverage = (value: number, locale: string): string =>
  Number.isInteger(value)
    ? value.toLocaleString(locale)
    : value.toLocaleString(locale, { maximumFractionDigits: 1 });

const notePreview = (note: Note): string => {
  const text = stripMarkdown(note.text).replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > 140 ? `${text.slice(0, 140).trimEnd()}…` : text;
};

interface WeekBarProps {
  value: number;
  max: number;
  variant: "created" | "edited";
}

const MAX_BAR_HEIGHT = 100;

const WeekBar = ({ value, max, variant }: WeekBarProps) => {
  const height = value > 0 ? Math.max(6, Math.round((value / max) * MAX_BAR_HEIGHT)) : 0;

  return (
    <div className="week-bar-slot">
      {value > 0 && (
        <span className="week-bar-count text-label-small">{value}</span>
      )}
      <div
        className={`week-bar ${variant}${value === 0 ? " empty" : ""}`}
        style={value > 0 ? { height: `${height}px` } : undefined}
      />
    </div>
  );
};

interface StatCardProps {
  span: 4 | 5 | 7 | 8 | 12;
  emphasized?: boolean;
  className?: string;
  title: string;
  children: ReactNode;
}

const StatCard = ({
  span,
  emphasized,
  className,
  title,
  children,
}: StatCardProps) => (
  <section
    className={`stats-card stats-span-${span}${emphasized ? " emphasized" : ""}${
      className ? ` ${className}` : ""
    }`}
  >
    <h3 className="stats-card-title text-title-small">{title}</h3>
    {children}
  </section>
);

export const StatisticsView = ({
  onOpenNote,
  onNewNote,
}: StatisticsViewProps) => {
  const { t, i18n } = useTranslation();
  const relativeTime = useRelativeTime();
  const notebooks = useNoteStore((state) => state.notebooks);
  const activeNotebookId = useNoteStore((state) => state.activeNotebookId);
  const openPinned = useUIStore((state) => state.openPinned);
  const openFavorites = useUIStore((state) => state.openFavorites);

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

  const { supported, bytes, quota, percent } = useStorageUsage();

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

  if (stats.noteCount === 0) {
    return (
      <div className="stats-view" data-note-panel>
        <h2 className="title text-title-medium">{t("stats.title")}</h2>
        <div className="empty-notes">
          <span className="material-symbols-rounded" aria-hidden="true">
            insights
          </span>
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

  const maxWeek = Math.max(
    1,
    ...stats.weekActivity.flatMap((day) => [day.created, day.edited]),
  );
  const maxNotebook = Math.max(
    1,
    ...stats.notebookStats.map((notebook) => notebook.count),
  );
  const weekTotal = stats.weekCreated + stats.weekEdited;
  const writesLabel =
    weekTotal === 0
      ? t("stats.noWrites")
      : t("stats.writes", {
          created: stats.weekCreated,
          edited: stats.weekEdited,
        });
  const chartLabel = t("stats.chartLabel", {
    created: stats.weekCreated,
    edited: stats.weekEdited,
  });

  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const dayLabel = (day: DayActivity) =>
    day.isToday ? t("stats.today") : weekday.format(day.date);

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
        <StatCard span={8} title={t("stats.thisWeek")}>
          <p className="stats-headline text-title-medium">{writesLabel}</p>
          <div className="week-chart" role="img" aria-label={chartLabel}>
            <div className="week-chart-bars" aria-hidden="true">
              {stats.weekActivity.map((day: DayActivity) => (
                <div
                  key={day.date}
                  className={`week-day${day.isToday ? " today" : ""}`}
                >
                  <div className="week-day-bars">
                    <WeekBar
                      value={day.created}
                      max={maxWeek}
                      variant="created"
                    />
                    <WeekBar
                      value={day.edited}
                      max={maxWeek}
                      variant="edited"
                    />
                  </div>
                  <span className="week-day-label text-label-small">
                    {dayLabel(day)}
                  </span>
                </div>
              ))}
            </div>
            <div className="week-legend" aria-hidden="true">
              <span className="week-legend-item text-label-small">
                <span className="week-legend-swatch created" />
                {t("common.created")}
              </span>
              <span className="week-legend-item text-label-small">
                <span className="week-legend-swatch edited" />
                {t("common.edited")}
              </span>
            </div>
          </div>
        </StatCard>

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

        <StatCard span={7} title={t("stats.whereNotesLive")}>
          <p className="stats-card-subtitle text-body-small">
            {t("stats.notesAcross", {
              notes: formatNumber(stats.noteCount, locale),
              notebooks: formatNumber(stats.notebookStats.length, locale),
            })}
          </p>

          <ul className="notebook-bars">
            {stats.notebookStats.map((notebook) => (
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
                      width: `${Math.round(
                        (notebook.count / maxNotebook) * 100,
                      )}%`,
                    }}
                  />
                </span>
                <span className="notebook-bar-count text-body-medium">
                  {notebook.count}
                </span>
              </li>
            ))}
          </ul>

          {stats.emptyNotebooks.length > 0 && (
            <p className="stats-card-footnote text-body-small">
              {formatEmptyNotebooks(stats.emptyNotebooks)}
            </p>
          )}
        </StatCard>

        <StatCard span={5} title={t("stats.pinnedAndFavorites")}>
          <button
            type="button"
            className="stats-link-row"
            onClick={openPinned}
          >
            <span
              className="material-symbols-rounded stats-link-icon"
              aria-hidden="true"
            >
              push_pin
            </span>
            <span className="stats-link-count text-title-medium">
              {formatNumber(stats.pinnedCount, locale)}
            </span>
            <span className="stats-link-label text-body-medium">
              {t("stats.pinnedNotes")}
            </span>
            <span
              className="material-symbols-rounded stats-link-arrow"
              aria-hidden="true"
            >
              arrow_forward
            </span>
          </button>

          <button
            type="button"
            className="stats-link-row"
            onClick={openFavorites}
          >
            <span
              className="material-symbols-rounded stats-link-icon"
              aria-hidden="true"
            >
              star
            </span>
            <span className="stats-link-count text-title-medium">
              {formatNumber(stats.favoriteCount, locale)}
            </span>
            <span className="stats-link-label text-body-medium">
              {t("stats.favorites")}
            </span>
            <span
              className="material-symbols-rounded stats-link-arrow"
              aria-hidden="true"
            >
              arrow_forward
            </span>
          </button>
        </StatCard>

        <StatCard span={12} title={t("stats.pickUp")}>
          <div className="stats-recent">
            {recent.map((item) => {
              const notebookName = item.note
                ? notebookNames[item.note.notebookId]
                : undefined;
              const preview = item.note ? notePreview(item.note) : "";

              return (
                <button
                  key={item.tag}
                  type="button"
                  className="recent-item"
                  disabled={!item.note}
                  onClick={() => {
                    if (item.note) onOpenNote(item.note);
                  }}
                >
                  <span className="recent-item-title text-title-small">
                    {item.note
                      ? item.note.title.trim() || t("common.untitled")
                      : t("stats.noNotesYet")}
                  </span>
                  <span className="recent-item-preview text-body-small">
                    {preview || notebookName || "—"}
                  </span>
                  <span className="recent-item-meta">
                    <span className="recent-tag text-label-small">
                      {item.tag}
                    </span>
                    {item.note && item.time && (
                      <span className="recent-time text-body-small">
                        {relativeTime(item.time)}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </StatCard>

        <StatCard span={12} title={t("stats.storage")} className="stats-storage">
          {supported ? (
            <div className="stats-storage-body">
              <span className="stats-big-number text-display-small">
                {formatBytes(bytes)}
              </span>
              <div className="stats-storage-right">
                <div
                  className={`storage-thin-bar${
                    percent >= 80 ? " warning" : ""
                  }`}
                  role="progressbar"
                  aria-label={t("stats.storageUsed")}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(percent)}
                >
                  <div
                    className="storage-thin-fill"
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>
                <div className="stats-storage-meta text-body-small">
                  <span>
                    {t("stats.percentUsed", {
                      percent: percent.toFixed(1),
                    })}
                  </span>
                  <span>
                    {t("stats.browserLimit", { size: formatBytes(quota) })}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="stats-card-subtitle text-body-small">
              {t("stats.storageUnavailable")}
            </p>
          )}
        </StatCard>
      </div>
    </div>
  );
};
