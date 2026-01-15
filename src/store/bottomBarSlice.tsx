import { create } from "zustand";

export interface BottomBarSlice {
    selectedMesh: string,
    isclickedMaterialCategory: string;
    selectedMaterial: string;
    isSelectedMaterial: boolean;
    materialKind: string;
    setSelectedMesh: (selectedMesh: string) => void;
    setIsclickedMaterialCategory: (isclickedMaterialCategory: string) => void;
    setSelectedMaterial: (selectedMaterial: string) => void;
    setIsSelectedMaterial: (isSelectedMaterial: boolean) => void;
    setMaterialKind: (materialKind: string) => void;
}

export const useBottomBarStore = create<BottomBarSlice>((set: any) => ({
    selectedMesh: "null",
    isclickedMaterialCategory: "Egger",
    selectedMaterial: "",
    isSelectedMaterial: false,
    materialKind: "Metal",
    setSelectedMesh: (selectedMesh: string) => set({ selectedMesh }),
    setIsclickedMaterialCategory: (isclickedMaterialCategory: string) => set({ isclickedMaterialCategory }),
    setSelectedMaterial: (selectedMaterial: string) => set({ selectedMaterial }),
    setIsSelectedMaterial: (isSelectedMaterial: boolean) => set({ isSelectedMaterial }),
    setMaterialKind: (materialKind: string) => set({ materialKind }),
}));