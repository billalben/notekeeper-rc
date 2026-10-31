import { useMemo } from "react";
import { isLocalStorageAvailable } from "@/shared/lib/storage";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import { useThemeStore } from "@/shared/stores/useThemeStore";
import {
  EMPTY_STORAGE_USAGE,
  storageUsageFromState,
  type StorageUsage,
} from "../lib/storageUsage";

export type { StorageUsage };

export const useStorageUsage = (): StorageUsage => {
  const notebooks = useNoteStore((state) => state.notebooks);
  const tags = useNoteStore((state) => state.tags);
  const activeNotebookId = useNoteStore((state) => state.activeNotebookId);
  const revisions = useNoteStore((state) => state.revisions);
  const settings = useSettingsStore((state) => state);
  const theme = useThemeStore((state) => state.theme);

  return useMemo(() => {
    if (!isLocalStorageAvailable()) return EMPTY_STORAGE_USAGE;

    return storageUsageFromState({
      notebooks,
      tags,
      activeNotebookId,
      revisions,
      settings,
      theme,
    });
  }, [notebooks, tags, activeNotebookId, revisions, settings, theme]);
};
