import type { Notebook } from "../types";
import { generateID } from "../utils";

export const EXPORT_APP = "notekeeper";
export const EXPORT_SCHEMA_VERSION = 1;

export const MIME_JSON = "application/json";
export const MIME_MARKDOWN = "text/markdown";

/**
 * Public export schema. Deliberately decoupled from the internal persisted
 * shape (Zustand's `{ state, version }`) so exports stay stable and readable.
 * Trashed items are omitted and `notebookId` is implicit from nesting.
 */
export interface ExportNote {
  id: string;
  title: string;
  text: string;
  tags: string[];
  postedOn: number;
  updatedOn: number;
  pinned: boolean;
  favorite: boolean;
}

export interface ExportNotebook {
  id: string;
  name: string;
  pinned: boolean;
  notes: ExportNote[];
}

export interface ExportFile {
  app: typeof EXPORT_APP;
  schemaVersion: number;
  exportedAt: string;
  notebooks: ExportNotebook[];
  tags: string[];
}

export interface ExportNoteFile {
  app: typeof EXPORT_APP;
  schemaVersion: number;
  exportedAt: string;
  notebookName: string | null;
  note: ExportNote;
}

/** Minimal note shape used for exports, so live/unsaved editor state works too. */
export interface NoteContent {
  id?: string;
  title: string;
  text: string;
  tags: string[];
  postedOn?: number;
  updatedOn?: number;
  pinned?: boolean;
  favorite?: boolean;
}

export const toExportNote = (note: NoteContent): ExportNote => ({
  id: note.id ?? generateID(),
  title: note.title,
  text: note.text,
  tags: [...note.tags],
  postedOn: note.postedOn ?? 0,
  updatedOn: note.updatedOn ?? note.postedOn ?? 0,
  pinned: note.pinned ?? false,
  favorite: note.favorite ?? false,
});

export const toExportNotebook = (notebook: Notebook): ExportNotebook => ({
  id: notebook.id,
  name: notebook.name,
  pinned: notebook.pinned,
  notes: notebook.notes
    .filter((note) => note.deletedAt === null)
    .map(toExportNote),
});

const visibleNotebooks = (notebooks: Notebook[]): Notebook[] =>
  notebooks.filter((notebook) => notebook.deletedAt === null);

/** Versioned backup of every visible notebook plus the tag registry. */
export const buildExportFile = (
  notebooks: Notebook[],
  tags: string[],
  exportedAt: Date = new Date(),
): ExportFile => ({
  app: EXPORT_APP,
  schemaVersion: EXPORT_SCHEMA_VERSION,
  exportedAt: exportedAt.toISOString(),
  notebooks: visibleNotebooks(notebooks).map(toExportNotebook),
  tags: [...tags],
});

/** Single-notebook export, using the same top-level shape as a full backup. */
export const buildNotebookExportFile = (
  notebook: Notebook,
  exportedAt: Date = new Date(),
): ExportFile => ({
  app: EXPORT_APP,
  schemaVersion: EXPORT_SCHEMA_VERSION,
  exportedAt: exportedAt.toISOString(),
  notebooks: [toExportNotebook(notebook)],
  tags: [],
});

export const buildNoteExportFile = (
  note: NoteContent,
  notebookName: string | null,
  exportedAt: Date = new Date(),
): ExportNoteFile => ({
  app: EXPORT_APP,
  schemaVersion: EXPORT_SCHEMA_VERSION,
  exportedAt: exportedAt.toISOString(),
  notebookName,
  note: toExportNote(note),
});

export const serializeExport = (file: ExportFile | ExportNoteFile): string =>
  JSON.stringify(file, null, 2);

