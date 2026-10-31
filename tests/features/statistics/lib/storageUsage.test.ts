import { describe, expect, it, vi } from "vitest";
import {
  EMPTY_STORAGE_USAGE,
  measureStorageUsage,
  storageBytesFromState,
  storageUsageFromBytes,
} from "@/features/statistics/lib/storageUsage";
import { estimateBytes, STORAGE_QUOTA_BYTES } from "@/shared/lib/storage";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import { useThemeStore } from "@/shared/stores/useThemeStore";

describe("storageUsageFromBytes", () => {
  it("reports bytes against the browser quota", () => {
    expect(storageUsageFromBytes(1024)).toEqual({
      supported: true,
      bytes: 1024,
      quota: STORAGE_QUOTA_BYTES,
      percent: (1024 / STORAGE_QUOTA_BYTES) * 100,
    });
  });

  it("accepts an explicit quota", () => {
    expect(storageUsageFromBytes(100, 400).percent).toBe(25);
  });
});

describe("storageBytesFromState", () => {
  it("counts every persisted note-store key, settings, and theme", () => {
    const state = {
      notebooks: [],
      tags: ["Work"],
      activeNotebookId: null,
      revisions: {},
      settings: { language: "en" },
      theme: "dark",
    };

    const notesJson = JSON.stringify({
      notebooks: [],
      tags: ["Work"],
      activeNotebookId: null,
      revisions: {},
    });

    expect(storageBytesFromState(state)).toBe(
      estimateBytes(notesJson) +
        estimateBytes('{"language":"en"}') +
        estimateBytes("dark"),
    );
  });
});

describe("measureStorageUsage", () => {
  it("reads the current store snapshots", () => {
    const notes = useNoteStore.getState();
    const settings = useSettingsStore.getState();
    const theme = useThemeStore.getState();

    const bytes = storageBytesFromState({
      notebooks: notes.notebooks,
      tags: notes.tags,
      activeNotebookId: notes.activeNotebookId,
      revisions: notes.revisions,
      settings,
      theme: theme.theme,
    });

    expect(measureStorageUsage()).toEqual(storageUsageFromBytes(bytes));
  });

  it("reports unsupported storage when access is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    expect(measureStorageUsage()).toEqual(EMPTY_STORAGE_USAGE);
  });
});
