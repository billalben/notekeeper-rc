import type { Note, Notebook } from "@/shared/types";
import { generateID } from "@/shared/lib/id";
import { EXPORT_APP, type ExportFile } from "@/shared/lib/export";
import {
  collectTags,
  mergeTags,
  normalizeTag,
  sortTags,
} from "@/shared/lib/tags";
import { MAX_NOTEBOOK_NAME_LENGTH } from "@/shared/lib/constants";

export interface ImportedBackup {
  notebooks: Notebook[];
  tags: string[];
}

/** Thrown when a selected file is not a recognizable Notekeeper backup. */
export class BackupParseError extends Error {
  constructor(message = "Unrecognized backup format") {
    super(message);
    this.name = "BackupParseError";
  }
}

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const asTimestamp = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const asTags = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const tags: string[] = [];
  for (const raw of value) {
    if (typeof raw !== "string") continue;
    const tag = normalizeTag(raw);
    if (tag && !tags.some((item) => item.toLowerCase() === tag.toLowerCase())) {
      tags.push(tag);
    }
  }
  return tags;
};

/** Build a fresh note, discarding the source ID and reviving any fields. */
const importNote = (raw: unknown, notebookId: string): Note => {
  const note = (raw ?? {}) as Record<string, unknown>;
  const postedOn = asTimestamp(note.postedOn, Date.now());

  return {
    id: generateID(),
    notebookId,
    title: asString(note.title),
    text: asString(note.text),
    tags: asTags(note.tags),
    postedOn,
    updatedOn: asTimestamp(note.updatedOn, postedOn),
    deletedAt: null,
    pinned: note.pinned === true,
    favorite: note.favorite === true,
  };
};

const importNotebook = (raw: unknown): Notebook => {
  const notebook = (raw ?? {}) as Record<string, unknown>;
  const id = generateID();
  const notes = Array.isArray(notebook.notes) ? notebook.notes : [];
  const name = asString(notebook.name).trim();

  return {
    id,
    name: (name || "Untitled").slice(0, MAX_NOTEBOOK_NAME_LENGTH),
    notes: notes.map((note) => importNote(note, id)),
    deletedAt: null,
    pinned: notebook.pinned === true,
  };
};

/**
 * Parse a full-backup JSON file (as produced by "Export all") into internal
 * notebooks ready to append. Every incoming ID is discarded and regenerated so
 * an import can never collide with existing data. The backup's tag registry is
 * folded into the tags actually carried by the imported notes.
 */
export const parseBackupFile = (text: string): ImportedBackup => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupParseError("Backup is not valid JSON");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new BackupParseError("Backup is not an object");
  }

  const file = parsed as Partial<ExportFile>;
  if (file.app !== EXPORT_APP || !Array.isArray(file.notebooks)) {
    throw new BackupParseError("Unrecognized backup format");
  }

  const notebooks = file.notebooks
    .filter((notebook) => notebook !== null && typeof notebook === "object")
    .map(importNotebook);

  const tags = sortTags(mergeTags(collectTags(notebooks), asTags(file.tags)));

  return { notebooks, tags };
};
