import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  getPersistentStorageStatus,
  requestPersistentStorage,
} from "@/shared/lib/persistentStorage";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import { toast } from "@/shared/stores/useToastStore";

const PROMPT_DELAY_MS = 6000;

/**
 * Nudge users once, after onboarding and once they have notes worth keeping,
 * to ask the browser for persistent storage. The Settings → Data row remains
 * available for anyone who dismisses it.
 */
export const usePersistentStoragePrompt = () => {
  const { t } = useTranslation();
  const prompted = useSettingsStore((state) => state.persistencePromptSeen);
  const setPrompted = useSettingsStore(
    (state) => state.setPersistencePromptSeen,
  );
  const tourCompleted = useSettingsStore((state) => state.tourCompleted);
  const hasNotes = useNoteStore((state) =>
    state.notebooks.some(
      (notebook) =>
        notebook.deletedAt === null &&
        notebook.notes.some((note) => note.deletedAt === null),
    ),
  );

  useEffect(() => {
    if (prompted || !tourCompleted || !hasNotes) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void getPersistentStorageStatus().then((status) => {
        if (cancelled || !status.supported || status.persisted) return;

        const toastId = toast.info(t("pwa.persistencePrompt"), {
          description: t("pwa.persistencePromptDesc"),
          duration: 10000,
          action: {
            label: t("pwa.persistencePromptAction"),
            onClick: () => {
              void requestPersistentStorage().then((granted) => {
                if (granted) toast.success(t("pwa.persistenceEnabled"));
                else toast.info(t("pwa.persistenceDenied"));
              });
            },
          },
        });

        // Only consume the one-time prompt if it was actually shown (toasts
        // can be disabled in Settings).
        if (toastId) setPrompted(true);
      });
    }, PROMPT_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [prompted, tourCompleted, hasNotes, setPrompted, t]);
};
