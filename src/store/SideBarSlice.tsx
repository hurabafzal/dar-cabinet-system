import { create } from "zustand";

export interface SideBarSlice {
    draggedModel: string;
    setDraggedModel: (draggedModel: string) => void;
}

export const useSideBarStore = create<SideBarSlice>((set: any) => ({
    draggedModel: "",
    setDraggedModel: (model: string) => set({ draggedModel: model }),
}));