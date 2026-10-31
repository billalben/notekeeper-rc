import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { measureStorageUsage } from "@/features/statistics/lib/storageUsage";
import { isStorageUsageWarning } from "@/shared/lib/storage";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import { toast } from "@/shared/stores/useToastStore";
import { useUIStore } from "@/shared/stores/useUIStore";

const SAMPLE_INTERVAL_MS = 60_000;
const CHANGE_DEBOUNCE_MS = 3_000;

/**
 * Warn before a write fails. Storage is sampled on a timer and after store
 * changes rather than on every render, so large libraries stay cheap.
 */
export const useStorageWarning = () => {
  const { t } = useTranslation();
  const hasWarned = useRef(false);

  useEffect(() => {
    let debounceId: number | undefined;

    const sample = () => {
      const { supported, percent } = measureStorageUsage();
      if (!supported) return;

      if (!isStorageUsageWarning(percent)) {
        hasWarned.current = false;
        return;
      }
      if (hasWarned.current) return;

      hasWarned.current = true;
      toast.error(t("toasts.storageAlmostFull"), {
        description: t("toasts.storageAlmostFullDesc"),
        action: {
          label: t("toasts.storageAlmostFullAction"),
          onClick: () => useUIStore.getState().openSettings("data"),
        },
      });
    };

    const scheduleSample = () => {
      window.clearTimeout(debounceId);
      debounceId = window.setTimeout(sample, CHANGE_DEBOUNCE_MS);
    };

    sample();

    const intervalId = window.setInterval(sample, SAMPLE_INTERVAL_MS);
    const unsubscribeNotes = useNoteStore.subscribe(scheduleSample);
    const unsubscribeSettings = useSettingsStore.subscribe(scheduleSample);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") sample();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", sample);

    return () => {
      window.clearTimeout(debounceId);
      window.clearInterval(intervalId);
      unsubscribeNotes();
      unsubscribeSettings();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", sample);
    };
  }, [t]);
};
