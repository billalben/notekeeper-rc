import { create } from "zustand";

export type MainView = "notes" | "favorites" | "trash";

interface UIStore {
  isAddingNotebook: boolean;
  startAddingNotebook: () => void;
  stopAddingNotebook: () => void;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  view: MainView;
  openTrash: () => void;
  openFavorites: () => void;
  showNotes: () => void;
  activeTags: string[];
  toggleTag: (tag: string) => void;
  removeTagFilter: (tag: string) => void;
  clearTagFilter: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isAddingNotebook: false,
  startAddingNotebook: () => set({ isAddingNotebook: true }),
  stopAddingNotebook: () => set({ isAddingNotebook: false }),
  isSettingsOpen: false,
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  view: "notes",
  openTrash: () => set({ view: "trash", activeTags: [] }),
  openFavorites: () => set({ view: "favorites", activeTags: [] }),
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
}));
