import { create } from "zustand";

interface UIStore {
  isAddingNotebook: boolean;
  startAddingNotebook: () => void;
  stopAddingNotebook: () => void;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isAddingNotebook: false,
  startAddingNotebook: () => set({ isAddingNotebook: true }),
  stopAddingNotebook: () => set({ isAddingNotebook: false }),
  isSettingsOpen: false,
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
}));
