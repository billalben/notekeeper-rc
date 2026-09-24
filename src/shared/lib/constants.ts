export const DAY_MS = 24 * 60 * 60 * 1000;

/** Longest allowed notebook name; keeps the sidebar and note cards readable. */
export const MAX_NOTEBOOK_NAME_LENGTH = 100;

/** Media query shared by the sidebar (drawer vs icon rail) and shortcuts. */
export const DESKTOP_QUERY = "(min-width: 992px)";

export const TRASH_RETENTION_DAYS = 30;

export type TrashRetentionDays = number | null;

export const TRASH_RETENTION_OPTIONS: TrashRetentionDays[] = [
  7,
  TRASH_RETENTION_DAYS,
  90,
  null,
];

export const trashRetentionMs = (days: TrashRetentionDays): number | null =>
  days === null ? null : days * DAY_MS;
