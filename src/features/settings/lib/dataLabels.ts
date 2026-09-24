import type { TrashRetentionDays } from "@/shared/lib/constants";

export type DeleteScope = "notes" | "notebooks" | "all";

export const CONFIRM_WORD = "DELETE";

export type ActionLabelKey =
  | "settings.data.actionLabels.notes"
  | "settings.data.actionLabels.notebooks"
  | "settings.data.actionLabels.all";

export const ACTION_LABEL_KEYS: Record<DeleteScope, ActionLabelKey> = {
  notes: "settings.data.actionLabels.notes",
  notebooks: "settings.data.actionLabels.notebooks",
  all: "settings.data.actionLabels.all",
};

export type RetentionLabelKey =
  | "settings.data.retentionD7"
  | "settings.data.retentionD30"
  | "settings.data.retentionD90"
  | "settings.data.retentionForever";

export const RETENTION_LABEL_KEYS: Record<string, RetentionLabelKey> = {
  "7": "settings.data.retentionD7",
  "30": "settings.data.retentionD30",
  "90": "settings.data.retentionD90",
  forever: "settings.data.retentionForever",
};

export const retentionKey = (value: TrashRetentionDays): string =>
  value === null ? "forever" : String(value);

export const blockEdit = (event: { preventDefault: () => void }) =>
  event.preventDefault();
