import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { takeLaunchIntent } from "@/app/launchIntent";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import { useUIStore } from "@/shared/stores/useUIStore";

/**
 * Pick a writable notebook for a launched action, creating the Inbox notebook
 * on first use so a shared note can never be silently dropped.
 */
const ensureNotebook = (inboxName: string): string => {
  const state = useNoteStore.getState();
  const visible = state.notebooks.filter(
    (notebook) => notebook.deletedAt === null,
  );
  const active =
    visible.find((notebook) => notebook.id === state.activeNotebookId) ??
    visible[0];

  if (active) return active.id;

  const created = state.addNotebook(inboxName);
  state.setActiveNotebook(created.id);
  return created.id;
};

/**
 * Applies OS share-target payloads and manifest shortcut actions captured at
 * startup. Shared content opens a prefilled draft rather than writing a note
 * before the user has a chance to review it.
 */
export const useLaunchIntent = () => {
  const { t } = useTranslation();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (appliedRef.current) return;
    appliedRef.current = true;

    const intent = takeLaunchIntent();
    if (!intent) return;

    const ui = useUIStore.getState();

    if (intent.kind === "shortcut" && intent.action === "search") {
      ui.openSearch();
      return;
    }

    const notebookId = ensureNotebook(t("pwa.inboxNotebook"));
    const noteStore = useNoteStore.getState();
    noteStore.setActiveNotebook(notebookId);
    ui.showNotes();

    if (intent.kind === "share") {
      ui.openCreateNoteModal(intent.seed);
      return;
    }

    ui.openCreateNoteModal();
  }, [t]);
};
