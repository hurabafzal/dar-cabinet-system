import { create } from "zustand";

export interface IndexSlice {
  isCreated: boolean,
  isOrbitState: boolean;
  isLoading: boolean;
  selectedLan: string;
  CABINET_ITEMS: any[];
  MATERIAL_ITEMS: any[];
  placedModels: any[];
  currentIndex: number;
  setIsCreated: (isCreated: boolean) => void;
  setIsOrbitState: (isOrbitState: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setSelectedLan: (selectedLan: string) => void;
  setCABINET_ITEMS: (CABINET_ITEMS: any[]) => void;
  setMATERIAL_ITEMS: (MATERIAL_ITEMS: any[]) => void;
  setPlacedModels: (placedModels: any[]) => void;
  setCurrentIndex: (currentIndex: number) => void;

}

export const useIndexStore = create<IndexSlice>((set) => ({
  isCreated: false,
  isOrbitState: false,
  isLoading: false,
  selectedLan: "English",
  CABINET_ITEMS: [],
  MATERIAL_ITEMS: [],
  placedModels: [],
  currentIndex: 0,
  setIsCreated: (isCreated: boolean) => set({ isCreated }),
  setIsOrbitState: (isOrbitState: boolean) => set({ isOrbitState }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setSelectedLan: (selectedLan: string) => set({ selectedLan }),
  setCABINET_ITEMS: (CABINET_ITEMS: any[]) => set({ CABINET_ITEMS }),
  setMATERIAL_ITEMS: (MATERIAL_ITEMS: any[]) => set({ MATERIAL_ITEMS }),
  setPlacedModels: (placedModels: any[]) => set({ placedModels }),
  setCurrentIndex: (currentIndex: number) => set({ currentIndex }),
}));