"use client";

import { create } from "zustand";

interface BinSelectionState {
  selectedIds: Set<string>;
  toggleBin(id: string): void;
  setBins(ids: string[]): void;
  clear(): void;
}

export const useRouteBinPicker = create<BinSelectionState>((set) => ({
  selectedIds: new Set(),
  toggleBin: (id) =>
    set((state) => {
      const copy = new Set(state.selectedIds);

      if (copy.has(id)) copy.delete(id);
      else copy.add(id);

      return { selectedIds: copy };
    }),
  setBins: (ids) => set({ selectedIds: new Set(ids) }),
  clear: () => set({ selectedIds: new Set() }),
}));

interface UiChromeState {
  sidebarOpen: boolean;
  toggleSidebar(): void;
}

export const useUiChrome = create<UiChromeState>((set, get) => ({
  sidebarOpen: true,
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
}));
