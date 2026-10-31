import { useEffect } from "react";
import { TRASH_PURGE_INTERVAL_MS } from "@/shared/lib/constants";
import { scheduleTrashPurge } from "@/shared/lib/trashPurge";
import { useNoteStore } from "@/shared/stores/useNoteStore";

/** Keep the trash purged while the tab stays open for a long time. */
export const useTrashPurge = (retentionMs: number | null) => {
  useEffect(() => {
    if (retentionMs === null) return;

    return scheduleTrashPurge(
      () => useNoteStore.getState().purgeExpiredTrash(retentionMs),
      TRASH_PURGE_INTERVAL_MS,
    );
  }, [retentionMs]);
};
