import { useMemo, type ReactNode } from "react";
import { useNoteStore } from "../store/useNoteStore";
import { useUIStore } from "../store/useUIStore";
import type { Note } from "../types";
import { getRelativeTime } from "../utils";
import { stripMarkdown } from "../utils/search";
import { computeLibraryStats, type DayActivity } from "../utils/stats";
import { formatBytes } from "../utils/storage";
import { useStorageUsage } from "../hooks/useStorageUsage";

interface StatisticsViewProps {
  onOpenNote: (note: Note) => void;
  onNewNote: () => void;
}

const formatNumber = (value: number): string => value.toLocaleString();

const formatAverage = (value: number): string =>
  Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { maximumFractionDigits: 1 });

const noteTitle = (note: Note): string => note.title.trim() || "Untitled";

const notePreview = (note: Note): string => {
  const text = stripMarkdown(note.text).replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > 140 ? `${text.slice(0, 140).trimEnd()}…` : text;
};

const formatEmptyNotebooks = (names: string[]): string => {
  const shown = names.slice(0, 3);
  const remaining = names.length - shown.length;
  const list = remaining > 0 ? `${shown.join(", ")} and ${remaining} more` : shown.join(", ");
  const noun = names.length === 1 ? "notebook is" : "notebooks are";
  return `${names.length} ${noun} empty: ${list}.`;
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
  const notebooks = useNoteStore((state) => state.notebooks);
  const activeNotebookId = useNoteStore((state) => state.activeNotebookId);
  const openPinned = useUIStore((state) => state.openPinned);
  const openFavorites = useUIStore((state) => state.openFavorites);

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

  if (stats.noteCount === 0) {
    return (
      <div className="stats-view" data-note-panel>
        <h2 className="title text-title-medium">Statistics</h2>
        <div className="empty-notes">
          <span className="material-symbols-rounded" aria-hidden="true">
            insights
          </span>
          <div className="text-headline-small">No notes yet</div>
          <p className="text-body-small">
            Write your first note to see your writing stats here.
          </p>
          <button
            className="btn fill"
            type="button"
            disabled={stats.notebookCount === 0}
            onClick={onNewNote}
          >
            <span className="text-label-large">New note</span>
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
      ? "No notes written or edited this week."
      : `${stats.weekCreated} ${
          stats.weekCreated === 1 ? "note" : "notes"
        } written, ${stats.weekEdited} edited.`;
  const chartLabel = `${stats.weekCreated} notes created and ${stats.weekEdited} edited over the last 7 days.`;

  const recent = [
    {
      tag: "Last edited",
      note: stats.lastUpdated,
      time: stats.lastUpdated?.updatedOn,
    },
    {
      tag: "Last created",
      note: stats.lastCreated,
      time: stats.lastCreated?.postedOn,
    },
  ];

  return (
    <div className="stats-view" data-note-panel>
      <h2 className="title text-title-medium">Statistics</h2>

      <div className="stats-layout">
        <StatCard span={8} title="This week">
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
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="week-legend" aria-hidden="true">
              <span className="week-legend-item text-label-small">
                <span className="week-legend-swatch created" />
                Created
              </span>
              <span className="week-legend-item text-label-small">
                <span className="week-legend-swatch edited" />
                Edited
              </span>
            </div>
          </div>
        </StatCard>

        <StatCard span={4} emphasized title="Total writing">
          <span className="stats-big-number text-display-small">
            {formatNumber(stats.totalWords)}
          </span>
          <span className="stats-big-caption text-body-medium">words</span>
          <dl className="stats-rows">
            <div className="stats-row">
              <dt className="text-body-small">Characters</dt>
              <dd className="text-body-medium">
                {formatNumber(stats.totalChars)}
              </dd>
            </div>
            <div className="stats-row">
              <dt className="text-body-small">Avg. words per note</dt>
              <dd className="text-body-medium">
                {formatAverage(stats.wordsPerNote)}
              </dd>
            </div>
          </dl>
        </StatCard>

        <StatCard span={7} title="Where your notes live">
          <p className="stats-card-subtitle text-body-small">
            {formatNumber(stats.noteCount)} notes across{" "}
            {stats.notebookStats.length} notebooks
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
                      Current
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

        <StatCard span={5} title="Pinned and Favorites">
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
              {formatNumber(stats.pinnedCount)}
            </span>
            <span className="stats-link-label text-body-medium">
              Pinned notes
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
              {formatNumber(stats.favoriteCount)}
            </span>
            <span className="stats-link-label text-body-medium">Favorites</span>
            <span
              className="material-symbols-rounded stats-link-arrow"
              aria-hidden="true"
            >
              arrow_forward
            </span>
          </button>
        </StatCard>

        <StatCard span={12} title="Pick up where you left off">
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
                    {item.note ? noteTitle(item.note) : "No notes yet"}
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
                        {getRelativeTime(item.time)}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </StatCard>

        <StatCard span={12} title="Storage" className="stats-storage">
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
                  aria-label="Storage used"
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
                  <span>{percent.toFixed(1)}% used</span>
                  <span>~{formatBytes(quota)} browser limit</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="stats-card-subtitle text-body-small">
              Storage information isn't available in this browser.
            </p>
          )}
        </StatCard>
      </div>
    </div>
  );
};