const yamlString = (value: string): string =>
  `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;

const isoOrEmpty = (milliseconds: number | undefined): string =>
  typeof milliseconds === "number" ? new Date(milliseconds).toISOString() : "";

/**
 * Readable Markdown for a note: YAML frontmatter (metadata) followed by the
 * raw note body. Not intended to round-trip with import.
 */
export const noteToMarkdown = (
  note: NoteContent,
  notebookName?: string | null,
): string => {
  const lines = [
    "---",
    `title: ${yamlString(note.title)}`,
    `notebook: ${yamlString(notebookName ?? "")}`,
    `tags: [${note.tags.map(yamlString).join(", ")}]`,
    `postedOn: ${isoOrEmpty(note.postedOn)}`,
    `updatedOn: ${isoOrEmpty(note.updatedOn)}`,
    `pinned: ${note.pinned ?? false}`,
    `favorite: ${note.favorite ?? false}`,
    "---",
    "",
    `# ${note.title || "Untitled"}`,
    "",
    note.text,
    "",
  ];

  return lines.join("\n");
};

export const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

/** Local `YYYY-MM-DD` stamp for descriptive, dated filenames. */
export const dateStamp = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const backupFilename = (date: Date = new Date()): string =>
  `notekeeper-backup-${dateStamp(date)}.json`;

export const notebookFilename = (
  name: string,
  date: Date = new Date(),
  extension: "md" | "json" = "json",
): string =>
  `notekeeper-${slugify(name) || "notebook"}-${dateStamp(date)}.${extension}`;

export const noteFilename = (
  title: string,
  extension: "md" | "json",
  date: Date = new Date(),
): string =>
  `notekeeper-${slugify(title) || "note"}-${dateStamp(date)}.${extension}`;

/**
 * Trigger a client-side file download without any dependency. The object URL
 * is revoked on the next tick so the browser has started the download first.
 */
export const downloadFile = (
  filename: string,
  contents: string,
  mime: string,
): void => {
  const blob = new Blob([contents], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

/** Download a backup of every visible notebook plus the tag registry. */
export const downloadBackupFile = (
  notebooks: Notebook[],
  tags: string[],
): void => {
  const date = new Date();
  downloadFile(
    backupFilename(date),
    serializeExport(buildExportFile(notebooks, tags, date)),
    MIME_JSON,
  );
};

/**
 * Markdown for a whole notebook: a frontmatter block followed by each visible
 * note (which carries its own frontmatter).
 */
export const notebookToMarkdown = (
  notebook: Notebook,
  exportedAt: Date = new Date(),
): string => {
  const notes = notebook.notes.filter((note) => note.deletedAt === null);
  const header = [
    "---",
    `notebook: ${yamlString(notebook.name)}`,
    `exportedAt: ${exportedAt.toISOString()}`,
    `notes: ${notes.length}`,
    "---",
    "",
    `# ${notebook.name || "Untitled"}`,
    "",
  ].join("\n");

  const body = notes
    .map((note) => noteToMarkdown(note, notebook.name))
    .join("\n\n---\n\n");

  return `${header}\n${body}\n`;
};

export const downloadNotebookFile = (
  notebook: Notebook,
  format: "md" | "json" = "json",
): void => {
  const date = new Date();
  if (format === "md") {
    downloadFile(
      notebookFilename(notebook.name, date, "md"),
      notebookToMarkdown(notebook, date),
      MIME_MARKDOWN,
    );
    return;
  }
  downloadFile(
    notebookFilename(notebook.name, date),
    serializeExport(buildNotebookExportFile(notebook, date)),
    MIME_JSON,
  );
};

export const downloadNoteFile = (
  note: NoteContent,
  notebookName: string | null,
  format: "md" | "json",
): void => {
  const date = new Date();
  if (format === "md") {
    downloadFile(
      noteFilename(note.title, "md", date),
      noteToMarkdown(note, notebookName),
      MIME_MARKDOWN,
    );
    return;
  }
  downloadFile(
    noteFilename(note.title, "json", date),
    serializeExport(buildNoteExportFile(note, notebookName, date)),
    MIME_JSON,
  );
};
