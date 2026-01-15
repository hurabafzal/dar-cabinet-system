import { create } from "zustand";

export interface ModelSlice {
    droppedModel: object[];
    clickedModel: any;
    seletedModel: any;
    isDoubleClickedModel: boolean,
    clickedComponent: string;
    clickOutline: boolean[];
    showCuboidCollider: boolean[];
    setDroppedModel: (model: object[]) => void;
    setClickedModel: (clickedModel: any) => void;
    setSeletedModel: (seletedModel: any) => void;
    setIsDoubleClickedModel: (isDoubleClickedModel: boolean) => void;
    setClickedComponent: (clickedComponent: string) => void;
    setClickOutline: (clickOutline: boolean[]) => void;
    setShowCuboidCollider: (clickOutline: boolean[]) => void;
}

export const useModelStore = create<ModelSlice>((set: any) => ({
    droppedModel: [],
    clickedModel: null,
    seletedModel: null,
    isDoubleClickedModel: false,
    clickedComponent: "",
    clickOutline: [],
    showCuboidCollider: [],
    setDroppedModel: (droppedModel: object[]) => set({ droppedModel }),
    setClickedModel: (clickedModel: string) => set({ clickedModel }),
    setSeletedModel: (seletedModel: string) => set({ seletedModel }),
    setIsDoubleClickedModel: (isDoubleClickedModel: boolean) => set({ isDoubleClickedModel }),
    setClickedComponent: (clickedComponent: string) => set({ clickedComponent }),
    setClickOutline: (clickOutline: boolean[]) => set({ clickOutline }),
    setShowCuboidCollider: (showCuboidCollider: boolean[]) => set({ showCuboidCollider }),
}));