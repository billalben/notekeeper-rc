import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import { useUIStore } from "@/shared/stores/useUIStore";
import type { Note } from "@/shared/types";
import {
  baseKey,
  buildHash,
  normalizeHash,
  parseHash,
  routeDepth,
} from "./hashRoute";
import {
  canGoBackTo,
  goBack,
  initHistory,
  pushRoute,
  replaceRoute,
  syncFromLocation,
} from "./history";
import type { BaseView, Overlay, Route } from "./types";

const findVisibleNote = (id: string): Note | null => {
  for (const notebook of useNoteStore.getState().notebooks) {
    const note = notebook.notes.find((item) => item.id === id);
    if (note && note.deletedAt === null) return note;
  }
  return null;
};

/** Build the canonical route for the current store state. */
const routeFromState = (): Route => {
  const ui = useUIStore.getState();
  const { activeNotebookId } = useNoteStore.getState();

  let base: BaseView;
  let notebookId: string | null = null;
  if (ui.view === "notes") {
    if (activeNotebookId) {
      base = "notebook";
      notebookId = activeNotebookId;
    } else {
      base = "all";
    }
  } else {
    base = ui.view;
  }

  let overlay: Overlay = null;
  if (ui.isSettingsOpen) {
    overlay = { kind: "settings", section: ui.settingsSection };
  } else if (ui.isSearchOpen) {
    overlay = { kind: "search" };
  } else if (ui.isShortcutHelpOpen) {
    overlay = { kind: "shortcuts" };
  }

  return {
    base,
    notebookId,
    noteId: ui.selectedNoteId ?? ui.editorNoteId,
    overlay,
  };
};

const isSplitMode = (isWide: boolean): boolean => {
  const { view } = useUIStore.getState();
  const { presentation } = useSettingsStore.getState().editor;
  return (
    presentation === "split" && isWide && view !== "stats" && view !== "trash"
  );
};

/** Apply a parsed route to the stores, sanitizing anything missing. */
const applyRoute = (route: Route, isWide: boolean): void => {
  const ui = useUIStore.getState();
  const noteStore = useNoteStore.getState();
  const visibleNotebooks = noteStore.notebooks.filter(
    (notebook) => notebook.deletedAt === null,
  );

  if (route.base === "notebook") {
    const id =
      route.notebookId &&
      visibleNotebooks.some((notebook) => notebook.id === route.notebookId)
        ? route.notebookId
        : (visibleNotebooks[0]?.id ?? null);
    ui.clearTagFilter();
    noteStore.setActiveNotebook(id);
    ui.showNotes();
  } else {
    switch (route.base) {
      case "all":
        ui.openAllNotes();
        break;
      case "recent":
        ui.openRecent();
        break;
      case "pinned":
        ui.openPinned();
        break;
      case "favorites":
        ui.openFavorites();
        break;
      case "stats":
        ui.openStats();
        break;
      case "trash":
        ui.openTrash();
        break;
    }
  }

  const split = isSplitMode(isWide);
  const note = route.noteId ? findVisibleNote(route.noteId) : null;
  if (note) {
    if (split) {
      ui.selectNote(note.id);
      ui.closeNoteModal();
    } else if (!route.overlay) {
      ui.openNoteModal(note.id);
      ui.selectNote(null);
    } else {
      ui.selectNote(null);
      ui.closeNoteModal();
    }
  } else {
    ui.selectNote(null);
    ui.closeNoteModal();
  }

  if (route.overlay?.kind === "settings") {
    ui.openSettings(route.overlay.section);
  } else if (route.overlay?.kind === "search") {
    ui.openSearch();
  } else if (route.overlay?.kind === "shortcuts") {
    ui.openShortcutHelp();
  } else {
    ui.closeSettings();
    ui.closeSearch();
    ui.closeShortcutHelp();
  }
};

const writeHash = (): void => {
  const next = buildHash(routeFromState());
  const current = normalizeHash(window.location.hash);
  if (next === current) return;

  const nextDepth = routeDepth(parseHash(next));
  const currentDepth = routeDepth(parseHash(current));

  if (nextDepth > currentDepth) {
    pushRoute(next);
  } else if (nextDepth < currentDepth) {
    if (canGoBackTo(next)) goBack();
    else replaceRoute(next);
  } else if (baseKey(parseHash(next)) !== baseKey(parseHash(current))) {
    pushRoute(next);
  } else {
    replaceRoute(next);
  }
};

/**
 * Keeps the URL hash and the app's view state in sync. Navigation pushes a
 * history entry (so Back closes modals / returns to the previous section),
 * while state changes that restore a route replace the current entry.
 */
export const useHashRoute = (isWide: boolean): void => {
  const isWideRef = useRef(isWide);
  const applyingRef = useRef(false);
  const scheduledRef = useRef(false);

  useEffect(() => {
    isWideRef.current = isWide;
  }, [isWide]);

  const scheduleSync = useCallback(() => {
    if (applyingRef.current || scheduledRef.current) return;
    scheduledRef.current = true;
    queueMicrotask(() => {
      scheduledRef.current = false;
      if (applyingRef.current) return;
      writeHash();
    });
  }, []);

  useLayoutEffect(() => {
    const initial = normalizeHash(window.location.hash);
    if (initial === "#/") {
      initHistory(buildHash(routeFromState()));
    } else {
      initHistory(initial);
      applyingRef.current = true;
      applyRoute(parseHash(initial), isWideRef.current);
      applyingRef.current = false;
      const target = buildHash(routeFromState());
      if (target !== initial) replaceRoute(target);
    }

    const unsubscribe = [
      useUIStore.subscribe(scheduleSync),
      useNoteStore.subscribe(scheduleSync),
      useSettingsStore.subscribe(scheduleSync),
    ];

    const handleLocationChange = () => {
      const current = normalizeHash(window.location.hash);
      syncFromLocation(current);
      applyingRef.current = true;
      applyRoute(parseHash(current), isWideRef.current);
      applyingRef.current = false;
      const target = buildHash(routeFromState());
      if (target !== current) replaceRoute(target);
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("hashchange", handleLocationChange);

    return () => {
      unsubscribe.forEach((off) => off());
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, [scheduleSync]);
};
