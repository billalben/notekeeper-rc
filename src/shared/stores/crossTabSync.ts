import { STORAGE_KEY } from "./notes/persistence";
import { useNoteStore } from "./useNoteStore";

const isNoteStoreEvent = (event: StorageEvent): boolean =>
  event.key === null || event.key === STORAGE_KEY;

let isRehydrateScheduled = false;

/**
 * Rehydrate once per event-loop turn. A tab can emit several storage writes in
 * quick succession (for example an autosave followed by a metadata change), and
 * only the latest persisted blob matters.
 */
const scheduleRehydrate = (): void => {
  if (isRehydrateScheduled) return;
  isRehydrateScheduled = true;

  queueMicrotask(() => {
    isRehydrateScheduled = false;
    void useNoteStore.persist.rehydrate();
  });
};

/**
 * Keep this tab's note store in sync with writes made by other tabs. `storage`
 * events never fire in the tab that performed the write, so this cannot loop.
 * The store's custom `merge` preserves the local active notebook when it still
 * exists, which keeps navigation stable while notes update underneath it.
 */
export const subscribeToNoteStoreSync = (): (() => void) => {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (!isNoteStoreEvent(event)) return;
    scheduleRehydrate();
  };

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
};
