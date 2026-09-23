import { create } from "zustand";
import type { SettingsSection } from "../types";

export type MainView =
  | "all"
  | "recent"
  | "notes"
  | "pinned"
  | "favorites"
  | "trash"
  | "stats";

interface UIStore {
  isAddingNotebook: boolean;
  startAddingNotebook: () => void;
  stopAddingNotebook: () => void;
  isSettingsOpen: boolean;
  openSettings: (section?: SettingsSection) => void;
  closeSettings: () => void;
  settingsSection: SettingsSection;
  setSettingsSection: (section: SettingsSection) => void;
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  view: MainView;
  openAllNotes: () => void;
  openRecent: () => void;
  openTrash: () => void;
  openFavorites: () => void;
  openPinned: () => void;
  openStats: () => void;
  showNotes: () => void;
  activeTags: string[];
  toggleTag: (tag: string) => void;
  removeTagFilter: (tag: string) => void;
  clearTagFilter: () => void;
  isShortcutHelpOpen: boolean;
  openShortcutHelp: () => void;
  closeShortcutHelp: () => void;
  isRecordingShortcut: boolean;
  setRecordingShortcut: (recording: boolean) => void;
  selectedNoteId: string | null;
  selectNote: (noteId: string | null) => void;
  editorNoteId: string | null;
  isCreatingNote: boolean;
  openNoteModal: (noteId: string) => void;
  openCreateNoteModal: () => void;
  closeNoteModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isAddingNotebook: false,
  startAddingNotebook: () => set({ isAddingNotebook: true }),
  stopAddingNotebook: () => set({ isAddingNotebook: false }),
  isSettingsOpen: false,
  openSettings: (section) =>
    set({ isSettingsOpen: true, settingsSection: section ?? "general" }),
  closeSettings: () => set({ isSettingsOpen: false }),
  settingsSection: "general",
  setSettingsSection: (section) => set({ settingsSection: section }),
  isSearchOpen: false,
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  view: "notes",
  openAllNotes: () => set({ view: "all", activeTags: [] }),
  openRecent: () => set({ view: "recent", activeTags: [] }),
  openTrash: () => set({ view: "trash", activeTags: [] }),
  openFavorites: () => set({ view: "favorites", activeTags: [] }),
  openPinned: () => set({ view: "pinned", activeTags: [] }),
  openStats: () => set({ view: "stats", activeTags: [] }),
  showNotes: () => set({ view: "notes" }),
  activeTags: [],
  toggleTag: (tag) =>
    set((state) => ({
      activeTags: state.activeTags.some(
        (item) => item.toLowerCase() === tag.toLowerCase(),
      )
        ? state.activeTags.filter(
            (item) => item.toLowerCase() !== tag.toLowerCase(),
          )
        : [...state.activeTags, tag],
    })),
  removeTagFilter: (tag) =>
    set((state) => ({
      activeTags: state.activeTags.filter(
        (item) => item.toLowerCase() !== tag.toLowerCase(),
      ),
    })),
  clearTagFilter: () => set({ activeTags: [] }),
  isShortcutHelpOpen: false,
  openShortcutHelp: () => set({ isShortcutHelpOpen: true }),
  closeShortcutHelp: () => set({ isShortcutHelpOpen: false }),
  isRecordingShortcut: false,
  setRecordingShortcut: (recording) =>
    set({ isRecordingShortcut: recording }),
  selectedNoteId: null,
  selectNote: (noteId) => set({ selectedNoteId: noteId }),
  editorNoteId: null,
  isCreatingNote: false,
  openNoteModal: (noteId) =>
    set({ editorNoteId: noteId, isCreatingNote: false }),
  openCreateNoteModal: () =>
    set({ editorNoteId: null, isCreatingNote: true }),
  closeNoteModal: () =>
    set({ editorNoteId: null, isCreatingNote: false }),
}));
