import { create } from "zustand";

export type MainView = "notes" | "trash";

interface UIStore {
  isAddingNotebook: boolean;
  startAddingNotebook: () => void;
  stopAddingNotebook: () => void;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  view: MainView;
  openTrash: () => void;
  showNotes: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isAddingNotebook: false,
  startAddingNotebook: () => set({ isAddingNotebook: true }),
  stopAddingNotebook: () => set({ isAddingNotebook: false }),
  isSettingsOpen: false,
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  view: "notes",
  openTrash: () => set({ view: "trash" }),
  showNotes: () => set({ view: "notes" }),
}));
