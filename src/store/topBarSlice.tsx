import { create } from "zustand";

export interface TopBarSlice {
    isDeleted: boolean,
    setIsDeleted: (isDeleted: boolean) => void;
}

export const useTopBarStore = create<TopBarSlice>((set: any) => ({
    isDeleted: false,
    setIsDeleted: (isDeleted: boolean) => set({ isDeleted }),
}));