import {
  estimateBytes,
  isLocalStorageAvailable,
  STORAGE_QUOTA_BYTES,
} from "@/shared/lib/storage";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import { useThemeStore } from "@/shared/stores/useThemeStore";

export interface StorageUsage {
  supported: boolean;
  bytes: number;
  quota: number;
  percent: number;
}

export const EMPTY_STORAGE_USAGE: StorageUsage = {
  supported: false,
  bytes: 0,
  quota: STORAGE_QUOTA_BYTES,
  percent: 0,
};

interface StorageUsageState {
  notebooks: unknown;
  tags: unknown;
  activeNotebookId: string | null;
  revisions: unknown;
  settings: unknown;
  theme: unknown;
}

export const storageBytesFromState = (state: StorageUsageState): number =>
  estimateBytes(
    JSON.stringify({
      notebooks: state.notebooks,
      tags: state.tags,
      activeNotebookId: state.activeNotebookId,
      revisions: state.revisions,
    }),
  ) +
  estimateBytes(JSON.stringify(state.settings)) +
  estimateBytes(String(state.theme));

export const storageUsageFromBytes = (
  bytes: number,
  quota: number = STORAGE_QUOTA_BYTES,
): StorageUsage => ({
  supported: true,
  bytes,
  quota,
  percent: (bytes / quota) * 100,
});

export const storageUsageFromState = (state: StorageUsageState): StorageUsage =>
  storageUsageFromBytes(storageBytesFromState(state));

/** Read the current store snapshots, for non-React sampling. */
export const measureStorageUsage = (): StorageUsage => {
  if (!isLocalStorageAvailable()) return EMPTY_STORAGE_USAGE;

  const notes = useNoteStore.getState();
  const settings = useSettingsStore.getState();
  const theme = useThemeStore.getState();

  return storageUsageFromState({
    notebooks: notes.notebooks,
    tags: notes.tags,
    activeNotebookId: notes.activeNotebookId,
    revisions: notes.revisions,
    settings,
    theme: theme.theme,
  });
};
