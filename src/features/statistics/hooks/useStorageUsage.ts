import { useMemo } from "react";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import { useThemeStore } from "@/shared/stores/useThemeStore";
import {
  estimateBytes,
  isLocalStorageAvailable,
  STORAGE_QUOTA_BYTES,
} from "@/shared/lib/storage";

export interface StorageUsage {
  supported: boolean;
  bytes: number;
  quota: number;
  percent: number;
}

const EMPTY: StorageUsage = {
  supported: false,
  bytes: 0,
  quota: STORAGE_QUOTA_BYTES,
  percent: 0,
};

export const useStorageUsage = (): StorageUsage => {
  const notebooks = useNoteStore((state) => state.notebooks);
  const activeNotebookId = useNoteStore((state) => state.activeNotebookId);
  const toasts = useSettingsStore((state) => state.toasts);
  const editor = useSettingsStore((state) => state.editor);
  const theme = useThemeStore((state) => state.theme);

  return useMemo(() => {
    if (!isLocalStorageAvailable()) return EMPTY;

    const bytes =
      estimateBytes(JSON.stringify({ notebooks, activeNotebookId })) +
      estimateBytes(theme) +
      estimateBytes(JSON.stringify({ toasts, editor }));

    return {
      supported: true,
      bytes,
      quota: STORAGE_QUOTA_BYTES,
      percent: (bytes / STORAGE_QUOTA_BYTES) * 100,
    };
  }, [notebooks, activeNotebookId, toasts, editor, theme]);
};
