import type { Note, NoteRevision, Notebook } from "@/shared/types";
import { generateID } from "@/shared/lib/id";

/** Kept versions per note, newest last. */
export const MAX_REVISIONS_PER_NOTE = 30;

/**
 * While a note is edited continuously, only snapshot it once per interval. The
 * first save still captures the pre-edit version immediately.
 */
export const REVISION_MIN_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Approximate character budget across every note's history. `localStorage` is
 * shared with the notes themselves, so history must not crowd them out.
 */
export const MAX_HISTORY_CHARS = 1_000_000;

const REVISION_OVERHEAD_CHARS = 80;

export type RevisionMap = Record<string, NoteRevision[]>;

const contentKey = (value: Pick<Note, "title" | "text" | "tags">): string =>
  `${value.title}\u0000${value.text}\u0000${value.tags.join("\u0000")}`;

const revisionSize = (revision: NoteRevision): number =>
  revision.title.length +
  revision.text.length +
  revision.tags.reduce((total, tag) => total + tag.length, 0) +
  REVISION_OVERHEAD_CHARS;

const totalSize = (revisions: RevisionMap): number =>
  Object.values(revisions).reduce(
    (total, list) =>
      total + list.reduce((sum, revision) => sum + revisionSize(revision), 0),
    0,
  );

const createRevision = (
  note: Pick<Note, "id" | "title" | "text" | "tags">,
  createdAt: number,
): NoteRevision => ({
  id: generateID(),
  noteId: note.id,
  title: note.title,
  text: note.text,
  tags: [...note.tags],
  createdAt,
});

/**
 * Drop the oldest versions across all notes until the global budget is met.
 * Newest versions are always the last to go.
 */
const trimToBudget = (revisions: RevisionMap): RevisionMap => {
  let size = totalSize(revisions);
  if (size <= MAX_HISTORY_CHARS) return revisions;

  const entries = Object.entries(revisions).flatMap(([noteId, list]) =>
    list.map((revision) => ({ noteId, revision })),
  );
  entries.sort((a, b) => a.revision.createdAt - b.revision.createdAt);

  const dropped = new Set<string>();
  for (const entry of entries) {
    if (size <= MAX_HISTORY_CHARS) break;
    size -= revisionSize(entry.revision);
    dropped.add(entry.revision.id);
  }

  const next: RevisionMap = {};
  for (const [noteId, list] of Object.entries(revisions)) {
    const kept = list.filter((revision) => !dropped.has(revision.id));
    if (kept.length > 0) next[noteId] = kept;
  }

  return next;
};

/**
 * Capture the version that is about to be overwritten. Returns the original map
 * when the newest snapshot already holds this content or when the coalescing
 * interval has not elapsed.
 */
export const appendRevision = (
  revisions: RevisionMap,
  note: Pick<Note, "id" | "title" | "text" | "tags">,
  now: number,
): RevisionMap => {
  const list = revisions[note.id] ?? [];
  const newest = list[list.length - 1];
  const content = contentKey(note);

  if (newest) {
    if (contentKey(newest) === content) return revisions;
    if (now - newest.createdAt < REVISION_MIN_INTERVAL_MS) return revisions;
  }

  const nextList = [...list, createRevision(note, now)].slice(
    -MAX_REVISIONS_PER_NOTE,
  );

  return trimToBudget({ ...revisions, [note.id]: nextList });
};

/** Remove every revision belonging to notes that no longer exist. */
export const pruneRevisions = (
  revisions: RevisionMap,
  notebooks: Notebook[],
): RevisionMap => {
  const noteIds = new Set(
    notebooks.flatMap((notebook) => notebook.notes.map((note) => note.id)),
  );
  const next: RevisionMap = {};
  let changed = false;

  for (const [noteId, list] of Object.entries(revisions)) {
    if (noteIds.has(noteId)) next[noteId] = list;
    else changed = true;
  }

  return changed ? next : revisions;
};

/** Remove history for the given notes (permanent deletion). */
export const removeRevisions = (
  revisions: RevisionMap,
  noteIds: string[],
): RevisionMap => {
  const existing = noteIds.filter((noteId) => noteId in revisions);
  if (existing.length === 0) return revisions;

  const next = { ...revisions };
  existing.forEach((noteId) => delete next[noteId]);
  return next;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const asTimestamp = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const normalizeRevision = (
  value: unknown,
  noteId: string,
): NoteRevision | null => {
  if (!isRecord(value)) return null;

  const createdAt = asTimestamp(value.createdAt);
  if (createdAt === null) return null;

  return {
    id: asString(value.id) || generateID(),
    noteId,
    title: asString(value.title),
    text: asString(value.text),
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    createdAt,
  };
};

/** Coerce a persisted (possibly legacy or malformed) history blob. */
export const normalizeRevisions = (value: unknown): RevisionMap => {
  if (!isRecord(value)) return {};

  const next: RevisionMap = {};
  for (const [noteId, rawList] of Object.entries(value)) {
    if (!noteId || !Array.isArray(rawList)) continue;

    const list = rawList
      .map((raw) => normalizeRevision(raw, noteId))
      .filter((revision): revision is NoteRevision => revision !== null)
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-MAX_REVISIONS_PER_NOTE);

    if (list.length > 0) next[noteId] = list;
  }

  return trimToBudget(next);
};
