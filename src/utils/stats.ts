import type { Note, Notebook } from "../types";
import { DAY_MS, countWords } from "../utils";

const WEEK_LENGTH = 7;

export interface DayActivity {
  /** Start-of-day timestamp (local midnight). */
  date: number;
  created: number;
  edited: number;
  isToday: boolean;
}

interface NotebookStat {
  id: string;
  name: string;
  count: number;
}

export interface LibraryStats {
  notebookCount: number;
  noteCount: number;
  activeNotebookNoteCount: number;
  totalWords: number;
  totalChars: number;
  wordsPerNote: number;
  pinnedCount: number;
  favoriteCount: number;
  weekActivity: DayActivity[];
  weekCreated: number;
  weekEdited: number;
  notebookStats: NotebookStat[];
  emptyNotebooks: string[];
  lastUpdated: Note | null;
  lastCreated: Note | null;
}

export interface ComputeStatsInput {
  notebooks: Notebook[];
  activeNotebookId: string | null;
  now?: number;
}

/**
 * Every note inside a visible (non-trashed) notebook, excluding trashed notes.
 * This is the pool all library statistics are derived from; trashed items are
 * intentionally omitted, matching Favorites, tag filtering, and search.
 */
const collectVisibleNotes = (notebooks: Notebook[]): Note[] =>
  notebooks
    .filter((notebook) => notebook.deletedAt === null)
    .flatMap((notebook) =>
      notebook.notes.filter((note) => note.deletedAt === null),
    );

const latestBy = (notes: Note[], key: (note: Note) => number): Note | null =>
  notes.reduce<Note | null>(
    (latest, note) => (!latest || key(note) > key(latest) ? note : latest),
    null,
  );

const startOfDay = (milliseconds: number): number => {
  const date = new Date(milliseconds);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

/**
 * Created/edited counts for the last seven days, oldest first. The final bucket
 * is today; a note counts as edited only when it changed after it was created.
 */
const buildWeekActivity = (notes: Note[], now: number): DayActivity[] => {
  const todayStart = startOfDay(now);
  const days: DayActivity[] = [];

  for (let offset = WEEK_LENGTH - 1; offset >= 0; offset -= 1) {
    const date = todayStart - offset * DAY_MS;
    const end = date + DAY_MS;
    const isToday = offset === 0;

    days.push({
      date,
      created: notes.filter(
        (note) => note.postedOn >= date && note.postedOn < end,
      ).length,
      edited: notes.filter(
        (note) =>
          note.updatedOn >= date &&
          note.updatedOn < end &&
          note.updatedOn > note.postedOn,
      ).length,
      isToday,
    });
  }

  return days;
};

export const computeLibraryStats = ({
  notebooks,
  activeNotebookId,
  now = Date.now(),
}: ComputeStatsInput): LibraryStats => {
  const visibleNotebooks = notebooks.filter(
    (notebook) => notebook.deletedAt === null,
  );
  const notes = collectVisibleNotes(notebooks);

  const activeNotebook = visibleNotebooks.find(
    (notebook) => notebook.id === activeNotebookId,
  );
  const activeNotebookNoteCount =
    activeNotebook?.notes.filter((note) => note.deletedAt === null).length ?? 0;

  const totalWords = notes.reduce(
    (total, note) => total + countWords(note.text),
    0,
  );

  const notebookStats = visibleNotebooks
    .map((notebook) => ({
      id: notebook.id,
      name: notebook.name,
      count: notebook.notes.filter((note) => note.deletedAt === null).length,
    }))
    .filter((notebook) => notebook.count > 0)
    .sort((a, b) => b.count - a.count);

  const emptyNotebooks = visibleNotebooks
    .filter((notebook) =>
      notebook.notes.every((note) => note.deletedAt !== null),
    )
    .map((notebook) => notebook.name);

  const weekActivity = buildWeekActivity(notes, now);

  return {
    notebookCount: visibleNotebooks.length,
    noteCount: notes.length,
    activeNotebookNoteCount,
    totalWords,
    totalChars: notes.reduce((total, note) => total + note.text.length, 0),
    wordsPerNote: notes.length > 0 ? totalWords / notes.length : 0,
    pinnedCount: notes.filter((note) => note.pinned).length,
    favoriteCount: notes.filter((note) => note.favorite).length,
    weekActivity,
    weekCreated: weekActivity.reduce((total, day) => total + day.created, 0),
    weekEdited: weekActivity.reduce((total, day) => total + day.edited, 0),
    notebookStats,
    emptyNotebooks,
    lastUpdated: latestBy(notes, (note) => note.updatedOn),
    lastCreated: latestBy(notes, (note) => note.postedOn),
  };
};
